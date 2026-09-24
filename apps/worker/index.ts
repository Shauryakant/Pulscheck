import client from "@repo/db/client";
import {
    ensureGroup,
    xAckBulk,
    xAutoClaimStale,
    xReadGroup,
} from "@repo/redis/client";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const REGION_ID = process.env.REGION_ID;
const WORKER_ID = process.env.WORKER_ID;

const REQUEST_TIMEOUT_MS = 10_000;
const IDLE_SLEEP_MS = 5_000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function main() {
    if (!REGION_ID || !WORKER_ID) {
        console.error("REGION_ID and WORKER_ID must be set");
        process.exit(1);
    }
    console.log(`Worker ${WORKER_ID} started in region ${REGION_ID}`);

    // create the consumer group once, not on every loop
    await ensureGroup(REGION_ID);

    while (true) {
        try {
            // 1. retry old unacked messages, then 2. read new ones
            const stale = await xAutoClaimStale(REGION_ID, WORKER_ID);
            const fresh = (await xReadGroup(REGION_ID, WORKER_ID)) ?? [];
            const res = [...stale, ...fresh];

            if (res.length === 0) {
                await sleep(IDLE_SLEEP_MS);
                continue;
            }

            // run all checks; allSettled so one failure doesn't break the batch
            const results = await Promise.allSettled(
                res.map(({ message }) => fetchWebsite(message.url, message.id))
            );

            // ack only messages that were fully processed (check + DB write)
            const ackIds = res
                .filter((_, i) => results[i]?.status === "fulfilled")
                .map(({ id }) => id);

            await xAckBulk(REGION_ID, ackIds);

            console.log(
                `Processed ${ackIds.length}, failed ${res.length - ackIds.length}`
            );
        } catch (err) {
            // e.g. Redis connection issue; keep the worker alive
            console.error("Worker loop error:", err);
            await sleep(IDLE_SLEEP_MS);
        }
    }
}

async function fetchWebsite(url: string, websiteId: string): Promise<void> {
    const startTime = Date.now();
    let status: "Up" | "Down" = "Up";

    // only the HTTP request decides Up or Down
    try {
        await axios.get(url, { timeout: REQUEST_TIMEOUT_MS });
    } catch {
        status = "Down";
    }

    const responseTimeMs = Date.now() - startTime;

    // DB write is outside try/catch: if it fails, this rejects,
    // the message is not acked, and it gets retried later
    await client.websiteTicks.create({
        data: {
            response_time_ms: responseTimeMs,
            status,
            region_id: REGION_ID!,
            website_id: websiteId,
        },
    });
}

main();
