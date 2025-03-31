import { createClient } from 'redis';

let redisClient: any = null; // Maintain a single Redis client instance

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: '127.0.0.1', // Change if using a remote Redis server
        port: 6379,
      },
    });

    redisClient.on('error', (err: Error) => console.error('Redis Error:', err));

    await redisClient.connect();
    console.log('✅ Redis connected successfully');
  }
  return redisClient;
}

export async function closeRedisClient() {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
    console.log('🚀 Redis disconnected successfully');
  }
}
