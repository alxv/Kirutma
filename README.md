# Kirutma

**Design with frames, shapes, and text on an infinite canvas.**

Kirutma is a desktop design application for UI mockups, layouts, and vector graphics — with layers, styles, components, and PNG/SVG export. Files are saved locally as `.kirutma` documents.

**Owner:** Alexandar Vincent Paulraj

---

## Download

Get the latest release for your platform:

**[github.com/alxv/Kirutma/releases/latest](https://github.com/alxv/Kirutma/releases/latest)**

| Platform | Installer |
|----------|-----------|
| Mac (Apple Silicon) | `.dmg` (aarch64) |
| Mac (Intel) | `.dmg` (x86_64) |
| Windows | `.msi` or setup `.exe` |

---

## Screenshots

![Home screen](docs/screenshots/01-home.png)

| | |
|---|---|
| ![Editor](docs/screenshots/02-canvas-overview.png) | ![Canvas](docs/screenshots/03-canvas-zoom.png) |
| ![Layers](docs/screenshots/04-layers.png) | ![Properties](docs/screenshots/05-properties.png) |

More images: [`docs/screenshots/`](docs/screenshots/)

---

## Features (v1.0)

- Infinite canvas with pan, zoom, snapping, and pixel grid
- Tools: frames, shapes, pen, lines, text, images
- Layers, pages, color styles, text styles, and components
- Save/open `.kirutma` files · export PNG (1×–3×) and SVG
- Keyboard shortcuts and undo/redo

See **[USER_MANUAL.md](./USER_MANUAL.md)** for the full guide.

---

## Build from source

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Rust](https://rustup.rs) 1.77+
- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

### Commands

```bash
cd apps/desktop
npm install
npm run tauri dev      # development
npm run build:app      # production build
```

Release builds and CI details: [DISTRIBUTION.md](./DISTRIBUTION.md)

---

## License

Copyright © 2026 **Alexandar Vincent Paulraj**. All rights reserved.

Proprietary software — see [LICENSE](./LICENSE) and [COPYRIGHT](./COPYRIGHT).
