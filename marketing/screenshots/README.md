# Screenshot Guide

Add captured images here for website, social, and press use. This folder is intentionally empty until you capture from the running app.

---

## Recommended shots (6–8 total)

| Filename | What to show |
|----------|----------------|
| `01-home.png` | Home screen: logo, tagline, New file / Open file |
| `02-canvas-overview.png` | Full editor: toolbar, layers, canvas, properties |
| `03-canvas-zoom.png` | Zoomed canvas with multiple frames/shapes (shows infinite canvas) |
| `04-layers.png` | Layers panel with nested hierarchy visible |
| `05-properties.png` | Properties panel: fill, stroke, typography, or shadow |
| `06-styles-components.png` | Assets panel with color/text styles or components |
| `07-export.png` | Export menu or exported PNG/SVG result |
| `08-shortcuts.png` | Keyboard shortcuts sheet (Help menu) |

---

## Capture settings

- **Resolution:** Native display or 1920×1080 minimum for web; 2560×1600 for hero images  
- **Theme:** Use default dark UI (no OS light mode chrome if possible)  
- **Content:** Use neutral demo content — fake app UI, geometric layouts, no personal data  
- **Format:** PNG for UI screenshots; JPEG only if file size is critical  

---

## How to capture

1. Open Kirutma (`/Applications/Kirutma.app` or `npm run tauri dev`).  
2. Create a demo file with 2–3 frames, varied shapes, one text block, one component.  
3. Use system screenshot tool (e.g. ⇧⌘4 on Apple systems) or window capture.  
4. Crop consistent margins; keep menu bar visible in “overview” shots.  
5. Save with the filenames above into this folder.

---

## Social crop sizes (reference)

| Platform | Size |
|----------|------|
| X / Twitter post | 1200×675 (16:9) |
| LinkedIn post | 1200×627 |
| Instagram square | 1080×1080 |
| Open Graph / link preview | 1200×630 |

Export cropped versions to `screenshots/social/` if needed (optional subfolder).

---

## Alt text examples

- “Kirutma home screen with New file and Open file buttons”  
- “Kirutma editor showing infinite canvas with layers and properties panels”  
- “Color styles and components in the Kirutma Assets panel”

---

## Video (optional)

For launch, record a 30–60 s screen capture: New file → draw shapes → rename layer → Export PNG. Use for Product Hunt, X, and YouTube (see [social-media.md](../social-media.md)).
