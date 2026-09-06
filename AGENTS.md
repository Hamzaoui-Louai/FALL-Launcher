# AGENTS.md

Electron + React launcher for the "FALL" game. Vanilla JavaScript/JSX (no TypeScript), built with `electron-vite`. Git repo at root — the user commits; do not commit unless asked.

## Commands

- `npm run dev` — dev with renderer HMR (main/preload still rebuild)
- `npm run build` — compile main + preload + renderer into `out/`
- `npm run lint` — `eslint --cache .` (fails on prettier; run `npx eslint --fix <file>` to auto-fix)
- `npm run format` — `prettier --write .`
- `npm run build:win` (also `build:mac`, `build:linux`) — electron-builder packaging

Verify changes with `npm run build` then `npm run lint`.

## Structure

- `src/main/index.js` — app entry. Startup flow: splash window (2.5 s, `resources/splash.png`) → main window via `showApp()`.
- `src/preload/index.js` — contextBridge, exposes `window.electron` / `window.api`.
- `src/renderer/src/` — React app (`.jsx`). `main.jsx` → `App.jsx`. Launcher UI = scrollable release notes + bottom bar (Play center, Settings right). `handlePlay`/`handleSettings` are stubbed TODOs (game launch is a future main-process feature).
- `resources/` — runtime files shipped unpacked (`asarUnpack: resources/**`): `icon.png` (dev window icon), `splash.png`.
- `build/` — packaged app icons (`icon.ico`, `icon.icns`, `icon.png`) used by electron-builder, independent of `resources/`.
- `out/` — build output, gitignored.

## Hard-earned gotchas

- **`?asset` imports** in main/preload compile to a path like `../../resources/<file>` relative to `out/main` and work in dev and packaged. Prefer returning the resolved path over inlining bytes.
- **Splash rendering**: the splash previously used a base64 data URL; the 1.6 MB PNG exceeded Chromium's 2 MB URL limit and rendered nothing. Always load big assets via `loadFile(path)`, never a data URL.
- **Icons**: the dev window/taskbar icon is `resources/icon.png` passed via `BrowserWindow({ icon })`. The packaged exe icon is `build/icon.png` / `build/icon.ico` — they must be swapped/regenerated separately (`.icns` is still the stock template default). `resources/` swaps do NOT change packaged icons.
- **Dependency placement**: renderer-only deps (react, react-markdown, remark-gfm, vite plugins) must live in `devDependencies` — Vite bundles them. `dependencies` should only hold main/preload runtime libs (`@electron-toolkit/*`). A renderer lib in `dependencies` ships an unused copy inside the asar.
- **Release notes**: rendered from Markdown with `react-markdown` + `remark-gfm`, imported raw: `import releaseNotes from './assets/0.1.0.md?raw'` in `App.jsx`. Adding a version = add `<version>.md` to `src/renderer/src/assets/`, update the import, and the two "v0.1.0" UI labels. The displayed game version is separate from the launcher `version` in `package.json` (1.0.0).
- **Expected console noise**: dev renderer logs an Electron "Insecure Content-Security-Policy" warning on startup — it's a stock-template warning, not a regression. `npm run build` output is otherwise quiet.
- **Process testing**: launch `node_modules/electron/dist/electron.exe` directly when checking lifecycle — the `.cmd` shim reports unreliable `HasExited`. Clean up leftovers with `Get-Process electron | Stop-Process -Force`. Success = process still alive after ~10 s with empty stderr.