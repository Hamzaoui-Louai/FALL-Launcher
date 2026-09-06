import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import releaseNotes from './assets/0.1.0.md?raw'

function App() {
  const handlePlay = () => {
    // TODO: launch the game (v0.1.0) via the main process
  }

  const handleSettings = () => {
    // TODO: open the settings UI
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
          <button className="btn btn-play" onClick={handlePlay} type="button">
            Play
          </button>
          <span className="play-version">Game v0.1.0</span>
        </div>
        <div className="settings-zone">
          <button className="btn btn-settings" onClick={handleSettings} type="button">
            Settings
          </button>
        </div>
      </footer>
    </div>
  )
}

export default App
