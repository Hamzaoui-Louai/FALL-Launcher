import { app } from 'electron'
import { join } from 'path'
import dotenv from 'dotenv'
import { existsSync } from 'fs'

function envFilePath() {
  if (app.isPackaged) {
    return join(process.resourcesPath, '.env')
  }
  return join(app.getAppPath(), '.env')
}

function loadEnv() {
  const file = envFilePath()
  if (existsSync(file)) {
    dotenv.config({ path: file })
  }
}

export function getDriveConfig() {
  loadEnv()
  return {
    folderId: process.env.DRIVE_FOLDER_ID || '',
    apiKey: process.env.DRIVE_API_KEY || ''
  }
}
