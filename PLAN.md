# Kirutma — Figma-Class Design Tool

> Standalone desktop design application for macOS and Windows.  
> Codename: **Kirutma** · Target: Figma-level polish, infinite canvas, GPU rendering.

---

## 1. Executive Summary

Building a tool that feels **exactly like Figma** is a multi-year effort (Figma has 1000+ engineers, a custom C++ renderer, CRDT multiplayer, and a decade of polish). This plan defines a **realistic MVP** that delivers the core Figma experience — infinite canvas, buttery pan/zoom, selection/transform, frames, shapes, text, layers, properties panel, and native desktop feel — while architecting for Figma-scale evolution.

**Honest scope framing:**

| Tier | Timeline | Outcome |
|------|----------|---------|
| **MVP v0.1** | 10–12 weeks | Usable local design tool; feels like early Figma |
| **MVP v1.0** | 6 months | Components, styles, export, shortcuts parity |
| **v2.0** | 12 months | Auto layout, prototyping, real-time collab |
| **v3.0+** | 18+ months | Plugins, dev mode, design systems at scale |

---

## 2. Adopted from `sample_design.md` (reference only)

The sample prompt was used as a **structural reference**, not as the full spec. Only these items carry forward:

| Adopted ✅ | Kirutma adaptation |
|------------|-------------------|
| UI shell layout (toolbar → left / center / right) | Same spatial model; see §5 layout |
| Hardware-accelerated canvas only — **no DOM nodes on the design surface** | Native wgpu + Vello, not HTML/SVG/Canvas2D |
| **Zustand** for ephemeral UI state (active tool, panel toggles) | Unchanged |
| **R-tree** spatial index for fast hit testing | Rust geometry module |
| **CanvasRenderer** pattern: matrix camera (pan/zoom) + dirty-region redraw | Tile-based GPU renderer (256×256 tiles) |
| Hit testing: bounding boxes first, ray-cast for paths (v1.0) | Phase 1 bbox; pen paths in v1.0 |
| Resize handles; **Shift** constrains aspect ratio | Selection transform module |
| Tailwind dark theme + two-way property panel binding | Inspector ↔ scene graph via IPC |
| Sequential build: shell → renderer → interaction → UI → shortcuts | Phases 0–3 below |
| Local file save/open via native dialogs | `.kirutma` bundle (not `.flow`) |
| Vite + TypeScript for UI | Tauri 2 shell instead of Electron |

| Skipped from sample ❌ | Reason |
|----------------------|--------|
| Electron | Tauri 2 — smaller binary, native feel |
| Canvas 2D / Paper.js | Does not scale to Figma-level performance |
| CRDT (Yjs/Automerge) in MVP | Command undo first; Loro CRDT in v2.0 |
| Pen tool + boolean ops in MVP | Deferred to v1.0 |
| Asset / component library in MVP | Deferred to v1.0 |
| Generate entire codebase in one pass | Phased deliverables with acceptance tests |

---

## 3. Research Findings

### How Figma Actually Works

```
┌─────────────────────────────────────────────────────────────┐
│  UI Chrome — TypeScript + React (toolbar, panels, menus)    │
├─────────────────────────────────────────────────────────────┤
│  Document Model — C++ scene graph (nodes, constraints)      │
├─────────────────────────────────────────────────────────────┤
│  Renderer — C++ tile-based GPU engine (WebGL → WebGPU)      │
│  • Infinite canvas via tile caching                         │
│  • Dirty-region partial refresh                             │
│  • MSAA, blend modes, nested opacity, blur (compute shaders)│
└─────────────────────────────────────────────────────────────┘
         Compiled to WASM (browser) + native (server/desktop)
```

Key insight from [Figma's 2015 architecture post](https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/): they rejected HTML/SVG/Canvas2D and built a **custom tile-based WebGL renderer** because Canvas2D re-uploads geometry every frame and DOM-based rendering can't handle 10k+ objects at 60fps.

In 2025, Figma migrated primary rendering to **WebGPU** (with WebGL fallback), using Dawn for native parity.

### Open-Source References

| Project | Stack | Lesson |
|---------|-------|--------|
| **Penpot** | ClojureScript + React + PostgreSQL + Redis | Full design tool is feasible OSS; collab via pub/sub |
| **Vello** (Linebender) | Rust + wgpu compute shaders | Modern GPU 2D path; Figma-like performance potential |
| **react-vello** | React + Vello WASM + WebGPU | Declarative canvas API; early but promising |
| **Tauri + wgpu** | Native GPU surface + WebView UI overlay | Best of both worlds for desktop (see FabianLars/tauri-v2-wgpu) |

### What "Figma-like" Really Means (UX Pillars)

1. **Infinite canvas** — pan/zoom without jank; pinch-to-zoom on trackpad
2. **Instant feedback** — selection, drag, resize at 60fps with 1000+ nodes
3. **Spatial UI** — toolbar top, layers left, properties right; dark theme
4. **Keyboard-first** — V/M/R/O/T/F/H shortcuts, ⌘D duplicate, ⌘G group
5. **Direct manipulation** — 8-point resize handles, rotation, multi-select marquee
6. **Smart snapping** — pixel grid, object edges, spacing guides
7. **Non-destructive editing** — fills, strokes, effects as properties, not baked

---

## 4. Recommended Tech Stack

### Decision: Tauri 2 + React + Rust GPU Core

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Desktop shell** | [Tauri 2.x](https://tauri.app) | Native menus, shortcuts, ~15MB installer, macOS/Windows from one codebase. Figma desktop uses Electron (~120MB); Tauri gives native feel with smaller footprint. |
| **UI chrome** | React 19 + TypeScript | Same paradigm as Figma's UI layer. Largest ecosystem for design-tool panels. |
| **Styling** | Tailwind CSS v4 + CSS variables | Rapid Figma-dark-theme replication; design tokens via CSS custom properties. |
| **UI primitives** | Radix UI (unstyled) | Accessible dropdowns, popovers, context menus — styled to match Figma exactly. |
| **Canvas renderer** | **Rust + wgpu + Vello** (native surface) | GPU compute 2D rendering; same class as Figma's engine. Rendered via Tauri v2 multi-surface (WebView UI over native wgpu canvas). |
| **Path geometry** | Lyon (Rust) | Bézier tessellation, boolean ops foundation. |
| **Typography** | cosmic-text + skrifa (Rust) | GPU text layout; avoids browser font inconsistencies Figma complained about. |
| **Document model** | Rust core → WASM bindings (Phase 1: TS, migrate Phase 2) | Scene graph, hit testing, transforms in Rust for perf; TS bridge initially for velocity. |
| **UI state** | Zustand + Immer | Lightweight; matches design-tool event patterns. |
| **Persistence** | SQLite + `.kirutma` file bundle | Local-first; JSON/MessagePack scene + asset folder (like `.fig` zip). |
| **Collab (v2)** | Loro CRDT + WebSocket | Same CRDT family modern collab tools use; offline-first merge. |
| **Build** | Vite + cargo + tauri-cli | Fast HMR for UI; Rust compiled natively. |
| **Testing** | Vitest (UI) + cargo test (core) | Unit tests for geometry; Playwright for E2E. |

### Why Not Alternatives?

| Alternative | Rejected Because |
|-------------|------------------|
| **Electron + Konva/Fabric** | Canvas2D doesn't scale; 120MB+ bundle; not Figma-class perf |
| **Electron + PixiJS** | Game-oriented; missing vector precision, text editing, design semantics |
| **Pure web app (PWA)** | User asked for standalone macOS/Windows; misses native shortcuts, file associations |
| **Qt / SwiftUI native** | 2x UI implementation for macOS + Windows; slower iteration on panels |
| **Penpot stack (Clojure)** | Smaller hiring pool; no GPU renderer out of the box |

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        Tauri 2 Window                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              React UI (transparent WebView overlay)         │  │
│  │  ┌─────────┐ ┌──────────────────────────┐ ┌─────────────┐ │  │
│  │  │ Layers  │ │     Toolbar (top)        │ │ Properties  │ │  │
│  │  │ Panel   │ │                          │ │ Panel       │ │  │
│  │  │ (left)  │ │                          │ │ (right)     │ │  │
│  │  └─────────┘ └──────────────────────────┘ └─────────────┘ │  │
│  │              ┌──────────────────────────┐                  │  │
│  │              │  Canvas viewport (hole)  │  ← pointer events│  │
│  │              └──────────────────────────┘    forwarded     │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │         Native wgpu Surface (Vello renderer)               │  │
│  │  • Tile-based infinite canvas                              │  │
│  │  • Scene graph from Rust document core                     │  │
│  │  • 60fps pan/zoom, selection overlays                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
         ↕ Tauri IPC (commands + events)
┌──────────────────────────────────────────────────────────────────┐
│  Rust Backend                                                    │
│  • Document engine (scene graph, undo/redo)                      │
│  • File I/O (.kirutma read/write)                                │
│  • Geometry (hit test, snap, bounds)                             │
│  • Export (PNG, SVG, PDF)                                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. MVP Definition

### MVP v0.1 — "It Feels Like Figma" (10–12 weeks)

**Goal:** A designer can open the app, create frames, draw shapes, add text, organize layers, and export PNG — with smooth 60fps canvas interaction.

#### In Scope ✅

**Application shell**
- [ ] Native window (macOS + Windows), dark theme
- [ ] Home screen: recent files, new file, open file
- [ ] Native menu bar (File, Edit, View, Object, Text)
- [ ] Auto-save to local `.kirutma` file
- [ ] Undo/redo (⌘Z / ⌘⇧Z) — command pattern, 100+ history

**Canvas**
- [ ] Infinite canvas with pan (Space + drag, middle mouse, two-finger scroll)
- [ ] Zoom (⌘+/⌘-, pinch gesture, zoom to selection, zoom to fit)
- [ ] Pixel grid + layout grid overlay
- [ ] Rulers (optional toggle)
- [ ] Multi-select (click, Shift+click, marquee drag)
- [ ] Snap to pixel grid, object edges, centers

**Tools (toolbar)**
- [ ] Move (V) — select, drag, nudge (arrow keys, Shift for 10px)
- [ ] Frame (F) — create artboard/frame with preset sizes (iPhone, Desktop, etc.)
- [ ] Rectangle (R) — rounded corners support
- [ ] Ellipse (O)
- [ ] Line (L)
- [ ] Text (T) — inline editing, font family/size/weight, alignment
- [ ] Hand (H) — pan only
- [ ] Scale (K) — uniform scale

**Selection & transform**
- [ ] 8-handle resize + corner radius on rects
- [ ] Rotation handle
- [ ] Bounding box with dimensions tooltip
- [ ] Group (⌘G) / Ungroup (⌘⇧G)
- [ ] Duplicate (⌘D), Delete, Copy/Paste

**Layers panel (left)** — *from sample: layer tree*
- [ ] Tree view mirroring scene graph
- [ ] Drag to reorder, rename (double-click)
- [ ] Show/hide (eye), lock
- [ ] Search/filter layers
- [ ] Pages tab (shell only in v0.1; multi-page editing in v1.0)

**Properties panel (right)** — *from sample: design inspector*
- [ ] Two-way binding: edit X/Y/W/H/fill/stroke/radius → canvas updates live
- [ ] Position (X, Y), size (W, H), rotation
- [ ] Fill: solid color, linear gradient (2 stops)
- [ ] Stroke: color, weight, position (inside/center/outside)
- [ ] Corner radius (uniform + individual corners)
- [ ] Opacity
- [ ] Blend mode (normal, multiply, screen, overlay — top 8 modes)

**Export**
- [ ] Export selection or frame as PNG (1x, 2x, 3x)
- [ ] Export as SVG (basic shapes)

#### Out of Scope (v0.1) ❌

- Real-time multiplayer
- Components / instances
- Auto layout
- Prototyping / interactions
- Variables / design tokens
- Plugins
- Figma file import
- Dev mode / code inspect
- Comments
- Version history (beyond undo stack)
- Effects (drop shadow, blur) — deferred to v1.0

---

### MVP v1.0 — "Design System Ready" (+4 months)

- Components + instances with overrides
- Color/text styles (local)
- Constraints (pin to edges, scale)
- Auto layout (horizontal/vertical, padding, gap, hug/fill)
- Effects: drop shadow, layer blur, background blur
- Boolean operations (union, subtract, intersect, exclude)
- Vector pen tool (Bézier paths)
- Image fill + drag-drop images
- Pages (multiple canvases per file)
- Clipboard: copy/paste between files
- Keyboard shortcuts parity sheet
- PDF export

---

### v2.0 — "Collaboration" (+6 months)

- Real-time multiplayer (Loro CRDT + WebSocket server)
- Cursor presence, selection highlights
- Shared libraries (publish/subscribe components)
- Comments + annotations
- Branching / version history
- Figma `.fig` import (read-only initially)

---

## 6. UI/UX Design System (Figma Parity)

### Visual Language

| Token | Value | Notes |
|-------|-------|-------|
| `--bg-canvas` | `#1E1E1E` | Canvas background |
| `--bg-panel` | `#2C2C2C` | Side panels |
| `--bg-toolbar` | `#2C2C2C` | Top bar |
| `--bg-input` | `#383838` | Property inputs |
| `--border-subtle` | `#FFFFFF14` | 8% white dividers |
| `--text-primary` | `#FFFFFF` | Labels |
| `--text-secondary` | `#FFFFFFB3` | 70% white hints |
| `--accent` | `#0D99FF` | Figma blue — selection, links |
| `--accent-hover` | `#0B7FD4` | |
| `--selection` | `#0D99FF` | Selection outline |
| `--font-ui` | `Inter, -apple-system, sans-serif` | 11px/12px UI text |
| `--radius-sm` | `2px` | Inputs |
| `--radius-md` | `4px` | Buttons |
| `--panel-width` | `240px` | Left + right panels |
| `--toolbar-height` | `40px` | |

### Layout (matches Figma exactly)

```
┌─────────────────────────────────────────────────────────────────┐
│  ◉ Kirutma   File  Edit  View  Object  Text          Share ▾   │  40px
├──────┬──────────────────────────────────────────────────┬───────┤
│      │  ↖ ✋ ▭ ○ T △ ☆ ✏ │ 100% ▾ │  ◧ Layout grids     │       │
│      ├──────────────────────────────────────────────────┤       │
│ L    │                                                  │   P   │
│ a    │                                                  │   r   │
│ y    │              INFINITE CANVAS                     │   o   │
│ e    │              (native wgpu render)                │   p   │
│ r    │                                                  │   s   │
│ s    │                                                  │       │
│      │                                                  │  240px│
│240px │                                                  │       │
├──────┴──────────────────────────────────────────────────┴───────┤
│  ◧  ▭ Frame 1  ▭ Frame 2  +                                    │  tabs
└─────────────────────────────────────────────────────────────────┘
```

### Interaction Polish Checklist

- [ ] Cursor changes per tool (crosshair for frame, text I-beam, hand grab/grabbing)
- [ ] Hover states on all interactive elements (150ms ease)
- [ ] Selection handles: 8px white squares, 1px blue border
- [ ] Marquee selection: dashed blue rectangle
- [ ] Drag ghost at 50% opacity during move
- [ ] Property inputs: commit on Enter, revert on Escape
- [ ] Color picker: hex + HSB + eyedropper
- [ ] Context menu (right-click): copy, paste, duplicate, group, bring forward
- [ ] Toast notifications (bottom-right, auto-dismiss)
- [ ] Loading skeleton on file open
- [ ] 60fps target: profile with `requestAnimationFrame` budget < 16ms

---

## 7. Document Model

### Scene Graph (Node Types)

```typescript
type NodeType =
  | 'DOCUMENT'
  | 'PAGE'
  | 'FRAME'
  | 'GROUP'
  | 'RECTANGLE'
  | 'ELLIPSE'
  | 'LINE'
  | 'TEXT'
  | 'VECTOR';  // v1.0

interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
  visible: boolean;
  locked: boolean;
  opacity: number;        // 0–1
  blendMode: BlendMode;
  transform: Transform;   // x, y, rotation, scaleX, scaleY
  children?: BaseNode[];
}

interface FrameNode extends BaseNode {
  type: 'FRAME';
  width: number;
  height: number;
  fills: Fill[];
  clipsContent: boolean;
  layoutGrids?: LayoutGrid[];
}

interface RectangleNode extends BaseNode {
  type: 'RECTANGLE';
  width: number;
  height: number;
  cornerRadius: number | [number, number, number, number];
  fills: Fill[];
  strokes: Stroke[];
}
```

### File Format (`.kirutma`)

```
my-design.kirutma/          ← directory bundle (or zip)
├── manifest.json           ← version, pages list, metadata
├── pages/
│   └── page-1.json         ← scene graph (MessagePack optional)
├── assets/
│   ├── img-abc123.png
│   └── font-inter.woff2
└── thumbnail.png
```

---

## 8. Development Phases & Sprint Plan

Aligned with the sample's sequential steps (shell → renderer → interaction → UI binding → OS integration), adapted for Tauri + GPU.

### Phase 0 — Standalone Environment (Week 1–2) · *Sample Step 1*

| Task | Owner | Deliverable |
|------|-------|-------------|
| Scaffold Tauri 2 + React + Vite + Tailwind | FE | `npm run tauri dev` boots empty window |
| Native window frames (macOS traffic lights, Windows chrome) | FE | Platform-correct shell |
| Secure IPC (Tauri capabilities, no raw Node in renderer) | FE | Locked-down preload pattern |
| Integrate tauri-v2-wgpu demo pattern | Rust | Native wgpu surface renders test rect |
| Design tokens + dark theme CSS | FE | Figma-dark shell layout (no canvas yet) |
| CI: GitHub Actions (build macOS + Windows) | DevOps | Green builds on both platforms |

### Phase 1 — Vector Engine (Week 3–5) · *Sample Step 2*

| Task | Deliverable |
|------|-------------|
| `CanvasRenderer` — matrix pipeline (translate, scale) for infinite pan/zoom | Camera system, world ↔ screen coords |
| Tile-based render loop (256×256 tiles, dirty bounding regions) | Only redraw changed tiles |
| Basic shapes: rect, ellipse, line | GPU rendered via Vello |
| Hit testing (R-tree + bounding boxes) | Click to select |
| Selection overlay (8 handles, bounding box, Shift = constrain ratio) | Figma-like transform UI |

### Phase 2 — Interaction & Document (Week 6–8) · *Sample Steps 3–4*

| Task | Deliverable |
|------|-------------|
| Pointer handlers: drag, resize anchors, marquee select | Mouse + trackpad input |
| Scene graph CRUD (create, delete, reparent) | Layers panel wired |
| Undo/redo command stack (not CRDT) | ⌘Z / ⌘⇧Z |
| Properties inspector — two-way bind to selected node | Right panel live updates |
| File save/load (`.kirutma`) via native dialogs | Persistence |
| Snap system (pixel grid + object edges) | Smart guides |

### Phase 3 — Tools, OS Integration & Polish (Week 9–12) · *Sample Step 5*

| Task | Deliverable |
|------|-------------|
| All MVP tools (V, F, R, O, L, T, H, K) | Toolbar complete |
| Text editing (cosmic-text integration) | Inline text tool |
| Desktop keyboard shortcuts wired to command stack | Shortcut sheet |
| Export PNG/SVG | File → Export |
| Home screen + recent files | App shell complete |
| Performance pass (1000 nodes @ 60fps) | Benchmark report |

---

## 9. Project Structure

```
kirutma/
├── apps/
│   └── desktop/                 # Tauri app
│       ├── src/                 # React UI
│       │   ├── components/
│       │   │   ├── canvas/      # Viewport wrapper, overlays
│       │   │   ├── toolbar/
│       │   │   ├── layers-panel/
│       │   │   ├── properties-panel/
│       │   │   └── ui/          # Radix-based design system
│       │   ├── stores/          # Zustand stores
│       │   ├── hooks/
│       │   └── App.tsx
│       ├── src-tauri/           # Rust backend
│       │   ├── src/
│       │   │   ├── main.rs
│       │   │   ├── renderer/    # wgpu + Vello integration
│       │   │   ├── document/    # Scene graph, undo
│       │   │   ├── geometry/    # Hit test, snap, bounds
│       │   │   └── io/          # File read/write
│       │   └── Cargo.toml
│       └── package.json
├── crates/
│   ├── kirutma-core/            # Shared Rust document model
│   └── kirutma-render/          # Vello renderer + tile system
├── docs/
│   ├── architecture.md
│   └── shortcuts.md
├── PLAN.md                      # This file
└── README.md
```

---

## 10. Performance Targets

| Metric | Target |
|--------|--------|
| Canvas frame rate | 60fps with 1,000 nodes |
| Pan/zoom latency | < 8ms input-to-frame |
| File open (10MB) | < 2 seconds |
| Undo/redo | < 16ms |
| App cold start | < 3 seconds |
| Installer size | < 25 MB |
| Memory (empty doc) | < 150 MB |
| Memory (1000 nodes) | < 400 MB |

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| wgpu + Tauri multi-surface complexity | High | Start from FabianLars/tauri-v2-wgpu; fallback to Electron if blocked > 2 weeks |
| Vello maturity (compute shader requirement) | Medium | WebGL2 fallback renderer for older GPUs; test on Intel integrated |
| Text editing complexity | High | Phase text tool last; use cosmic-text; defer rich typography to v1.0 |
| "Exactly like Figma" expectation creep | High | Strict MVP scope doc; weekly demo against Figma reference |
| macOS/Windows input differences | Medium | Test both platforms every sprint; abstract pointer/keyboard layer |
| Solo/small team velocity | High | TS document model first, migrate hot paths to Rust incrementally |

---

## 12. Team & Timeline Estimate

| Role | MVP v0.1 | Notes |
|------|----------|-------|
| 1× Rust/GPU engineer | Required | Renderer + document core |
| 1× Frontend engineer | Required | React UI + canvas integration |
| 0.5× Designer | Recommended | Figma parity QA, design tokens |
| 0.25× DevOps | Optional | CI, code signing, auto-update |

**Solo developer:** 6–8 months for MVP v0.1 (Rust learning curve adds 4–6 weeks).  
**2-person team:** 10–12 weeks for MVP v0.1.

---

## 13. Immediate Next Steps

1. **Approve this plan** — confirm MVP scope and stack
2. **Phase 0 scaffold** — Tauri + React + wgpu hello-world
3. **UI shell** — Figma-dark layout with placeholder panels
4. **Camera + tile renderer** — first interactive infinite canvas
5. **Weekly Figma parity review** — screen-record side-by-side comparison

---

## Appendix A: Keyboard Shortcuts (MVP)

| Shortcut | Action |
|----------|--------|
| `V` | Move tool |
| `F` | Frame tool |
| `R` | Rectangle |
| `O` | Ellipse |
| `L` | Line |
| `T` | Text |
| `H` | Hand (pan) |
| `K` | Scale |
| `Space` (hold) | Temporary hand tool |
| `⌘Z` / `⌘⇧Z` | Undo / Redo |
| `⌘D` | Duplicate |
| `⌘G` / `⌘⇧G` | Group / Ungroup |
| `⌘+` / `⌘-` | Zoom in / out |
| `⌘0` | Zoom to fit |
| `⌘1` | Zoom to 100% |
| `⌘2` | Zoom to selection |
| `Delete` / `Backspace` | Delete selection |
| `⌘A` | Select all |
| `⌘C` / `⌘V` / `⌘X` | Copy / Paste / Cut |
| `Shift` + drag | Constrain proportions |
| `⌥` + drag | Duplicate while dragging |

---

## Appendix B: Comparison Matrix

| Feature | Figma | Kirutma MVP v0.1 | Kirutma v1.0 |
|---------|-------|------------------|--------------|
| Infinite canvas | ✅ | ✅ | ✅ |
| GPU rendering | ✅ | ✅ | ✅ |
| Frames | ✅ | ✅ | ✅ |
| Basic shapes | ✅ | ✅ | ✅ |
| Text | ✅ | ✅ Basic | ✅ Rich |
| Components | ✅ | ❌ | ✅ |
| Auto layout | ✅ | ❌ | ✅ |
| Prototyping | ✅ | ❌ | ❌ |
| Multiplayer | ✅ | ❌ | ✅ (v2) |
| Plugins | ✅ | ❌ | ❌ |
| Native desktop | ✅ (Electron) | ✅ (Tauri) | ✅ |

---

*Last updated: June 10, 2026*
