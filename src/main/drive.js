import { net } from 'electron'
import { promises as fs, createWriteStream } from 'fs'
import { join, dirname } from 'path'
import { tmpdir } from 'os'
import { Readable, Transform } from 'stream'
import { pipeline } from 'stream/promises'
import extract from 'extract-zip'

const BASE = 'https://www.googleapis.com/drive/v3'
const GAME_PREFIX = 'FALL-'
const GAME_SUFFIX = '.zip'

export function parseVersion(name) {
  if (!name.startsWith(GAME_PREFIX) || !name.endsWith(GAME_SUFFIX)) return null
  const v = name.slice(GAME_PREFIX.length, -GAME_SUFFIX.length)
  return /^\d+\.\d+(\.\d+)?$/.test(v) ? v : null
}

export function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0)
    if (d !== 0) return d
  }
  return 0
}

async function driveRequest(url) {
  const res = await net.fetch(url)
  if (!res.ok) {
    throw new Error(`Drive request failed (${res.status}): ${await res.text()}`)
  }
  return res
}

export async function listFiles(folderId, apiKey) {
  const url =
    `${BASE}/files?q=${encodeURIComponent(`'${folderId}' in parents and trashed=false`)}` +
    `&key=${encodeURIComponent(apiKey)}&fields=files(id,name,size,mimeType,modifiedTime)`
  const res = await driveRequest(url)
  const data = await res.json()
  return data.files || []
}

export async function listGameVersions(folderId, apiKey) {
  const files = await listFiles(folderId, apiKey)
  return files
    .map((f) => ({ id: f.id, name: f.name, version: parseVersion(f.name), size: f.size }))
    .filter((f) => f.version !== null)
    .sort((a, b) => compareVersions(b.version, a.version))
}

export function parseNoteVersion(name) {
  if (!name.endsWith('.md')) return null
  const v = name.slice(0, -3)
  return /^\d+\.\d+(\.\d+)?$/.test(v) ? v : null
}

export async function listReleaseNotes(folderId, apiKey) {
  const rootFiles = await listFiles(folderId, apiKey)
  const notesFolder = rootFiles.find(
    (f) => f.name === 'release-notes' && f.mimeType === 'application/vnd.google-apps.folder'
  )
  if (!notesFolder) return []
  const files = await listFiles(notesFolder.id, apiKey)
  return files
    .map((f) => ({
      id: f.id,
      name: f.name,
      version: parseNoteVersion(f.name),
      modifiedTime: f.modifiedTime || ''
    }))
    .filter((f) => f.version !== null)
    .sort((a, b) => compareVersions(b.version, a.version))
}

async function downloadFile(fileId, apiKey, destPath, onProgress) {
  const url = `${BASE}/files/${encodeURIComponent(fileId)}?alt=media&key=${encodeURIComponent(apiKey)}`
  const res = await driveRequest(url)
  const total = Number(res.headers.get('content-length')) || 0
  let received = 0

  const progress = new Transform({
    transform(chunk, encoding, callback) {
      received += chunk.length
      if (total && onProgress) onProgress(received, total)
      callback(null, chunk)
    }
  })

  await fs.mkdir(dirname(destPath), { recursive: true })
  const ws = createWriteStream(destPath)
  try {
    await pipeline(Readable.fromWeb(res.body), progress, ws)
  } finally {
    ws.destroy()
  }
}

export async function downloadNoteFile(fileId, apiKey, destPath) {
  await downloadFile(fileId, apiKey, destPath)
}

export async function downloadAndInstall(file, apiKey, gamePath, onProgress) {
  const zipPath = join(tmpdir(), `FALL-${file.version}.zip`)
  try {
    await downloadFile(file.id, apiKey, zipPath, onProgress)
    await fs.rm(gamePath, { recursive: true, force: true })
    await fs.mkdir(gamePath, { recursive: true })
    await extract(zipPath, { dir: gamePath })
    return { version: file.version, path: gamePath }
  } finally {
    await fs.rm(zipPath, { force: true }).catch(() => {})
  }
}
