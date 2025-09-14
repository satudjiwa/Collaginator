const localInput   = document.getElementById('imageInput');
const gridEl       = document.getElementById('grid');
const rowsSelect   = document.getElementById('rowsSelect');
const colsSelect   = document.getElementById('colsSelect');
const autofillBtn  = document.getElementById('autofillBtn');
const clearBtn     = document.getElementById('clearBtn');
const exportBtn    = document.getElementById('exportBtn');
const poolCountEl  = document.getElementById('poolCount');
const dropHint     = document.getElementById('dropHint');
const view = new Map();
const MIN_SCALE = 1;
const MAX_SCALE = 6;

let rows = parseInt(rowsSelect.value, 10);
let cols = parseInt(colsSelect.value, 10);
let localPool = [];
let gridURLs = new Map();
let pendingTarget = null;

function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }

function updatePoolCount() {
  poolCountEl.textContent = `Pool: ${localPool.length}`;
}

function revokeURL(url) {
  try { URL.revokeObjectURL(url); } catch {}
}

function keyFor(i, j) { return `cell-${i}-${j}`; }

function renderGrid() {
  gridURLs.forEach(u => revokeURL(u));
  gridURLs.clear();
  view.clear();
  gridEl.innerHTML = '';

  gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id = keyFor(i, j);

      const hint = document.createElement('div');
      hint.className = 'hint';
      hint.textContent = 'Click to place image';
      cell.appendChild(hint);

      const img = document.createElement('img');
      img.alt = `Tile ${i+1}, ${j+1}`;
      img.decoding = 'async';
      img.loading = 'lazy';
      cell.appendChild(img);

      view.set(cell.id, { s: 1, tx: 0, ty: 0 });
      attachPanZoomHandlers(cell, i, j);

      gridEl.appendChild(cell);
    }
  }
}

function clearCell(i, j) {
  const cellId = keyFor(i, j);
  const existing = gridURLs.get(cellId);
  if (existing) {
    revokeURL(existing);
    gridURLs.delete(cellId);
  }
  const img = document.querySelector(`#${cellId} img`);
  if (img) {
    img.removeAttribute('src');
    img.removeAttribute('data-object-url');
    img.style.transform = `translate(0px, 0px) scale(1)`;
  }
  view.set(cellId, { s: 1, tx: 0, ty: 0 });
}

function setCellImage(i, j, url) {
  const cellId = keyFor(i, j);
  const prev = gridURLs.get(cellId);
  if (prev) revokeURL(prev);
  gridURLs.set(cellId, url);

  const img = document.querySelector(`#${cellId} img`);
  if (img) {
    img.src = url;
    img.dataset.objectUrl = url;
    view.set(cellId, { s: 1, tx: 0, ty: 0 });
    img.style.transform = `translate(0px, 0px) scale(1)`;
  }
  const hint = document.querySelector(`#${cellId} .hint`);
  if (hint) hint.remove();
}

function placeNextFromPool(i, j) {
  const url = localPool.shift();
  if (!url) return;
  setCellImage(i, j, url);
  updatePoolCount();
}

function collectFilesToPool(fileList) {
  const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
  for (const f of files) {
    localPool.push(URL.createObjectURL(f));
  }
  updatePoolCount();
}

function applyTransform(cellId) {
  const img = document.querySelector(`#${cellId} img`);
  if (!img) return;
  const st = view.get(cellId) || { s: 1, tx: 0, ty: 0 };
  img.style.transform = `translate(${st.tx}px, ${st.ty}px) scale(${st.s})`;
}

function clampPan(cell, st) {
  const rect = cell.getBoundingClientRect();
  const cw = rect.width, ch = rect.height;
  const maxLeft = 0;
  const minLeft = -(st.s - 1) * cw;
  const maxTop  = 0;
  const minTop  = -(st.s - 1) * ch;
  st.tx = clamp(st.tx, minLeft, maxLeft);
  st.ty = clamp(st.ty, minTop,  maxTop);
}

function attachPanZoomHandlers(cell, i, j) {
  const cellId = cell.id;

  let dragging = false;
  let moved = false;
  let startX = 0, startY = 0;
  let baseTx = 0, baseTy = 0;

  cell.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX; startY = e.clientY;

    const st = view.get(cellId);
    baseTx = st.tx; baseTy = st.ty;

    cell.setPointerCapture(e.pointerId);
    cell.classList.add('dragging');
  });

  cell.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && (Math.abs(dx) + Math.abs(dy) > 3)) moved = true;

    const st = view.get(cellId);
    st.tx = baseTx + dx;
    st.ty = baseTy + dy;
    clampPan(cell, st);
    applyTransform(cellId);
  });

  function endPointer(e) {
    if (!dragging) return;
    dragging = false;
    try { cell.releasePointerCapture(e.pointerId); } catch {}
    cell.classList.remove('dragging');

    if (!moved) {
      pendingTarget = { i, j };
      localInput.click();
    }
  }

  cell.addEventListener('pointerup', endPointer);
  cell.addEventListener('pointercancel', endPointer);
  cell.addEventListener('pointerleave', (e)=>{ if (dragging) endPointer(e); });
  cell.addEventListener('wheel', (e) => {
    e.preventDefault();

    const rect = cell.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const st = view.get(cellId);

    let factor = Math.exp(-e.deltaY * 0.0015);
    let newS = clamp(st.s * factor, MIN_SCALE, MAX_SCALE);
    factor = newS / st.s;

    st.tx = px + factor * (st.tx - px);
    st.ty = py + factor * (st.ty - py);
    st.s = newS;

    clampPan(cell, st);
    applyTransform(cellId);
  }, { passive: false });
}

localInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));

  if (files.length === 0) {
    pendingTarget = null;
    e.target.value = '';
    return;
  }

  localPool.forEach(revokeURL);
  localPool = [];
  const urls = files.map(f => URL.createObjectURL(f));

  if (pendingTarget) {
    const { i, j } = pendingTarget;
    const first = urls.shift();
    setCellImage(i, j, first);
    pendingTarget = null;
  }

  localPool.push(...urls);
  updatePoolCount();
  e.target.value = '';
});

['dragenter','dragover'].forEach(evt =>
  gridEl.addEventListener(evt, (e) => {
    e.preventDefault();
    gridEl.classList.add('drag-over');
  })
);
['dragleave','drop'].forEach(evt =>
  gridEl.addEventListener(evt, (e) => {
    e.preventDefault();
    if (evt === 'dragleave') gridEl.classList.remove('drag-over');
  })
);
gridEl.addEventListener('drop', (e) => {
  gridEl.classList.remove('drag-over');
  collectFilesToPool(e.dataTransfer.files);
});

autofillBtn.addEventListener('click', () => {
  if (localPool.length === 0) {
    localInput.click(); return;
  }
  let k = 0;
  outer: for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cellHasImg = document.querySelector(`#${keyFor(i,j)} img`)?.src;
      if (cellHasImg) continue;
      const url = localPool[k++];
      if (!url) break outer;
      setCellImage(i, j, url);
    }
  }
  if (k > 0) {
    localPool.splice(0, k);
    updatePoolCount();
  }
});

clearBtn.addEventListener('click', () => {
  gridURLs.forEach(revokeURL);
  gridURLs.clear();
  document.querySelectorAll('.cell img').forEach(img => {
    const u = img.dataset.objectUrl;
    if (u) revokeURL(u);
    img.removeAttribute('src');
    img.removeAttribute('data-object-url');
    img.style.transform = `translate(0px, 0px) scale(1)`;
  });
  
  view.forEach((_, id) => view.set(id, { s: 1, tx: 0, ty: 0 }));
});

exportBtn.addEventListener('click', async () => {
  const tileSize = 600 / Math.max(rows, cols); // adaptive base
  const size = Math.floor(tileSize);
  const W = cols * size;
  const H = rows * size;

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cellId = keyFor(i, j);
      const cell = document.getElementById(cellId);
      const imgEl = cell?.querySelector('img');
      if (!imgEl || !imgEl.src || !imgEl.naturalWidth) continue;

      const st = view.get(cellId) || { s: 1, tx: 0, ty: 0 };
      const rect = cell.getBoundingClientRect();
      const cw = rect.width, ch = rect.height;
      const iw = imgEl.naturalWidth, ih = imgEl.naturalHeight;
      const baseScale = Math.max(cw / iw, ch / ih);
      const offsetX = (cw - iw * baseScale) / 2;
      const offsetY = (ch - ih * baseScale) / 2;
      const dx = j * size;
      const dy = i * size;
      const scaleToTile = size / cw;

      ctx.save();
      ctx.beginPath();
      ctx.rect(dx, dy, size, size);
      ctx.clip();
      ctx.setTransform(
        st.s * baseScale * scaleToTile, 0,
        0, st.s * baseScale * scaleToTile,
        dx + (st.tx + offsetX * st.s) * scaleToTile,
        dy + (st.ty + offsetY * st.s) * scaleToTile
      );

      ctx.drawImage(imgEl, 0, 0);
      ctx.restore();
    }
  }

  const link = document.createElement('a');
  link.download = `collage_${rows}x${cols}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

function drawCover(ctx, img, dx, dy, dw, dh) {
  return new Promise(resolve => {
    if (img.complete && img.naturalWidth > 0) {
      _draw(); resolve(); return;
    }
    img.addEventListener('load', () => { _draw(); resolve(); }, { once: true });
    img.addEventListener('error', () => resolve(), { once: true });

    function _draw() {
      const sw = img.naturalWidth;
      const sh = img.naturalHeight;
      if (!sw || !sh) return;
      const sAspect = sw / sh;
      const dAspect = dw / dh;

      let sx, sy, sWidth, sHeight;
      if (sAspect > dAspect) {
        sHeight = sh;
        sWidth = sh * dAspect;
        sx = (sw - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = sw;
        sHeight = sw / dAspect;
        sx = 0;
        sy = (sh - sHeight) / 2;
      }
      ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
    }
  });
}

rowsSelect.addEventListener('change', () => {
  rows = parseInt(rowsSelect.value, 10);
  renderGrid();
});
colsSelect.addEventListener('change', () => {
  cols = parseInt(colsSelect.value, 10);
  renderGrid();
});

window.addEventListener('beforeunload', () => {
  gridURLs.forEach(revokeURL);
  localPool.forEach(revokeURL);
});

renderGrid();
