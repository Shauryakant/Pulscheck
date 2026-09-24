import client from '@repo/db/client';
import { xAckBulk, xReadGroup } from '@repo/redis/client';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const REGION_ID = process.env.REGION_ID;
const WORKER_ID = process.env.WORKER_ID;

const REQUEST_TIMEOUT_MS = 10_000;
const IDLE_SLEEP_MS = 5_000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function main() {
  if (!REGION_ID || !WORKER_ID) {
    console.error("REGION_ID and WORKER_ID must be set");
    return;
  }
  console.log(`Worker ${WORKER_ID} started in region ${REGION_ID}`);

  while (true) {
    try {
      // read from the stream
      const res = await xReadGroup(REGION_ID, WORKER_ID);

      if (!res || res.length === 0) {
        // sleep before checking again to save Redis commands
        await sleep(IDLE_SLEEP_MS);
        continue;
      }

      // run all checks; allSettled so one failure doesn't reject the batch
      const results = await Promise.allSettled(
        res.map(({ message }) => fetchWebsite(message.url, message.id))
      );

      // ack only the messages that were fully processed (check + DB write).
      // failed ones stay pending so they can be claimed and retried later.
      const ackIds = res
        .filter((_, i) => results[i].status === "fulfilled")
        .map(({ id }) => id);

      if (ackIds.length > 0) {
        await xAckBulk(REGION_ID, ackIds);
      }

      const failed = results.length - ackIds.length;
      console.log(`Processed ${ackIds.length}, failed ${failed}`);

      // TODO: XAUTOCLAIM to reassign stale pending messages to the consumer group
    } catch (err) {
      // e.g. Redis connection issue; don't crash the worker
      console.error("Worker loop error:", err);
      await sleep(IDLE_SLEEP_MS);
    }
  }
}

async function fetchWebsite(url: string, websiteId: string): Promise<void> {
  const startTime = Date.now();
  let status: "Up" | "Down" = "Up";

  // only the HTTP request decides Up/Down
  try {
    await axios.get(url, { timeout: REQUEST_TIMEOUT_MS });
  } catch {
    status = "Down";
  }

  const responseTimeMs = Date.now() - startTime;

  // DB write is outside the try/catch: if it fails, this function rejects,
  // the message is not acked, and it can be retried
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
