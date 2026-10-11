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

async function svgToJpeg(el, width, TW, TH, PAD) {
  const height = Math.round((width * (TH + PAD)) / (TW + 2 * PAD));
  const { renderToStaticMarkup } = await import('react-dom/server');
  const svg = renderToStaticMarkup(React.cloneElement(el, { width, height }));
  const img = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  const cv = document.createElement('canvas');
  cv.width = width; cv.height = height;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#F4F4F3'; ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return cv.toDataURL('image/jpeg', 0.85);
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
