import dotenv from 'dotenv'
import { commandOptions, createClient } from 'redis'
import { runContainer } from './utils/runContainer'

dotenv.config()

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

const subscriber = createClient({ url: REDIS_URL })
const publisher = createClient({ url: REDIS_URL })

async function connectRedis() {
  try {
    await subscriber.connect()
    await publisher.connect()
    console.log('Connected to Redis successfully')
  } catch (err) {
    console.error('Redis connection error:', err)
    process.exit(1) // Exit if Redis is unreachable
  }
}

async function main() {
  await connectRedis()

  while (true) {
    try {
      const res = await subscriber.brPop(
        commandOptions({ isolated: true }),
        'build-queue',
        0
      )
      const id = res?.element

      if (!id) {
        console.log('No ID found, continuing...')
        continue
      }

      console.log(`Processing deployment for ID: ${id}`)
      await runContainer(id)

      await publisher.hSet('status', id, 'deployed')
      console.log(`Deployment completed for ID: ${id}`)
    } catch (err) {
      console.error('Error in deployment process:', err)
    }
  }
}

main()
