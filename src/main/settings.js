import { app } from 'electron'
import { join, dirname, basename } from 'path'
import { promises as fs } from 'fs'

const SETTINGS_FILE = 'settings.json'

function settingsDefaults() {
  const gamePath = join(app.getPath('home'), 'FALL')
  return {
    gamePath,
    savePath: join(dirname(gamePath), `${basename(gamePath)} Saves`),
    gameVersion: ''
  }
}

async function readJson(filename, fallback) {
  try {
    const raw = await fs.readFile(join(app.getPath('userData'), filename), 'utf-8')
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

async function writeJson(filename, data) {
  await fs.mkdir(app.getPath('userData'), { recursive: true })
  await fs.writeFile(
    join(app.getPath('userData'), filename),
    JSON.stringify(data, null, 2),
    'utf-8'
  )
}

export function getSettings() {
  return readJson(SETTINGS_FILE, settingsDefaults())
}

export async function setSettings(patch) {
  const current = await getSettings()
  const next = { ...current, ...patch }
  await writeJson(SETTINGS_FILE, next)
  return next
}
