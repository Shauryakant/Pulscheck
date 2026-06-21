import { createClient } from 'redis';

const REDIS_URL = 'rediss://default:gQAAAAAAAgnFAAIgcDI2MDI0ZjBhNTkyNTQ0YTFhOTQ5M2MyNzVhNzE1ZjRmOQ@united-kiwi-133573.upstash.io:6379';

async function main() {
  const client = createClient({ url: REDIS_URL });
  
  client.on('error', (err) => console.log('Redis Client Error', err));
  await client.connect();

  try {
    // Attempt to create the consumer group
    await client.xGroupCreate('betteruptime:website', 'us-east-1', '$', { MKSTREAM: true });
    console.log('Consumer group created successfully');
  } catch (err) {
    if (err.message.includes('BUSYGROUP')) {
      console.log('Consumer group already exists');
    } else {
      console.error('Error creating group:', err);
    }
  }

  await client.disconnect();
}

main();
