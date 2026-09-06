import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  listVersions: () => ipcRenderer.invoke('drive:versions'),
  checkForUpdates: () => ipcRenderer.invoke('drive:check'),
  downloadVersion: (version) => ipcRenderer.invoke('drive:download', { version }),
  onDownloadProgress: (cb) => {
    const listener = (_e, payload) => cb(payload)
    ipcRenderer.on('drive:progress', listener)
    return () => ipcRenderer.removeListener('drive:progress', listener)
  },
  fetchReleaseNotes: (version) => ipcRenderer.invoke('drive:releaseNotes', version),
  pickDirectory: (title, defaultPath) => ipcRenderer.invoke('dir:pick', { title, defaultPath }),
  play: () => ipcRenderer.invoke('game:play')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
