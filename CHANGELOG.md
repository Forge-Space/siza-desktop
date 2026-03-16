# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Knip dead code detection with CI enforcement
- Dependabot for automated dependency and GitHub Actions updates
- Renderer unit tests: `useGenerationHistory`, `UpdateBanner`, `AuthLoginPage`, `OnboardingPage` (90 tests total)
- Coverage enforcement via `@vitest/coverage-v8` (≥80% lines/funcs/stmts, ≥70% branches)
- `siza-desktop` developer skill for workflow automation

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

[Unreleased]: https://github.com/Forge-Space/siza-desktop/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Forge-Space/siza-desktop/releases/tag/v0.1.0
