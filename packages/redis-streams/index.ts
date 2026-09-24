import { createClient } from "redis";

const client = await createClient({ url: process.env.REDIS_URL })
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();

type WebsiteEvent = { url: string; id: string };

type MessageType = {
    id: string;
    message: {
        url: string;
        id: string;
    };
};

const STREAM_NAME = "betteruptime:website";
const MAX_STREAM_LENGTH = 10_000;

// ---------- producer side (used by the pusher) ----------

export async function xAddBulk(websites: WebsiteEvent[]) {
    if (websites.length === 0) return;

    // send all XADD commands in one round trip
    const multi = client.multi();
    for (const website of websites) {
        if (!website) continue;
        multi.xAdd(
            STREAM_NAME,
            "*",
            { url: website.url, id: website.id },
            {
                // keep the stream from growing forever (~ = approximate, cheaper)
                TRIM: {
                    strategy: "MAXLEN",
                    strategyModifier: "~",
                    threshold: MAX_STREAM_LENGTH,
                },
            }
        );
    }
    await multi.exec();
}

// ---------- consumer side (used by the workers) ----------

// call once at worker startup
export async function ensureGroup(consumerGroup: string) {
    try {
        await client.xGroupCreate(STREAM_NAME, consumerGroup, "0", {
            MKSTREAM: true,
        });
    } catch (e: any) {
        // BUSYGROUP means the group already exists, which is fine
        if (!String(e?.message).includes("BUSYGROUP")) {
            throw e;
        }
    }
}

// read new messages that no worker has received yet
export async function xReadGroup(
    consumerGroup: string,
    workerId: string
): Promise<MessageType[] | undefined> {
    const res = await client.xReadGroup(
        consumerGroup,
        workerId,
        { key: STREAM_NAME, id: ">" },
        { COUNT: 5 }
    );

    //@ts-ignore
    const messages: MessageType[] | undefined = res?.[0]?.messages;
    return messages;
}

// take over messages that were delivered earlier but never acked
export async function xAutoClaimStale(
    consumerGroup: string,
    workerId: string,
    minIdleMs = 60_000,
    count = 5
): Promise<MessageType[]> {
    const res = await client.xAutoClaim(
        STREAM_NAME,
        consumerGroup,
        workerId,
        minIdleMs,
        "0-0",
        { COUNT: count }
    );
    // entries can be null if the message was deleted from the stream
    return res.messages.filter(Boolean) as unknown as MessageType[];
}

// acknowledge many messages with a single command
export async function xAckBulk(consumerGroup: string, streamIds: string[]) {
    if (streamIds.length === 0) return;
    await client.xAck(STREAM_NAME, consumerGroup, streamIds);
}
