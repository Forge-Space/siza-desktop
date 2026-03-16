# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-03-16

### Added
- **Ollama Model Manager** — new `/models` route with `ModelManagerPage` component
  - Browse all installed Ollama models with name and size display
  - Pull new models by name with real-time streaming progress bar (per-chunk percentage)
  - Delete installed models with confirmation feedback
  - Refresh model list manually
- IPC handlers: `ollama:get-models`, `ollama:pull-model` (streaming), `ollama:delete-model`
- `OllamaPullProgress` and `OllamaDeleteResult` types in `bridge.ts`
- Models nav item (Package icon) in `AppShell` sidebar
- 19 new tests (170 total, 18 suites); coverage: 96.08% stmts / 87.91% branches / 94.65% funcs

## [0.4.0] - 2026-03-16

### Added
- AuthContext tests (6 tests, 100% coverage)
- AuthGuard tests (3 tests, 100% coverage)
- OnboardingGate / router tests (4 tests, 100% coverage)
- `@testing-library/dom` (missing peer dep after testing-library upgrade in v0.3.0)
- Extended coverage scope to `renderer/context/**` and `renderer/routes/**`
- 151 tests total (17 suites), coverage: 97.13% stmts / 92.03% branches / 95.53% funcs

## [0.3.0] - 2026-03-16

### Added
- Branch coverage tests for updater IPC (non-Error download failure), generate IPC (vue/svelte file extensions), auth IPC (empty decrypted data, missing email fallback)
- 138 tests total (up from 133)

### Changed
- Upgraded `@forgespace/siza-gen` to 0.13.2 (semantic token fixes)
- Upgraded `vitest` + `@vitest/coverage-v8` to 4.1.0 (must match exactly)
- Upgraded `electron` to 41.0.2
- Upgraded `@types/node` to 25
- Upgraded `vite-plugin-electron` to 0.29.1
- `@vitejs/plugin-react` v6 and `vite` v8 upgrades blocked (require each other; @tailwindcss/vite@4 pins vite ≤7)

## [0.2.0] - 2026-03-16

### Added
- Knip dead code detection with CI enforcement
- Dependabot for automated dependency and GitHub Actions updates
- Renderer unit tests: `useGenerationHistory`, `UpdateBanner`, `AuthLoginPage`, `OnboardingPage`, `GeneratePage`, `SettingsPage`, `AppShell` (122 tests total)
- Coverage enforcement via `@vitest/coverage-v8` (≥80% lines/funcs/stmts, ≥70% branches)
- `siza-desktop` developer skill for workflow automation

### Changed
- Upgraded all GitHub Actions to latest: checkout@v6, setup-node@v6, upload-artifact@v7, download-artifact@v8, codeql-action@v4
- Upgraded electron to v41, @types/node to v25, vitest and testing-library to latest
- Removed unused `class-variance-authority` dependency
- Fixed duplicate type exports: `UpdateStatus`, `SaveFilesRequest`, `SaveFilesResult` now sourced from `bridge.ts`

## [0.1.0] - 2025-03-15

### Added
- Bootstrap foundation for `siza-desktop` with Electron + React + TypeScript
- Typed preload bridge between renderer and main process
- Baseline quality and security workflows (CI, CodeQL, Trivy, secret scanning)
- React Router v7 + MemoryRouter scaffold (Electron `file://` compatible)
- Forge Space design system: Tailwind v4, Plus Jakarta Sans, `#7C3AED` primary, dark/light CSS vars
- Auth IPC bridge: Supabase `signIn`/`signOut`/`getSession` in main process, session persisted via `safeStorage`
- Ollama IPC: health check, model listing, configurable base URL
- `@forgespace/siza-gen@0.13.0` integration: template-based component generation via IPC
- OllamaProvider LLM integration: optional AI generation mode with model selector
- GeneratePage: framework tabs (react/vue/svelte/angular), component library selector, LLM/template toggle, multi-file output, copy + export to disk
- GeneratePage history panel: localStorage-backed, up to 20 entries, click-to-restore
- Onboarding wizard: 3-step first-run flow (welcome → Ollama URL test → sign in)
- Auto-updater: electron-updater IPC + UpdateBanner polling component
- File export: `files:save-generated` IPC opens directory picker and writes all generated files
- Settings page: Ollama URL config + sign out
- Error boundary in renderer
- electron-builder config: dmg (x64/arm64), nsis (x64), AppImage (x64)
- GitHub Actions CI (lint, type-check, test:coverage, knip, build)
- GitHub Actions release workflow: matrix build → GitHub Release with auto-generated notes
- IPC unit tests: 57 tests across 7 suites (auth, ollama, generate, updater, files, onboarding, bridge)
- Code signing documentation (macOS notarization, Windows Authenticode)
- App icon scaffold (`build/icon.svg`)

[Unreleased]: https://github.com/Forge-Space/siza-desktop/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/Forge-Space/siza-desktop/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Forge-Space/siza-desktop/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Forge-Space/siza-desktop/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Forge-Space/siza-desktop/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Forge-Space/siza-desktop/releases/tag/v0.1.0
