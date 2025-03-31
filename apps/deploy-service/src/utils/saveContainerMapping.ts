import { getRedisClient } from './redis';

export async function saveContainerMapping(containerId: string, port: number) {
  try {
    const redisClient = await getRedisClient(); // Ensure Redis is open

    await redisClient.hSet('containers', containerId, JSON.stringify({ port }));
    console.log(`🗃️ Saved mapping: ${containerId} -> Port ${port}`);
  } catch (error) {
    console.error('❌ Error saving to Redis:', error);
  }
}
