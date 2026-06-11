# Kirutma

A Figma-class standalone design tool for **macOS** and **Windows**.

## Status

**Phase 0 complete** — Tauri + React shell with Figma-dark UI layout. GPU canvas lands in Phase 1.

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Rust](https://rustup.rs) 1.77+ (required for `tauri dev` / `tauri build`)
- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS

### UI only (browser preview)

```bash
cd apps/desktop
npm install
npm run dev
```

Open http://localhost:1420

### Native desktop app

```bash
cd apps/desktop
npm install
npm run tauri dev
```

### Production build

```bash
cd apps/desktop
npm run tauri build
```

## Project layout

```
apps/desktop/
├── src/                 # React UI (toolbar, panels, canvas placeholder)
├── src-tauri/           # Rust / Tauri backend
└── public/
```

See [PLAN.md](./PLAN.md) for architecture and roadmap.

## Phase 0 deliverables

- [x] Tauri 2 + React 19 + Vite + TypeScript
- [x] Tailwind v4 + Figma-dark design tokens
- [x] Editor shell: menu bar, toolbar, layers, properties, page tabs
- [x] Zustand UI store + tool/zoom keyboard shortcuts
- [x] Tauri security (CSP, capabilities, no Node in renderer)
- [x] CI workflow (frontend + Tauri matrix build)
- [ ] wgpu test rect — **Phase 1** (requires Rust + GPU integration)

## License

Copyright © 2026 **Alexandar Vincent Paulraj**. All rights reserved.

Kirutma is proprietary software. See [LICENSE](./LICENSE) and [COPYRIGHT](./COPYRIGHT).

## Documentation

- [USER_MANUAL.md](./USER_MANUAL.md) — end-user guide
- [DISTRIBUTION.md](./DISTRIBUTION.md) — build and release
- [SIGNING.md](./SIGNING.md) — code signing setup
- [.github/SECRETS_CHECKLIST.md](./.github/SECRETS_CHECKLIST.md) — GitHub Actions secrets for [alxv/Kirutma](https://github.com/alxv/Kirutma)
