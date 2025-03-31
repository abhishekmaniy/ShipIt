import { exec } from 'child_process'
import { createClient } from 'redis'
import { saveContainerMapping } from './saveContainerMapping'

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})



export async function runContainer(imageName:string) {
  return new Promise(async (resolve, reject) => {
    const port = Math.floor(3000 + Math.random() * 1000) // Random port for the container

    console.log(`Authenticating Docker with Google Cloud...`)

    exec('gcloud auth configure-docker us-central1-docker.pkg.dev', (authError, authStdout, authStderr) => {
      if (authError) {
        console.error(`Error authenticating: ${authStderr}`)
        return reject(authError)
      }
      console.log(`Docker authentication successful: ${authStdout}`)

      // 🔹 Ensure full image reference
      if (!imageName.startsWith("us-central1-docker.pkg.dev/")) {
        imageName = `us-central1-docker.pkg.dev/shiplt-455205/shiplt/${imageName}`;
      }

      // ✅ Ensure single tag
      if (!imageName.includes(':')) {
        imageName += ':latest';
      }

      console.log(`Pulling image: ${imageName}`)
      exec(`docker pull ${imageName}`, (pullError, pullStdout, pullStderr) => {
        if (pullError) {
          console.error(`Error pulling image: ${pullStderr}`)
          return reject(pullError)
        }

        console.log(`Image pulled successfully: ${pullStdout}`)
        const command = `docker run -d -p ${port}:3000 ${imageName}`

        exec(command, async (runError, stdout, stderr) => {
          if (runError) {
            console.error(`Error starting container: ${stderr}`)
            return reject(runError)
          }

          const containerId = stdout.trim()
          console.log(`Container started: ${containerId} on port ${port}`)

          await saveContainerMapping(containerId, port) // Store mapping in Redis

          resolve(containerId)
        })
      })
    })
  })
}
