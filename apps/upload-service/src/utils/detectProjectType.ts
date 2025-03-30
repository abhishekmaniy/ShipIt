import fs from 'fs'
import path from 'path'

export function detectProjectType(projectPath: string): string {
  if (fs.existsSync(path.join(projectPath, 'package.json'))) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'))

    if (packageJson.dependencies?.next) return 'nextjs'
    if (packageJson.dependencies?.react) return 'react'
    if (packageJson.dependencies?.express) return 'express'
    return 'nodejs'
  }

  if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) return 'python'
  if (fs.existsSync(path.join(projectPath, 'pom.xml'))) return 'java'
  if (fs.existsSync(path.join(projectPath, 'main.go'))) return 'go'

  return 'unknown'
}
