import { exec } from 'child_process'

export function updateNginxConfig() {
  exec('bash /path/to/update-nginx.sh', (error, stdout, stderr) => {
    if (error) {
      console.error(`NGINX Update Failed: ${stderr}`)
    } else {
      console.log(`NGINX Updated Successfully: ${stdout}`)
    }
  })
}
