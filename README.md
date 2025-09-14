# Collaginator

Pan, zoom, and stitch your images into a clean square grid collage, **fully local, zero cloud**. 
Click a tile to pick an image; drag to pan; scroll to zoom; export a crisp square PNG at any resolution.

---

## ✨ Features

- **Square grid layout** with adjustable rows & columns
- **Per‑tile pan & zoom** (drag to pan, mouse wheel to zoom at cursor)
- **Click‑to‑place**: click a tile → file picker opens → first selection fills that tile
- **Image pool**: additional selected files are queued for later use
- **Autofill**: quickly fill all empty tiles from the pool
- **Export to PNG**: choose an exact **square resolution** (e.g., 1024, 2048, 3000 px)
- **Local‑only**: uses `URL.createObjectURL` — no uploads, no analytics, no network
- **Drag & drop**: drop images anywhere on the grid to add them to the pool

> Collaginator is a plain HTML/CSS/JS app. No build step. No dependencies.

---

## 🚀 Quick Start

1. **Download** the project or copy the three files into a folder:
   ```text
   index.html
   style.css
   app.js
   ```
2. **Open** `index.html` in your browser (Chrome, Edge, Firefox, Safari).
3. **Click a tile** to select an image. Pan/zoom to frame each tile.
4. Set **Export size (px)** and click **Export PNG** to save a square collage.

---

## 🧭 Usage Guide

### Add images
- **Click a tile** → your OS file picker opens → select one or multiple images.
  - The **first** image fills the clicked tile immediately.
  - Any **additional** selected images are added to the **pool** (shown in the toolbar).
- **Drag & drop** images anywhere on the grid to add them to the pool.
- **Autofill** fills all **empty** tiles from the pool (left‑to‑right, top‑to‑bottom).

### Frame each tile (pan & zoom)
- **Drag** inside a tile to **pan** the image.
- **Scroll wheel** to **zoom** in/out at the mouse position.
- You can zoom **below 1×** to fit tall/wide images entirely; view recenters automatically.

### Export
- Choose your **Export size (px)** — the output is a **square PNG** of that size.
- The collage is **centered** inside the square if rows ≠ cols.
- Your per‑tile **framing is preserved** exactly in the export.

> Tip: Transparent background by default. You can set a solid color in `app.js` (see “Customize” below).

---

## 🎛 Controls (default bindings)

- **Click tile**: open file picker for that tile
- **Drag inside tile**: pan the image
- **Mouse wheel**: zoom at cursor (in/out)
- **Autofill**: fill all empty tiles from the pool
- **Clear Grid**: remove all images and resets framing
- **Export PNG**: export square PNG at chosen size

---

## 🔒 Privacy

- Images never leave your machine.
- Files are read via the browser’s **File API**; previews use **`blob:` URLs**.
- We revoke object URLs on replacement/clear/unload to manage memory.

---

## 🧩 Project Structure

```
index.html   # UI shell and controls (Rows, Cols, Export size, buttons)
style.css    # layout, square tiles, visual theme
app.js       # grid rendering, image pool, pan/zoom, export
```

---

## ❓ FAQ

**Why square tiles?**  
Square grids make album art collages clean and predictable. Pan/zoom lets you frame any aspect ratio inside the square.

**Why can’t I zoom further out?**  
Increase `MIN_SCALE` (lower value) in `app.js`. Default is `0.25` (25% of baseline).

**Export looks different from screen?**  
Export reproduces the same transform math (contain baseline + your pan/zoom). If you changed CSS sizes while exporting, the `getBoundingClientRect()` snapshots the current layout — keep the window steady during export.

**Can I right‑click to clear a tile?**  
Currently the toolbar **Clear Grid** resets everything. If you want per‑tile clear, it’s a tiny addition; open an issue or ask and we’ll paste the snippet.

---

## 🧪 Browser Support

- Chrome / Edge / Firefox / Safari (desktop)  
- Mobile browsers support panning; zooming requires a trackpad/wheel (a pinch‑zoom variant is easy to add if you need it).

---

## 🗺 Roadmap

- **double‑click to reset framing**
- **Pinch‑to‑zoom** on touch
- **Guides** (rule of thirds) overlay toggle
- Quick **size presets** (1080, 2048, 3000) next to Export size

---
