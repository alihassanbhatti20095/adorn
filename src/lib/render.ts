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

/** Both views; never throws: an enquiry must still go out if rendering fails. */
export async function doorImages(door, cfg) {
  try {
    const [outside, inside] = await Promise.all([doorPng(door, cfg, 'outside'), doorPng(door, cfg, 'inside')]);
    return { outside, inside };
  } catch {
    return {};
  }
}
