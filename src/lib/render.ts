// @ts-nocheck
import React from 'react';
import { loadImg } from './core';

/**
 * Render the door as a small JPEG data URL (for the enquiry email and PDF).
 * `door` is the store's cached SVG renderer; react-dom/server is loaded lazily so it only costs bytes on submit.
 */
export async function doorPng(door, cfg, side, width = 420) {
  const PAD = 40;
  const { el, TW, TH } = door(cfg, side, { pad: PAD });
  return svgToJpeg(el, width, TW, TH, PAD);
}

async function svgToJpeg(el, width, TW, TH, PAD, transparent) {
  const height = Math.round((width * (TH + PAD)) / (TW + 2 * PAD));
  const { renderToStaticMarkup } = await import('react-dom/server');
  const svg = renderToStaticMarkup(React.cloneElement(el, { width, height }));
  const img = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  const cv = document.createElement('canvas');
  cv.width = width; cv.height = height;
  const ctx = cv.getContext('2d');
  if (!transparent) { ctx.fillStyle = '#F4F4F3'; ctx.fillRect(0, 0, width, height); }
  ctx.drawImage(img, 0, 0, width, height);
  return transparent ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.85);
}

/** Door on a transparent background (no padding), for compositing over a camera frame. */
export async function doorOverlay(door, cfg, width = 600) {
  const { el, TW, TH } = door(cfg, 'outside', { pad: 0 });
  return { url: await svgToJpeg(el, width, TW, TH, 0, true), ratio: TH / TW };
}

/**
 * Configured outside/inside views plus the selected model and variant door images (as shown in the
 * model and variant steps). Never throws: an enquiry must still go out if rendering fails.
 */
export async function doorImages(door, cfg, base = {}) {
  const out = {};
  const jobs = {
    outside: () => doorPng(door, cfg, 'outside'),
    inside: () => doorPng(door, cfg, 'inside'),
    model: () => doorPng(door, Object.assign({}, base, { model: cfg.model }), 'outside', 300),
    variant: () => doorPng(door, Object.assign({}, base, { model: cfg.model, variant: cfg.variant }), 'outside', 300),
  };
  await Promise.all(Object.entries(jobs).map(async ([k, f]) => { try { out[k] = await f(); } catch { /* skip this image */ } }));
  return out;
}

/**
 * Door split for the 3D view: `full` is the whole door image with the leaf cut out (frame, sidelights, overlight),
 * `leaf` is the leaf alone so it can swing. Rects are in mm, matching the constants in door.ts (frame 72, sidelight 420, overlight 460).
 */
export async function doorParts(door, cfg, width = 1400) {
  const { D } = await import('../data');
  const { el, TW, TH } = door(cfg, 'outside', { pad: 0 });
  const T = D.typeById[cfg.type], F = 72, l = T.l ? 420 : 0, r = T.r ? 420 : 0, ov = T.o ? 460 : 0;
  const x0 = l + (l ? F / 2 : F), x1 = TW - r - (r ? F / 2 : F), y0 = ov + (ov ? F / 2 : F), y1 = TH - 18;
  const height = Math.round((width * TH) / TW), k = width / TW;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const img = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(renderToStaticMarkup(React.cloneElement(el, { width, height }))));
  const full = document.createElement('canvas'); full.width = width; full.height = height;
  const fg = full.getContext('2d'); fg.drawImage(img, 0, 0, width, height);
  const lw = Math.round((x1 - x0) * k), lh = Math.round((y1 - y0) * k);
  const leaf = document.createElement('canvas'); leaf.width = lw; leaf.height = lh;
  leaf.getContext('2d').drawImage(img, x0 * k, y0 * k, lw, lh, 0, 0, lw, lh);
  fg.clearRect(x0 * k, y0 * k, lw, lh);
  return { full, leaf, TW, TH, rect: { x0, x1, y0, y1 }, hingeRight: cfg.opening[0] === 'R', outward: cfg.opening.endsWith('out') };
}
