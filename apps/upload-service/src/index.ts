import { exec } from 'child_process'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { createClient } from 'redis'
import simpleGit from 'simple-git'
import { detectProjectType } from './utils/detectProjectType'
import { generate } from './utils/geenerate'
import { generateDockerfile } from './utils/generateDockerfile'

// Load environment variables
dotenv.config()

const publisher = createClient()
const subcriber = createClient()

async function initRedis () {
  await publisher.connect()
  await subcriber.connect()
}
initRedis().catch(console.error)

const app = express()
app.use(cors())
app.use(express.json())

// Load Google Cloud credentials from environment variable
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID
const GAR_REGION = process.env.GAR_REGION
const GAR_REPO = process.env.GAR_REPO

// Decode the base64-encoded credentials JSON
const credentialsJson = JSON.parse(process.env.GOOGLE_CREDENTIALS!)

console.log('credentialsJson', credentialsJson)

app.post('/deploy', async (req, res) => {
  console.log(req.body)
  const repoUrl = req.body.repoUrl

  const id = generate()
  await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`))

  const projectType = detectProjectType(path.join(__dirname, `output/${id}`))
  console.log(`Detected project type: ${projectType}`)

  if (projectType === 'unknown') {
    res.status(400).json({ error: 'Unsupported project type' })
    return
  }

  const outputPath = path.join(__dirname, `output/${id}`)
  generateDockerfile(outputPath, projectType)

  const imageName = `${GAR_REGION}-docker.pkg.dev/${GOOGLE_PROJECT_ID}/${GAR_REPO}/${id}:latest`

  const buildCommand = `docker build -t ${imageName} ${outputPath}`
  exec(buildCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('Error building image:', error)
      res.status(500).json({ error: 'Failed to build Docker image' })
      return
    }
    console.log(`Docker build stdout: ${stdout}`)
    console.error(`Docker build stderr: ${stderr}`)

    // Authenticate with Google Cloud using JSON from environment
    const authCommand = `gcloud auth activate-service-account --key-file=-`
    const authProcess = exec(authCommand)
    if (authProcess.stdin) {
      authProcess.stdin.write(JSON.stringify(credentialsJson))
      authProcess.stdin.end()
    } else {
      console.error('authProcess.stdin is null')
      res
        .status(500)
        .json({ error: 'Failed to authenticate with Google Cloud' })
      return
    }

    if (authProcess.stdout) {
      authProcess.stdout.on('data', data => console.log(`Auth stdout: ${data}`))
    } else {
      console.error('authProcess.stdout is null')
    }
    if (authProcess.stderr) {
      authProcess.stderr.on('data', data =>
        console.error(`Auth stderr: ${data}`)
      )
    } else {
      console.error('authProcess.stderr is null')
    }

    authProcess.on('close', code => {
      if (code !== 0) {
        console.error(`Authentication failed with exit code ${code}`)
        res.status(500).json({ error: 'Google Cloud authentication failed' })
        return
      }

      // Push the image to Google Artifact Registry
      const pushCommand = `docker push ${imageName}`
      exec(pushCommand, (pushError, pushStdout, pushStderr) => {
        if (pushError) {
          console.error(`Error pushing image: ${pushError.message}`)
          res.status(500).json({ error: 'Failed to push Docker image' })
          return
        }
        console.log(`Docker push stdout: ${pushStdout}`)
        console.error(`Docker push stderr: ${pushStderr}`)

        // Update status in Redis
        publisher.hSet('status', id, 'deployed')
        publisher.lPush('build-queue', id)
        res.json({ id, status: 'deployed' })
      })
    })
  })
})

app.get('/status', async (req, res) => {
  const id = req.query.id as string | undefined
  if (!id) {
    res.status(400).json({ error: 'Missing or invalid id' })
    return
  }
  const response = await subcriber.hGet('status', id)
  res.json({ status: response })
})

app.listen(3015, () => {
  console.log('Port is running on 3015')
})
