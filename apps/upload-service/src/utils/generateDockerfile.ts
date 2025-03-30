import fs from 'fs'
import path from 'path'

export function generateDockerfile(projectPath: string, projectType: string) {
  let dockerfileContent = '';

  switch (projectType) {
    case 'nextjs':
      dockerfileContent = `
        FROM node:18
        WORKDIR /app
        COPY package.json package-lock.json ./
        RUN npm install
        COPY . .
        RUN npm run build
        CMD ["npm", "start"]
        EXPOSE 3000
      `;
      break;

    case 'express':
      dockerfileContent = `
        FROM node:18
        WORKDIR /app
        COPY package.json package-lock.json ./
        RUN npm install
        COPY . .
        CMD ["node", "server.js"]
        EXPOSE 5000
      `;
      break;

    case 'python':
      dockerfileContent = `
        FROM python:3.10
        WORKDIR /app
        COPY requirements.txt .
        RUN pip install -r requirements.txt
        COPY . .
        CMD ["python", "app.py"]
        EXPOSE 5000
      `;
      break;

    case 'react':
      dockerfileContent = `
        FROM node:18
        WORKDIR /app
        COPY package.json package-lock.json ./
        RUN npm install
        COPY . .
        RUN npm run build
        CMD ["npx", "serve", "-s", "build"]
        EXPOSE 3000
      `;
      break;

    default:
      console.error('❌ Unknown project type. Dockerfile not generated.');
      return;
  }

  const dockerfilePath = path.join(projectPath, 'Dockerfile');
  fs.writeFileSync(dockerfilePath, dockerfileContent.trim());

  if (!fs.existsSync(dockerfilePath)) {
    console.error('❌ Failed to create Dockerfile at:', dockerfilePath);
  } else {
    console.log('✅ Dockerfile created at:', dockerfilePath);
  }
}