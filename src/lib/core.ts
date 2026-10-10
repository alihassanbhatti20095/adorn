// @ts-nocheck
import React from 'react';
export const G = '#B8925A', GH = '#A68049', GT = '#F2E8D8', TX = '#2B2D2F', DV = '#E4E5E6', ERR = '#C0392B';
export const h = React.createElement;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const STEPS = [['reset', 'Reset to default', 'reset'], ['search', 'Search', 'search'], ['type', 'Type', 'type'], ['model', 'Door model', 'door'], ['variants', 'Model variants', 'layers'], ['systems', 'Systems', 'frame'], ['construction', 'Construction', 'ruler'], ['colours', 'Colours', 'palette'], ['glass', 'Glass', 'glass'], ['handles', 'Door handles and parts', 'handle'], ['accessories', 'Accessories', 'bell'], ['locks', 'Locks', 'lock'], ['house', 'Insert door into the house', 'house'], ['print', 'Print / Enquiry', 'printer'], ['save', 'Save / load', 'save']].map(([id, label, icon]) => ({ id, label, icon }));
export const LANGS = [['en', 'English'], ['hr', 'Hrvatski'], ['de', 'Deutsch'], ['sl', 'Slovenščina'], ['fr', 'Français'], ['it', 'Italiano'], ['hu', 'Magyar']].map(([id, label]) => ({ id, label }));
export const PANELS = { '1side': '1-side facing on the outside', '2side': '2-sided overlay panel inside and outside' };
export const OPEN = { 'R-in': 'Right - inside', 'R-out': 'Right - outside', 'L-in': 'Left - inside', 'L-out': 'Left - outside' };
export const VAR_DESC = { A: 'Original design, glazing as drawn', B: 'Mirrored design', C: 'Solid leaf — grooves only, no glazing' };
export const ICONS = {
  reset: [['p', 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8'], ['p', 'M3 3v5h5']],
  search: [['c', 11, 11, 8], ['p', 'm21 21-4.3-4.3']],
  type: [['r', 3, 3, 18, 18, 2], ['p', 'M9 3v18'], ['p', 'M15 3v18']],
  door: [['p', 'M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14'], ['p', 'M2 20h20'], ['p', 'M14 12v.01']],
  layers: [['p', 'm12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z'], ['p', 'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65'], ['p', 'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65']],
  frame: [['p', 'M22 6H2'], ['p', 'M22 18H2'], ['p', 'M6 2v20'], ['p', 'M18 2v20']],
  ruler: [['p', 'M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z'], ['p', 'm14.5 12.5 2-2'], ['p', 'm11.5 9.5 2-2'], ['p', 'm8.5 6.5 2-2'], ['p', 'm17.5 15.5 2-2']],
  palette: [['p', 'M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z'], ['c', 13.5, 6.5, 0.8], ['c', 17.5, 10.5, 0.8], ['c', 6.5, 12.5, 0.8], ['c', 8.5, 7.5, 0.8]],
  glass: [['r', 3, 3, 18, 18, 2], ['p', 'M7 14l7-7'], ['p', 'M10 17l7-7']],
  handle: [['r', 10, 2, 4, 20, 2], ['p', 'M6 6h4'], ['p', 'M6 18h4']],
  bell: [['p', 'M10.268 21a2 2 0 0 0 3.464 0'], ['p', 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326']],
  lock: [['r', 3, 11, 18, 11, 2], ['p', 'M7 11V7a5 5 0 0 1 10 0v4']],
  house: [['p', 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'], ['p', 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z']],
  printer: [['p', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'], ['p', 'M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6'], ['r', 6, 14, 12, 8, 1]],
  save: [['p', 'M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z'], ['p', 'M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7'], ['p', 'M7 3v4a1 1 0 0 0 1 1h7']],
  arrowLeft: [['p', 'm12 19-7-7 7-7'], ['p', 'M19 12H5']],
  x: [['p', 'M18 6 6 18'], ['p', 'm6 6 12 12']],
  chevL: [['p', 'm15 18-6-6 6-6']], chevR: [['p', 'm9 18 6-6-6-6']], chevD: [['p', 'm6 9 6 6 6-6']],
  plus: [['p', 'M5 12h14'], ['p', 'M12 5v14']], minus: [['p', 'M5 12h14']],
  zoomIn: [['c', 11, 11, 8], ['p', 'm21 21-4.35-4.35'], ['p', 'M11 8v6'], ['p', 'M8 11h6']],
  zoomOut: [['c', 11, 11, 8], ['p', 'm21 21-4.35-4.35'], ['p', 'M8 11h6']],
  max: [['p', 'M8 3H5a2 2 0 0 0-2 2v3'], ['p', 'M21 8V5a2 2 0 0 0-2-2h-3'], ['p', 'M3 16v3a2 2 0 0 0 2 2h3'], ['p', 'M16 21h3a2 2 0 0 0 2-2v-3']],
  check: [['p', 'M20 6 9 17l-5-5']],
  menu: [['p', 'M4 6h16'], ['p', 'M4 12h16'], ['p', 'M4 18h16']],
  upload: [['p', 'M12 3v12'], ['p', 'm17 8-5-5-5 5'], ['p', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4']],
  download: [['p', 'M12 15V3'], ['p', 'm7 10 5 5 5-5'], ['p', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4']],
  copy: [['r', 8, 8, 14, 14, 2], ['p', 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2']],
  image: [['r', 3, 3, 18, 18, 2], ['c', 9, 9, 2], ['p', 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21']]
};
export function icon(n, s, sw) {
  return h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false' },
    ICONS[n].map((e, i) => e[0] === 'p' ? h('path', { key: i, d: e[1] }) : e[0] === 'c' ? h('circle', { key: i, cx: e[1], cy: e[2], r: e[3] }) : h('rect', { key: i, x: e[1], y: e[2], width: e[3], height: e[4], rx: e[5] || 0 })));
}
export const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const dec = s => { s = String(s).trim().replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); };
export function solve(A, b) { const n = b.length; for (let i = 0; i < n; i++) { let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]]; for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; for (let k = i; k < n; k++) A[r][k] -= f * A[i][k]; b[r] -= f * b[i]; } } const x = new Array(n); for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let k = i + 1; k < n; k++) s -= A[i][k] * x[k]; x[i] = s / A[i][i]; } return x; }
export function homog(src, dst) { const A = [], b = []; for (let i = 0; i < 4; i++) { const [x, y] = src[i], [u, v] = dst[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); } return [...solve(A, b), 1]; }
export const mat3d = H => `matrix3d(${H[0]},${H[3]},0,${H[6]},${H[1]},${H[4]},0,${H[7]},0,0,1,0,${H[2]},${H[5]},0,${H[8]})`;
export const applyH = (H, x, y) => { const w = H[6] * x + H[7] * y + H[8]; return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w]; };
export const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
export function drawTri(ctx, img, s, d) {
  const [[x0, y0], [x1, y1], [x2, y2]] = s, [[u0, v0], [u1, v1], [u2, v2]] = d;
  const cx = (u0 + u1 + u2) / 3, cy = (v0 + v1 + v2) / 3, e = p => [cx + (p[0] - cx) * 1.03, cy + (p[1] - cy) * 1.03];
  ctx.save(); ctx.beginPath(); const a = e(d[0]), b = e(d[1]), c = e(d[2]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath(); ctx.clip();
  const det = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
  const i00 = (y2 - y0) / det, i01 = -(x2 - x0) / det, i10 = -(y1 - y0) / det, i11 = (x1 - x0) / det;
  const m00 = (u1 - u0) * i00 + (u2 - u0) * i10, m01 = (u1 - u0) * i01 + (u2 - u0) * i11, m10 = (v1 - v0) * i00 + (v2 - v0) * i10, m11 = (v1 - v0) * i01 + (v2 - v0) * i11;
  ctx.setTransform(m00, m10, m01, m11, u0 - m00 * x0 - m01 * y0, v0 - m10 * x0 - m11 * y0); ctx.drawImage(img, 0, 0); ctx.restore();
}
// POST the enquiry to the backend (server/). Same-origin /api/enquiry by default; override with window.ADORN_API_ENDPOINT.
// Throws an Error with .status and (for validation failures) .fields so the UI can show the server's messages.
export function postEnquiry(payload) {
  const url = (window as any).ADORN_API_ENDPOINT || '/api/enquiry';
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(async (r) => {
    if (r.ok) return;
    let body = {};
    try { body = await r.json(); } catch { /* non-JSON error page */ }
    throw Object.assign(new Error(body.error || 'Request failed'), { status: r.status, fields: body.fields });
  });
}
