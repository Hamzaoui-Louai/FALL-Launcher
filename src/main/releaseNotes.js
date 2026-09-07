import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { listReleaseNotes, downloadNoteFile, compareVersions } from './drive'
import { getDriveConfig } from './envConfig'

const NOTES_DIR = 'release-notes'
const INDEX_FILE = 'notes-index.json'

function notesDir() {
  return join(app.getPath('userData'), NOTES_DIR)
}

async function readIndex() {
  try {
    return JSON.parse(await fs.readFile(join(notesDir(), INDEX_FILE), 'utf-8'))
  } catch {
    return {}
  }
}

async function writeIndex(index) {
  await fs.mkdir(notesDir(), { recursive: true })
  await fs.writeFile(join(notesDir(), INDEX_FILE), JSON.stringify(index, null, 2), 'utf-8')
}

export async function syncReleaseNotes() {
  const drive = getDriveConfig()
  if (!drive.folderId || !drive.apiKey) return { ok: false, changed: 0, notes: [] }

  const remote = await listReleaseNotes(drive.folderId, drive.apiKey)
  const index = await readIndex()
  let changed = 0
  const notes = []

  for (const file of remote) {
    notes.push(file.version)
    if (index[file.version] === file.modifiedTime) continue
    await fs.mkdir(notesDir(), { recursive: true })
    await downloadNoteFile(file.id, drive.apiKey, join(notesDir(), `${file.version}.md`))
    index[file.version] = file.modifiedTime
    changed++
  }

  await writeIndex(index)
  return { ok: true, changed, notes }
}

export async function getAllReleaseNotes() {
  await fs.mkdir(notesDir(), { recursive: true })
  const names = (await fs.readdir(notesDir())).filter((f) => parseNoteFileName(f) !== null)
  const notes = []
  for (const name of names) {
    const content = await fs.readFile(join(notesDir(), name), 'utf-8')
    notes.push({ version: parseNoteFileName(name), content })
  }
  notes.sort((a, b) => compareVersions(b.version, a.version))
  return notes.map((n) => n.content).join('\n\n---\n\n')
}

function parseNoteFileName(name) {
  if (!name.endsWith('.md')) return null
  const v = name.slice(0, -3)
  return /^\d+\.\d+(\.\d+)?$/.test(v) ? v : null
}
