# Siza Desktop

Siza desktop app foundation using Electron, React, and TypeScript.

## Requirements

- Node.js 22+
- npm 10+

## Setup

```bash
npm install
```

## Scripts

- `npm run dev` — run renderer development server (Vite)
- `npm run build` — build renderer + Electron main/preload bundles
- `npm run electron:dev` — build and open Electron app
- `npm run electron:build` — package desktop app with electron-builder
- `npm run lint` — run ESLint
- `npm run type-check` — run TypeScript type checks
- `npm run test` — run unit tests

## Architecture

- `src/main` — Electron main process and preload bridge
- `src/renderer` — React UI
- `src/shared` — shared typed contracts used across main/preload/renderer

## Code Signing

Distributable builds require platform-specific signing to avoid OS security warnings.

### macOS

1. Obtain an **Apple Developer ID Application** certificate from the [Apple Developer portal](https://developer.apple.com).
2. Export the certificate as a `.p12` file and base64-encode it:
   ```bash
   base64 -i certificate.p12 | pbcopy
   ```
3. Add the following GitHub Actions secrets to the repository:
   - `CSC_LINK` — base64-encoded `.p12` certificate
   - `CSC_KEY_PASSWORD` — certificate password
   - `APPLE_ID` — Apple ID email used for notarization
   - `APPLE_APP_SPECIFIC_PASSWORD` — app-specific password from [appleid.apple.com](https://appleid.apple.com)
   - `APPLE_TEAM_ID` — 10-character team ID from the Developer portal
4. electron-builder reads `CSC_LINK` and `CSC_KEY_PASSWORD` automatically. Add notarization config to `package.json`:
   ```json
   "afterSign": "scripts/notarize.js"
   ```
   Use `@electron/notarize` in `scripts/notarize.js` with `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`.

### Windows

1. Obtain a **Code Signing EV Certificate** from a CA (e.g. DigiCert, Sectigo).
2. Export the `.pfx` file and base64-encode it:
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("cert.pfx")) | Set-Clipboard
   ```
3. Add GitHub Actions secrets:
   - `CSC_LINK` — base64-encoded `.pfx`
   - `CSC_KEY_PASSWORD` — certificate password
4. electron-builder handles the rest automatically for NSIS targets.

### Local builds (unsigned)

Skip signing for local development by setting:
```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run electron:build
```

## CI and Security

This repository ships with baseline workflows for:

- CI quality checks (`lint`, `type-check`, `test`, `build`)
- CodeQL analysis
- Trivy vulnerability scan
- Secret scanning (TruffleHog)
