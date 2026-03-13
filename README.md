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

## CI and Security

This repository ships with baseline workflows for:

- CI quality checks (`lint`, `type-check`, `test`, `build`)
- CodeQL analysis
- Trivy vulnerability scan
- Secret scanning (TruffleHog)
