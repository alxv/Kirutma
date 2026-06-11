# Kirutma User Manual

**Version 1.0.0**

Kirutma is a desktop design application for creating layouts and vector graphics on an infinite canvas. This guide covers everything you need to get started, work efficiently, and save or export your designs.

---

## Table of contents

1. [Getting started](#1-getting-started)
2. [The interface](#2-the-interface)
3. [Navigating the canvas](#3-navigating-the-canvas)
4. [Drawing tools](#4-drawing-tools)
5. [Selecting and editing objects](#5-selecting-and-editing-objects)
6. [Layers panel](#6-layers-panel)
7. [Properties panel](#7-properties-panel)
8. [Pages](#8-pages)
9. [Assets: styles, components, and library](#9-assets-styles-components-and-library)
10. [Files and documents](#10-files-and-documents)
11. [Import and export](#11-import-and-export)
12. [Keyboard shortcuts](#12-keyboard-shortcuts)
13. [Tips and troubleshooting](#13-tips-and-troubleshooting)

---

## 1. Getting started

### Install the app

Download Kirutma from your release page or installer package. See [DISTRIBUTION.md](./DISTRIBUTION.md) for build and install details.

### Home screen

When you launch Kirutma, the home screen offers:

- **New file** — start a blank document
- **Open file…** — browse for an existing `.kirutma` document
- **Recent files** — quick access to files you opened recently (with **Clear** to reset the list)

Keyboard shortcuts on the home screen:

| Action | Shortcut |
|--------|----------|
| New file | `Ctrl+N` (Mac: `⌘N`) |
| Open file | `Ctrl+O` (Mac: `⌘O`) |

### Return to the home screen

Click the **Kirutma** logo in the top-left of the menu bar. If you have unsaved changes, you will be asked to confirm before leaving the editor.

---

## 2. The interface

The editor is organized into familiar regions:

```
┌──────────────────────────────────────────────────────────────┐
│  Menu bar (File · Edit · View · Object · Help)                │
├──────────────────────────────────────────────────────────────┤
│  Toolbar (tools · zoom · snapping · pixel grid)              │
├────────────┬─────────────────────────────────────┬───────────┤
│  Left      │                                     │  Right    │
│  panel     │         Infinite canvas             │  panel    │
│  Layers /  │                                     │  Properties│
│  Pages /   │                                     │           │
│  Assets    │                                     │           │
├────────────┴─────────────────────────────────────┴───────────┤
│  Page tabs                                                  │
└──────────────────────────────────────────────────────────────┘
```

### Menu bar

| Menu | Main actions |
|------|----------------|
| **File** | New, Open, Open Recent, Save, Save As, Import Image, Export PNG/SVG |
| **Edit** | Undo, Redo, Duplicate, Copy, Paste |
| **View** | Zoom to Selection, Zoom to Fit |
| **Object** | Group, Ungroup, Create Component, Detach Instance |
| **Help** | Keyboard Shortcuts |

The file name appears next to the logo. Click it to rename the document. A dot (`•`) indicates unsaved changes.

### Toolbar

- **Tool buttons** — switch between Move, Frame, shapes, Pen, Text, Hand, and Scale
- **Frame presets** — when the Frame tool is active: iPhone 15, Tablet, Desktop, or Custom
- **Zoom controls** — zoom out, percentage (click to reset to 100%), zoom in, zoom to selection, zoom to fit
- **Snapping** — toggle object and grid snapping
- **Pixel grid** — toggle a pixel alignment grid on the canvas

### Panel toggles

Icons in the top-right of the menu bar show or hide the **Layers** (left) and **Properties** (right) panels.

---

## 3. Navigating the canvas

The canvas is infinite — you can pan and zoom freely.

| Action | How |
|--------|-----|
| **Pan** | Select **Hand** (`H`) and drag, or hold **Space** and drag |
| **Zoom in** | `Ctrl++` (Mac: `⌘+`), toolbar **+**, or scroll/pinch |
| **Zoom out** | `Ctrl+-` (Mac: `⌘-`), toolbar **−**, or scroll/pinch |
| **Zoom to 100%** | `Ctrl+0` (Mac: `⌘0`) or click the zoom percentage |
| **Zoom to selection** | `Shift+1` or toolbar selection icon |
| **Zoom to fit** | `Shift+0` or toolbar fit icon |

**Snapping** helps align objects to edges and the pixel grid. Turn it on or off from the toolbar.

**Pixel grid** overlays a grid for precise alignment. Useful when designing at exact pixel sizes.

---

## 4. Drawing tools

Press a letter key to switch tools quickly (when not typing in a text field).

| Tool | Key | What it does |
|------|-----|----------------|
| **Move** | `V` | Select, move, and transform objects |
| **Frame** | `F` | Draw a frame (artboard/container) |
| **Rectangle** | `R` | Draw a rectangle |
| **Ellipse** | `O` | Draw an ellipse or circle |
| **Triangle** | `3` | Draw a triangle |
| **Polygon** | `P` | Draw a polygon (adjust sides in Properties) |
| **Star** | `S` | Draw a star (adjust points and inner radius in Properties) |
| **Pen** | `D` | Draw vector paths with anchor points |
| **Line** | `L` | Draw a straight or curved line |
| **Text** | `T` | Click to place a text box |
| **Hand** | `H` | Pan the canvas |
| **Scale** | `K` | Scale objects from a corner handle |

### Drawing shapes and frames

1. Select a shape or frame tool.
2. Click and drag on the canvas to define size.
3. Hold **Shift** while dragging to constrain proportions (square, circle, etc.).

### Frame presets

With the **Frame** tool active, choose a preset before drawing:

| Preset | Size |
|--------|------|
| iPhone 15 | 393 × 852 |
| Tablet | 820 × 1180 |
| Desktop | 1440 × 900 |
| Custom | Drag any size |

### Pen tool

1. Select **Pen** (`D`).
2. Click to place anchor points; click again to add segments.
3. Adjust curve handles by dragging control points on the path.
4. Close a path or finish the shape from the Properties panel.

### Line tool

Draw a line between two points. In Properties you can set:

- **Path** — straight or curved
- **Bend** — curve amount (for curved lines)
- **Dash** — solid or dashed
- **Start / End** — arrow or dot endpoints

### Text tool

1. Select **Text** (`T`).
2. Click on the canvas to place text.
3. Edit content, font, size, weight, alignment, and line height in the **Properties** panel.

---

## 5. Selecting and editing objects

### Select one object

- Click it with the **Move** tool (`V`).

### Select multiple objects

- **Shift+click** to add or remove from selection
- Drag a **marquee** (selection box) on empty canvas with the Move tool

### Move, resize, and rotate

With objects selected:

- **Move** — drag inside the selection
- **Resize** — drag corner or edge handles
- **Rotate** — drag the rotation handle, or set **Rotation** in Properties
- **Constrain proportions** — hold **Shift** while resizing

### Align multiple objects

Select two or more layers. The Properties panel shows alignment buttons:

- Align left, horizontal center, right
- Align top, vertical center, bottom

You can also bulk-edit **Opacity** and **Fill** when multiple compatible shapes are selected.

### Group and ungroup

| Action | Menu | Shortcut |
|--------|------|----------|
| Group | Object → Group | `Ctrl+G` (Mac: `⌘G`) |
| Ungroup | Object → Ungroup | `Ctrl+Shift+G` (Mac: `⇧⌘G`) |

Groups keep related objects together in the Layers panel.

### Duplicate, copy, paste, delete

| Action | Shortcut |
|--------|----------|
| Duplicate | `Ctrl+D` (Mac: `⌘D`) |
| Copy | `Ctrl+C` (Mac: `⌘C`) |
| Paste | `Ctrl+V` (Mac: `⌘V`) |
| Delete | `Delete` |

Copy and paste work within Kirutma and with the system clipboard for supported content.

### Undo and redo

| Action | Shortcut |
|--------|----------|
| Undo | `Ctrl+Z` (Mac: `⌘Z`) |
| Redo | `Ctrl+Shift+Z` (Mac: `⇧⌘Z`) |

### Context menu

**Right-click** on the canvas or a layer to open a shortcut menu with Copy, Paste, Duplicate, layer ordering, visibility, lock, and Delete.

---

## 6. Layers panel

Open the left panel and select the **Layers** tab.

### Layer list

- Layers mirror the object hierarchy on the active page
- **Click** a layer to select it on the canvas
- **Double-click** a name to rename
- **Eye icon** — show or hide the layer
- **Lock icon** — prevent accidental edits

### Search

Use the search box at the top to filter layers by name.

### Reorder layers

Drag a layer row up or down to change stacking order (what appears in front or behind).

### Layer context menu

Right-click a layer for:

- Copy, Paste, Duplicate
- Create Component (frames and groups)
- Detach Instance / Reset Overrides (component instances)
- Bring Forward, Send Backward
- Hide / Show, Lock / Unlock
- Delete

---

## 7. Properties panel

The right **Properties** panel shows settings for the selected layer(s). If nothing is selected, it prompts you to select a layer.

### Transform (all objects)

| Property | Description |
|----------|-------------|
| **X, Y** | Position on the canvas |
| **W, H** | Width and height (where applicable) |
| **Rotation** | Angle in degrees |
| **Opacity** | 0–100% transparency |

### Fill (shapes, frames, vectors)

- **Color** — color picker and hex field
- **Style** — apply a saved color style
- **Gradient** — enable linear gradient with start, end, and angle

### Stroke

- **Color** and **Weight** for outline thickness

### Corner radius

Rectangles and frames support **Radius** for rounded corners.

### Polygon and star

- **Sides** — number of polygon sides
- **Points** / **Inner** — star point count and inner radius

### Drop shadow

Available on vector shapes, rectangles, frames, ellipses, polygons, and stars:

- Toggle **Shadow** on or off
- Adjust **X offset**, **Y offset**, **Blur**, and **Color**

### Text properties

- **Content** — edit the text body
- **Size**, **Font**, **Weight**
- **Align** — left, center, right
- **Style** — apply a saved text style
- **Line H** — line height

### Images

- View source dimensions
- **Replace image…** — swap the image file

### Component instances

When a component instance is selected:

- **Source** — which component it comes from
- **Detach** — break the link and edit freely
- **Reset overrides** — restore default component appearance

---

## 8. Pages

Each document can contain multiple pages (like artboards or screens in one file).

### Page tabs

Page tabs run along the bottom of the editor:

- **Click** a tab to switch pages
- **Double-click** a tab name to rename
- **+** button — add a new page
- **×** on a tab — delete that page (confirmation required; at least one page always remains)

### Pages panel

In the left panel, open the **Pages** tab for an alternate view of your page list.

---

## 9. Assets: styles, components, and library

Open the left panel and select the **Assets** tab.

### Color styles

Reusable color swatches for your document.

1. Click **+** to add a color style
2. Name it and set its color
3. Apply from the Properties panel (**Fill → Style**) or click a style to apply to the selection

### Text styles

Reusable typography presets (font, size, weight, line height).

1. Add a text style with **+**
2. Edit name and properties
3. Apply from **Properties → Style** on text layers

### Components

Turn repeated design elements into reusable components.

**Create a component**

1. Select a **frame** or **group**
2. Choose **Object → Create Component**, or right-click the layer → **Create Component**

**Place an instance**

- Click a component in the Assets panel to insert it at the center of the canvas

**Detach an instance**

- Select the instance → **Object → Detach Instance**, or use the Properties panel / layer context menu

**Reset overrides**

- Restore an instance to match its source component after local edits

### Symbol library

The **Library** section includes built-in icons and symbols (buildings, signs, stamps, and more).

1. Search or filter by category
2. **Click** a symbol to insert it at the canvas center

---

## 10. Files and documents

### Document format

Kirutma saves files with the **`.kirutma`** extension. These are portable documents that store your pages, layers, styles, components, and embedded images.

### Save

| Action | Menu | Shortcut |
|--------|------|----------|
| Save | File → Save | `Ctrl+S` (Mac: `⌘S`) |
| Save As | File → Save As… | `Ctrl+Shift+S` (Mac: `⇧⌘S`) |

The first time you save a new file, you choose a name and location. After that, **Save** updates the same file.

An unsaved indicator (`•`) appears next to the file name when changes have not been saved.

### Open

- **File → Open…** or `Ctrl+O` (Mac: `⌘O`)
- **File → Open Recent** — pick from recently opened files
- From the home screen: **Open file…** or click a recent file

If a recent file no longer exists on disk, it is removed from the list when open fails.

### New document

- **File → New** or `Ctrl+N` (Mac: `⌘N`)
- From the home screen: **New file**

If you have unsaved changes, you will be prompted before creating a new document or opening another file.

---

## 11. Import and export

### Import an image

**File → Import Image…**

The image is placed on the active page. Select it to move, resize, or replace the source from Properties.

### Export PNG

Export renders your current selection (or all drawable content if applicable):

| Menu item | Output |
|-----------|--------|
| Export PNG (1x) | Standard resolution |
| Export PNG (2x) | Double resolution |
| Export PNG (3x) | Triple resolution |

Files download as `kirutma-export.png`, `kirutma-export@2x.png`, or `kirutma-export@3x.png`.

Export is disabled when there is nothing to export.

### Export SVG

**File → Export SVG…**

Exports the selection as a vector SVG file (`kirutma-export.svg`).

---

## 12. Keyboard shortcuts

Open the full reference anytime: **Help → Keyboard Shortcuts…** or `Ctrl+?` (Mac: `⌘?`).

### Tools

| Tool | Key |
|------|-----|
| Move | `V` |
| Frame | `F` |
| Rectangle | `R` |
| Ellipse | `O` |
| Triangle | `3` |
| Polygon | `P` |
| Star | `S` |
| Pen | `D` |
| Line | `L` |
| Text | `T` |
| Hand | `H` |
| Scale | `K` |

### File

| Action | Mac | Windows / Linux |
|--------|-----|-----------------|
| New | `⌘N` | `Ctrl+N` |
| Open | `⌘O` | `Ctrl+O` |
| Save | `⌘S` | `Ctrl+S` |
| Save As | `⇧⌘S` | `Ctrl+Shift+S` |

### Edit

| Action | Mac | Windows / Linux |
|--------|-----|-----------------|
| Undo | `⌘Z` | `Ctrl+Z` |
| Redo | `⇧⌘Z` | `Ctrl+Shift+Z` |
| Duplicate | `⌘D` | `Ctrl+D` |
| Copy | `⌘C` | `Ctrl+C` |
| Paste | `⌘V` | `Ctrl+V` |
| Delete | `Delete` | `Delete` |
| Group | `⌘G` | `Ctrl+G` |
| Ungroup | `⇧⌘G` | `Ctrl+Shift+G` |

### View

| Action | Mac | Windows / Linux |
|--------|-----|-----------------|
| Zoom in | `⌘+` | `Ctrl++` |
| Zoom out | `⌘-` | `Ctrl+-` |
| Zoom to 100% | `⌘0` | `Ctrl+0` |
| Zoom to selection | `⇧1` | `Shift+1` |
| Zoom to fit | `⇧0` | `Shift+0` |
| Pan | Space + drag | Space + drag |
| Constrain proportions | Shift + drag | Shift + drag |
| Keyboard shortcuts | `⌘?` | `Ctrl+?` |

---

## 13. Tips and troubleshooting

### General tips

- **Save often** — use `Ctrl+S` / `⌘S` after major changes
- **Name your layers** — double-click in the Layers panel for clearer documents
- **Use frames** — group screen designs inside frames with presets for common device sizes
- **Styles and components** — define colors and text once, reuse everywhere
- **Export at 2× or 3×** — for sharp assets on high-density displays

### Common issues

**I can't save or open a file**

- Ensure you have permission to read and write the chosen folder
- Check that the file is a valid `.kirutma` document and not corrupted

**Export says “Nothing to export”**

- Add drawable content to the canvas or adjust your selection

**Create Component is disabled**

- Select a **frame** or **group** first (not a single shape inside a group unless the group itself is selected)

**Detach Instance does nothing**

- Select a **component instance** (not the original component source)

**Changes show as unsaved after Undo**

- The unsaved indicator may remain after undo/redo even when content matches the last saved state. Use **Save** when you are ready to persist.

**Leaving the editor**

- Click the Kirutma logo to return home; confirm if prompted about unsaved changes

### Getting help

For installation and distribution, see [DISTRIBUTION.md](./DISTRIBUTION.md).

For launch and sharing materials, see [marketing/README.md](./marketing/README.md).

---

## Appendix: What’s in v1.0

**Included**

- Infinite canvas with pan, zoom, snapping, and pixel grid
- Full drawing toolset (frames, shapes, pen, lines, text, images)
- Layers, pages, alignment, grouping
- Color styles, text styles, components
- `.kirutma` save/open and recent files
- PNG and SVG export
- Undo/redo and keyboard shortcuts

**Not yet included**

- Real-time collaboration
- Prototyping and interactive previews
- Auto layout constraints
- Plugin system
- Cloud sync or accounts

These may arrive in future releases. Feedback helps prioritize what comes next.

---

*Kirutma — Design with frames, shapes, and text on an infinite canvas.*

*Copyright © 2026 Alexandar Vincent Paulraj. All rights reserved.*
