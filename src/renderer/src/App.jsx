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
          <span className="version-badge">v0.1.0</span>
        </header>

        <section className="release-notes">
          <h2>Release Notes</h2>
          <article className="release-entry">
            <header className="release-head">
              <h3>v0.1.0</h3>
              <time>First release</time>
            </header>
            <ul>
              <li>Initial playable release of the game.</li>
              <li>Placeholder game notes until real patch notes are published.</li>
              <li>Play and Settings buttons are placeholders for now.</li>
            </ul>
          </article>
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
