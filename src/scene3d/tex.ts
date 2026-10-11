// @ts-nocheck
// Procedural textures for the 3D street. Everything is drawn on canvases so there are no image files to ship.
// UVs on boxes are in metres (see box() in street.ts), so each texture states how many metres one tile covers.
import * as THREE from 'three';

export const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function make(w, h, draw, repeat, srgb = true, aniso = 8) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h, rng(11));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; t.repeat.set(repeat[0], repeat[1]);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const speckle = (g, w, h, r, n, a) => { for (let i = 0; i < n; i++) { const v = r() > 0.5 ? 255 : 0; g.fillStyle = `rgba(${v},${v},${v},${r() * a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } };

/** Brick: one tile = 4 bricks across x 13 courses = 0.86 m x 0.845 m. kind: 'red' | 'stock'. Returns { map, bump }. */
export function brick(kind = 'red') {
  const hue = kind === 'red' ? [8, 16] : [36, 46], sat = kind === 'red' ? [38, 52] : [22, 34], lit = kind === 'red' ? [30, 42] : [50, 62];
  const rows = 13, W = 512, bw = W / 4, bh = W / rows, rep = [1 / 0.86, 1 / 0.845];
  const bumpDraw = (g, w, h, r) => {
    g.fillStyle = '#222'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < rows; y++) for (let i = -1; i < 5; i++) { const x = i * bw + (y % 2 ? bw / 2 : 0), v = 150 + r() * 70; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x + 3, y * bh + 3, bw - 6, bh - 6); }
    speckle(g, w, h, r, 1800, 0.25);
  };
  const map = make(W, W, (g, w, h, r) => {
    g.fillStyle = kind === 'red' ? '#b9b2a6' : '#aaa296'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < rows; y++) for (let i = -1; i < 5; i++) {
      const x = i * bw + (y % 2 ? bw / 2 : 0), l = lit[0] + r() * (lit[1] - lit[0]);
      g.fillStyle = `hsl(${hue[0] + r() * (hue[1] - hue[0])}, ${sat[0] + r() * (sat[1] - sat[0])}%, ${l}%)`;
      g.fillRect(x + 3, y * bh + 3, bw - 6, bh - 6);
      if (r() > 0.82) { g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x + 3, y * bh + 3, bw - 6, bh - 6); }
    }
    speckle(g, w, h, r, 2600, 0.12);
  }, rep);
  const bump = make(W, W, bumpDraw, rep, false);
  return { map, bump };
}

/** Slate roof: one tile = 1 m x 1 m, 8 courses of staggered slates. */
export function slate(tint = '#3a3f46') {
  const base = new THREE.Color(tint), hsl = {}; base.getHSL(hsl);
  const rows = 9, W = 512, sh = W / rows, sw = W / 6;
  const map = make(W, W, (g, w, h, r) => {
    g.fillStyle = '#15171a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < rows; y++) for (let i = -1; i < 7; i++) {
      const x = i * sw + (y % 2 ? sw / 2 : 0);
      g.fillStyle = `hsl(${hsl.h * 360 + (r() - 0.5) * 8}, ${hsl.s * 100 + 4}%, ${hsl.l * 100 + (r() - 0.5) * 9}%)`;
      g.fillRect(x + 1.5, y * sh + 1.5, sw - 3, sh - 1);
      g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x + 1.5, y * sh + 1.5, sw - 3, 3);
    }
    speckle(g, w, h, r, 1500, 0.1);
  }, [1, 1]);
  const bump = make(W, W, (g, w, h, r) => { g.fillStyle = '#222'; g.fillRect(0, 0, w, h); for (let y = 0; y < rows; y++) for (let i = -1; i < 7; i++) { const x = i * sw + (y % 2 ? sw / 2 : 0), v = 140 + r() * 80; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x + 2, y * sh + 2, sw - 4, sh - 2); } }, [1, 1], false);
  return { map, bump };
}

/** Pavement: 600 mm concrete slabs, one tile = 1.2 m. */
export function paving() {
  const map = make(512, 512, (g, w, h, r) => {
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const l = 60 + r() * 8; g.fillStyle = `hsl(35, 4%, ${l}%)`; g.fillRect(x * 256, y * 256, 256, 256); }
    g.strokeStyle = 'rgba(30,30,30,.65)'; g.lineWidth = 4; g.strokeRect(0, 0, 512, 512); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.moveTo(0, 256); g.lineTo(512, 256); g.stroke();
    speckle(g, w, h, r, 5000, 0.18);
  }, [1 / 1.2, 1 / 1.2]);
  return { map };
}

/** Tarmac: one tile = 4 m. */
export function tarmac() {
  const map = make(512, 512, (g, w, h, r) => {
    g.fillStyle = '#4a4b4d'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const l = 28 + r() * 40; g.fillStyle = `hsla(220, 4%, ${l}%, ${0.3 + r() * 0.5})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  }, [1 / 4, 1 / 4]);
  return { map };
}

/** Victorian encaustic tile path, one tile = 0.6 m (2 x 2 tiles of 0.3 m). Red, black and cream diamonds. */
export function tilePath() {
  const map = make(512, 512, (g, w) => {
    const t = w / 2;
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      const ox = x * t, oy = y * t;
      g.fillStyle = '#d9cdb2'; g.fillRect(ox, oy, t, t);
      g.fillStyle = (x + y) % 2 ? '#8c3a2b' : '#23262b';
      g.beginPath(); g.moveTo(ox + t / 2, oy + 12); g.lineTo(ox + t - 12, oy + t / 2); g.lineTo(ox + t / 2, oy + t - 12); g.lineTo(ox + 12, oy + t / 2); g.closePath(); g.fill();
      g.fillStyle = '#d9cdb2'; g.beginPath(); g.arc(ox + t / 2, oy + t / 2, 26, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(60,50,40,.55)'; g.lineWidth = 3; g.strokeRect(ox + 1.5, oy + 1.5, t - 3, t - 3);
    }
  }, [1 / 0.6, 1 / 0.6]);
  return { map };
}

export function grass() {
  const map = make(256, 256, (g, w, h, r) => {
    g.fillStyle = '#5b8a3f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3800; i++) { g.fillStyle = `hsla(${80 + r() * 30}, ${32 + r() * 28}%, ${24 + r() * 24}%, .6)`; g.fillRect(r() * w, r() * h, 1.5, 3 + r() * 3); }
  }, [60, 60]);
  return { map };
}

/** Soft cloud puff for sprites. */
export function cloud() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d'), r = rng(5);
  for (let i = 0; i < 26; i++) { const x = 40 + r() * 176, y = 50 + r() * 34, rad = 22 + r() * 30, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Radial glow for lamp halos. */
export function glow() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,214,150,1)'); gr.addColorStop(0.25, 'rgba(255,190,110,.45)'); gr.addColorStop(1, 'rgba(255,170,80,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Brass house number plate. */
export function numberPlate(n) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#1b1d1f'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#b89a5e'; g.lineWidth = 4; g.strokeRect(6, 6, 116, 116);
  g.fillStyle = '#d8bb78'; g.font = 'bold 72px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/** Four-panel painted door for the neighbours' houses. */
export function neighbourDoor(color, n) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 6;
  g.strokeRect(34, 36, 188, 170); g.strokeRect(34, 232, 188, 244);
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(40, 42, 176, 6);
  g.fillStyle = '#c9a35a'; g.fillRect(104, 214, 48, 10); g.beginPath(); g.arc(200, 290, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#d8bb78'; g.font = 'bold 40px Georgia, serif'; g.textAlign = 'center'; g.fillText(String(n), 128, 150);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/** Fine grain for painted render and stone (bump only). */
export function renderGrain() {
  return make(256, 256, (g, w, h, r) => { g.fillStyle = '#888'; g.fillRect(0, 0, w, h); speckle(g, w, h, r, 9000, 0.35); }, [1, 1], false);
}
