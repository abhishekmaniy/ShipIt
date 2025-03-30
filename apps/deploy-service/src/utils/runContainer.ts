import { exec } from 'child_process'

export function runContainer(imageName:string) {
  return new Promise((resolve, reject) => {
    const port = Math.floor(3000 + Math.random() * 1000) // Assign a random port
    const command = `docker run -d -p ${port}:3000 ${imageName}`

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting container: ${stderr}`)
        reject(error)
      } else {
        console.log(`Container started: ${stdout.trim()}`)
        resolve(stdout.trim()) // Return container ID
      }
    })
  })
}
