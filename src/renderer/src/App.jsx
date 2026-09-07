import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import bundledNotes from './assets/0.1.0.md?raw'

function App() {
  const [installedVersion, setInstalledVersion] = useState('')
  const [availableVersion, setAvailableVersion] = useState(null)
  const [configured, setConfigured] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [releaseNotes, setReleaseNotes] = useState(bundledNotes)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(true)
  const [progress, setProgress] = useState(null)
  const [notice, setNotice] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(null)

  async function refresh() {
    setChecking(true)
    try {
      const [check, s] = await Promise.all([window.api.checkForUpdates(), window.api.getSettings()])
      setConfigured(check.configured)
      setInstalledVersion(check.installedVersion || '')
      setAvailableVersion(check.availableVersion)
      setUpdateAvailable(check.updateAvailable)
      setSettings(s)

      const shownVersion = check.installedVersion || check.availableVersion
      if (shownVersion) {
        const notes = await window.api.fetchReleaseNotes(shownVersion)
        if (notes) setReleaseNotes(notes)
      }
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    // Load remote data once on mount; state updates happen after the async result resolves.
    let cancelled = false
    window.api
      .checkForUpdates()
      .then(async (check) => {
        if (cancelled) return
        const s = await window.api.getSettings()
        setConfigured(check.configured)
        setInstalledVersion(check.installedVersion || '')
        setAvailableVersion(check.availableVersion)
        setUpdateAvailable(check.updateAvailable)
        setSettings(s)
        const shownVersion = check.installedVersion || check.availableVersion
        if (shownVersion) {
          const notes = await window.api.fetchReleaseNotes(shownVersion)
          if (notes) setReleaseNotes(notes)
        }
      })
      .catch((e) => setNotice(`Failed to check for updates: ${e.message}`))
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    const off = window.api.onDownloadProgress(({ received, total }) => {
      setProgress(total ? Math.round((received / total) * 100) : 0)
    })
    return () => {
      cancelled = true
      off()
    }
  }, [])

  async function installOrUpdate() {
    if (!availableVersion) return
    setBusy(true)
    setNotice(null)
    setProgress(0)
    try {
      await window.api.downloadVersion(availableVersion)
      setNotice(`Installed version ${availableVersion}`)
      setProgress(null)
      await refresh()
    } catch (e) {
      setNotice(`Download failed: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  async function handlePlay() {
    const result = await window.api.play()
    if (!result.ok) setNotice(result.error)
  }

  function handleSettings() {
    setSettingsOpen(true)
  }

  function closeSettings() {
    setSettingsOpen(false)
  }

  async function saveSettings() {
    try {
      await window.api.setSettings({
        gamePath: settings.gamePath,
        savePath: settings.savePath
      })
      setSettingsOpen(false)
      setNotice('Settings saved')
      await refresh()
    } catch (e) {
      setNotice(`Failed to save settings: ${e.message}`)
    }
  }

  async function pickPath(key) {
    const title = key === 'gamePath' ? 'Select game folder' : 'Select save folder'
    const picked = await window.api.pickDirectory(title, settings[key])
    if (picked) setSettings({ ...settings, [key]: picked })
  }

  let playLabel = '…'
  if (!checking) {
    if (!installedVersion) playLabel = 'Install'
    else if (updateAvailable) playLabel = 'Update'
    else playLabel = 'Play'
  }

  const buttonDisabled = checking || busy || !configured || !availableVersion || !playLabel

  const canAct = configured && availableVersion && !busy && (updateAvailable || !installedVersion)

  let statusText = 'Checking for updates…'
  if (!checking) {
    if (!configured) statusText = 'Not configured'
    else if (!availableVersion) statusText = 'No versions found'
    else if (!installedVersion) statusText = `Game ${availableVersion} available`
    else if (updateAvailable) statusText = `Update available: v${availableVersion}`
    else statusText = `Game ${installedVersion}`
  }

  return (
    <div className="launcher">
      <main className="content">
        <header className="page-header">
          <h1>FALL Launcher</h1>
          <span className="version-badge">v1.0</span>
        </header>

        <section className="release-notes">
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{releaseNotes}</ReactMarkdown>
          </div>
        </section>
      </main>

      <footer className="bottom-bar">
        <div className="play-zone">
          {busy && progress !== null ? (
            <div className="progress-wrap">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="play-version">Downloading {progress}%</span>
            </div>
          ) : (
            <button
              className="btn btn-play"
              onClick={canAct ? installOrUpdate : handlePlay}
              type="button"
              disabled={buttonDisabled}
            >
              {playLabel}
            </button>
          )}
          <span className="play-version">{statusText}</span>
        </div>
        <div className="settings-zone">
          <button className="btn btn-settings" onClick={handleSettings} type="button">
            Settings
          </button>
        </div>
      </footer>

      {notice && (
        <div className="toast">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      )}

      {settingsOpen && settings && (
        <div className="settings-overlay" onClick={closeSettings}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>

            <label className="field">
              <span>Game download path</span>
              <div className="path-row">
                <input
                  value={settings.gamePath}
                  onChange={(e) => setSettings({ ...settings, gamePath: e.target.value })}
                />
                <button type="button" onClick={() => pickPath('gamePath')}>
                  Browse
                </button>
              </div>
            </label>

            <label className="field">
              <span>Game save path</span>
              <div className="path-row">
                <input
                  value={settings.savePath}
                  onChange={(e) => setSettings({ ...settings, savePath: e.target.value })}
                />
                <button type="button" onClick={() => pickPath('savePath')}>
                  Browse
                </button>
              </div>
            </label>

            <div className="settings-actions">
              <button className="btn btn-settings" type="button" onClick={closeSettings}>
                Cancel
              </button>
              <button className="btn btn-play" type="button" onClick={saveSettings}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
