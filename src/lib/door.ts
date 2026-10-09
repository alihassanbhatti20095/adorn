// @ts-nocheck
import { h, clamp } from './core';
let UID = 0;
export function texPattern(id, tex) {
  if (tex === 'fs') return h('pattern', { key: id, id, width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, h('circle', { cx: 2, cy: 2, r: .8, fill: 'rgba(255,255,255,.05)' }), h('circle', { cx: 6, cy: 6, r: .8, fill: 'rgba(0,0,0,.05)' }));
  if (tex === 'wood') { const k = []; for (let i = 0; i < 16; i++) k.push(h('rect', { key: i, x: i * 6.5 + ((i * 37) % 4), y: 0, width: i % 3 ? 1.6 : 3.2, height: 700, fill: i % 2 ? 'rgba(0,0,0,.17)' : 'rgba(255,255,255,.08)' })); return h('pattern', { key: id, id, width: 104, height: 700, patternUnits: 'userSpaceOnUse' }, k); }
  if (tex === 'concrete') { const k = []; for (let i = 0; i < 44; i++) k.push(h('circle', { key: i, cx: (i * 53) % 120, cy: (i * 97) % 120, r: 1.5 + (i % 3), fill: i % 2 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.12)' })); return h('pattern', { key: id, id, width: 120, height: 120, patternUnits: 'userSpaceOnUse' }, k); }
  if (tex === 'metal') return h('linearGradient', { key: id, id, x1: 0, y1: 0, x2: 1, y2: 1 }, h('stop', { offset: 0, stopColor: '#fff', stopOpacity: .25 }), h('stop', { offset: .5, stopColor: '#000', stopOpacity: .15 }), h('stop', { offset: 1, stopColor: '#fff', stopOpacity: .2 }));
  if (tex === 'rust') return h('radialGradient', { key: id, id, cx: .3, cy: .35, r: .75 }, h('stop', { offset: 0, stopColor: '#c46c30', stopOpacity: .65 }), h('stop', { offset: .6, stopColor: '#8a4b2a', stopOpacity: 0 }), h('stop', { offset: 1, stopColor: '#3a160a', stopOpacity: .5 }));
  if (tex === 'carbon') return h('pattern', { key: id, id, width: 10, height: 10, patternUnits: 'userSpaceOnUse' }, h('path', { d: 'M0 10L10 0', stroke: 'rgba(255,255,255,.08)', strokeWidth: 3 }), h('path', { d: 'M0 0L10 10', stroke: 'rgba(0,0,0,.3)', strokeWidth: 3 }));
  return null;
}
export function glassPattern(id, tex) {
  if (tex === 'clear' || tex === 'grey' || tex === 'bronze') {
    const c = tex === 'clear' ? ['#9fb3bb', '#dbe6ea', '#b1c3ca'] : tex === 'grey' ? ['#545c5f', '#8a9396', '#5f676a'] : ['#5f4a37', '#9a8068', '#6f5843'];
    return h('linearGradient', { key: id, id, x1: 0, y1: 0, x2: 1, y2: 1 }, h('stop', { offset: 0, stopColor: c[0] }), h('stop', { offset: .42, stopColor: c[1] }), h('stop', { offset: .43, stopColor: c[2] }), h('stop', { offset: 1, stopColor: c[0] }));
  }
  const base = { dots: '#dde4e7', squares: '#e3e9eb', lines: '#e3e9eb', satin: '#e4eaec', stripes: '#e7ecee' }[tex] || '#e4eaec';
  const k = [h('rect', { key: 'b', width: 40, height: 40, fill: base })];
  if (tex === 'dots') k.push(h('circle', { key: 1, cx: 10, cy: 10, r: 5, fill: 'rgba(255,255,255,.85)' }), h('circle', { key: 2, cx: 30, cy: 30, r: 5, fill: 'rgba(150,165,172,.45)' }));
  if (tex === 'squares') k.push(h('path', { key: 1, d: 'M0 0H40M0 20H40M0 0V40M20 0V40', stroke: 'rgba(150,165,172,.55)', strokeWidth: 2 }));
  if (tex === 'lines') k.push(h('path', { key: 1, d: 'M0 5H40M0 15H40M0 25H40M0 35H40', stroke: 'rgba(150,165,172,.55)', strokeWidth: 2 }));
  if (tex === 'satin') k.push(h('rect', { key: 1, width: 40, height: 20, fill: 'rgba(255,255,255,.22)' }));
  if (tex === 'stripes') k.push(h('rect', { key: 1, y: 20, width: 40, height: 20, fill: '#b7c8cf' }));
  return h('pattern', { key: id, id, width: 40, height: 40, patternUnits: 'userSpaceOnUse' }, k);
}

export function doorSVG(D, c, side, o) {
  o = o || {}; const u = 'dr' + (++UID) + '_';
  const sys = D.systemById[c.system] || D.SYSTEMS[0], T = D.typeById[c.type] || D.TYPES[0], M = D.modelByCode[c.model] || D.MODELS[0];
  const W = clamp(+c.width || sys.minW, sys.minW, sys.maxW), H = clamp(+c.height || sys.minH, sys.minH, sys.maxH);
  const SLW = 420, OLH = 460, F = 72;
  const l = T.l ? SLW : 0, r = T.r ? SLW : 0, ov = T.o ? OLH : 0, TW = W + l + r, TH = H + ov;
  const inside = side === 'inside';
  const leafC = D.colourById[inside ? c.colours.inside : c.colours.outside] || D.RECOMMENDED[0];
  const frameC = D.colourById[c.colours.frame] || D.RECOMMENDED[0];
  const gl = D.glassById[c.glass] || { tex: 'satin' };
  const defs = [], els = []; let k = 0; const K = () => 'e' + (k++);
  const R = (arr, x, y, w, hh, fill, extra) => arr.push(h('rect', Object.assign({ key: 'r' + arr.length, x, y, width: Math.max(0, w), height: Math.max(0, hh), fill }, extra || {})));
  const tex = (col, key) => { if (!col.tex) return null; const id = u + key; defs.push(texPattern(id, col.tex)); return `url(#${id})`; };
  const gid = u + 'g'; defs.push(glassPattern(gid, gl.tex)); const GF = `url(#${gid})`;
  const ss = u + 'ss'; defs.push(h('linearGradient', { key: ss, id: ss, x1: 0, y1: 0, x2: 1, y2: 0 }, h('stop', { offset: 0, stopColor: '#8d9195' }), h('stop', { offset: .45, stopColor: '#eceef0' }), h('stop', { offset: 1, stopColor: '#9a9ea1' })));

  R(els, 0, 0, TW, TH, frameC.hex); const ft = tex(frameC, 'f'); if (ft) R(els, 0, 0, TW, TH, ft);
  R(els, 0, 0, TW, TH, 'none', { stroke: 'rgba(0,0,0,.3)', strokeWidth: 4 });
  const pane = (x, y, w, hh) => { R(els, x, y, w, hh, GF); R(els, x, y, w, hh, 'none', { stroke: 'rgba(0,0,0,.45)', strokeWidth: 6 }); R(els, x + 7, y + 7, w - 14, hh - 14, 'none', { stroke: 'rgba(255,255,255,.2)', strokeWidth: 3 }); };
  const sTop = ov + (ov ? F / 2 : F);
  if (T.l) pane(F, sTop, l - 1.5 * F, TH - F - sTop);
  if (T.r) pane(l + W + F / 2, sTop, r - 1.5 * F, TH - F - sTop);
  if (T.o) { pane(F, F, TW - 2 * F, ov - 1.5 * F); if (c.overlight === 'tilt') els.push(h('path', { key: K(), d: `M${F + 10} ${ov - F / 2 - 10} L${TW / 2} ${F + 10} L${TW - F - 10} ${ov - F / 2 - 10}`, fill: 'none', stroke: 'rgba(0,0,0,.4)', strokeWidth: 4, strokeDasharray: '26 16' })); }

  const x0 = l + (l ? F / 2 : F), x1 = l + W - (r ? F / 2 : F), y0 = ov + (ov ? F / 2 : F), y1 = TH - 18;
  const lw = x1 - x0, lh = y1 - y0;
  const lockLeft = (c.opening || 'R')[0] === 'R';
  const Lf = [];
  R(Lf, 0, 0, lw, lh, leafC.hex); const lt = tex(leafC, 'l'); if (lt) R(Lf, 0, 0, lw, lh, lt);
  R(Lf, 0, 0, lw, lh, 'none', { stroke: 'rgba(0,0,0,.38)', strokeWidth: 5 });
  const showGrooves = !inside || c.panel === '2side', noGlass = c.variant === 'C';
  const P = [];
  const glassR = (x, y, w, hh) => { if (noGlass) { if (showGrooves) P.push(h('rect', { key: 'p' + P.length, x, y, width: w, height: hh, fill: 'none', stroke: 'rgba(0,0,0,.32)', strokeWidth: 6 })); return; } P.push(h('rect', { key: 'p' + P.length, x, y, width: w, height: hh, fill: GF })); P.push(h('rect', { key: 'p' + P.length, x, y, width: w, height: hh, fill: 'none', stroke: 'rgba(0,0,0,.5)', strokeWidth: 6 })); };
  const glassC = (cx, cy, rr) => { if (noGlass) { if (showGrooves) P.push(h('circle', { key: 'p' + P.length, cx, cy, r: rr, fill: 'none', stroke: 'rgba(0,0,0,.32)', strokeWidth: 6 })); return; } P.push(h('circle', { key: 'p' + P.length, cx, cy, r: rr, fill: GF, stroke: 'rgba(0,0,0,.5)', strokeWidth: 6 })); };
  const groove = (a, b, c2, d) => { if (!showGrooves) return; P.push(h('line', { key: 'p' + P.length, x1: a, y1: b, x2: c2, y2: d, stroke: 'rgba(0,0,0,.34)', strokeWidth: 6 })); P.push(h('line', { key: 'p' + P.length, x1: a + 4, y1: b + 4, x2: c2 + 4, y2: d + 4, stroke: 'rgba(255,255,255,.13)', strokeWidth: 3 })); };
  const w = lw, hh = lh;
  switch (M.pattern) {
    case 'stripV': glassR(w * .6, hh * .08, w * .13, hh * .84); break;
    case 'slots': [.22, .34, .46, .58, .7].forEach(f => glassR(w * .38, hh * f, w * .44, hh * .035)); break;
    case 'window': glassR(w * .2, hh * .1, w * .6, hh * .48); groove(w * .2, hh * .68, w * .8, hh * .68); break;
    case 'grooveDiag': for (let i = 0; i < 5; i++) groove(w * .1, hh * (.28 + i * .12), w * .9, hh * (.12 + i * .12)); break;
    case 'porthole': glassC(w * .55, hh * .28, w * .2); groove(w * .55, hh * .42, w * .55, hh * .9); break;
    case 'grooveV': [.3, .52, .74].forEach(f => groove(w * f, hh * .08, w * f, hh * .92)); glassR(w * .4, hh * .08, w * .06, hh * .84); break;
    case 'steps': [0, 1, 2].forEach(i => glassR(w * (.24 + i * .2), hh * (.18 + i * .2), w * .16, w * .16)); break;
    case 'solidH': for (let i = 0; i < 7; i++) groove(w * .14, hh * (.15 + i * .1), w * .86, hh * (.15 + i * .1)); break;
    case 'stripL': glassR(w * .7, hh * .08, w * .08, hh * .8); glassR(w * .25, hh * .08, w * .53, w * .08); break;
    case 'grid': for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) glassR(w * (.34 + j * .24), hh * (.18 + i * .16), w * .16, hh * .1); break;
    case 'stripCentre': glassR(w * .46, hh * .06, w * .12, hh * .88); break;
    case 'grooveFrame': groove(w * .18, hh * .08, w * .86, hh * .08); groove(w * .86, hh * .08, w * .86, hh * .92); groove(w * .86, hh * .92, w * .18, hh * .92); groove(w * .18, hh * .92, w * .18, hh * .08); groove(w * .18, hh * .5, w * .86, hh * .5); break;
  }
  const mirror = (c.variant === 'B') !== !lockLeft;
  Lf.push(h('g', { key: 'pat', transform: mirror ? `translate(${lw} 0) scale(-1 1)` : undefined }, P));
  if (inside && c.panel === '1side') R(Lf, 46, 46, lw - 92, lh - 92, 'none', { stroke: 'rgba(0,0,0,.16)', strokeWidth: 4 });

  const hd = D.handleById[c.handle], lock = D.lockById[c.lock] || {};
  const black = '#1c1c1d';
  const hcol = c.handleColour ? ((D.ralByCode[c.handleRal] || {}).hex || '#0E0E10') : (hd && hd.fam.black ? black : `url(#${ss})`);
  if (hd && (!inside || c.insideHandle === 'pull')) {
    const bw = hd.fam.w, rx = hd.fam.profile === 'round' ? bw / 2 : 3;
    if (hd.horizontal) {
      const len = 750, bx = lockLeft ? 90 : lw - 90 - len, by = lh - 1050 - bw / 2;
      R(Lf, bx + 10, by + 10, len, bw, 'rgba(0,0,0,.22)', { rx }); R(Lf, bx, by, len, bw, hcol, { rx });
    } else {
      const len = Math.min(hd.len, lh - 260), cy = len > 900 ? lh / 2 : lh - 1050, by = clamp(cy - len / 2, 130, lh - 130 - len), bx = lockLeft ? 110 : lw - 110 - bw;
      R(Lf, bx + 10, by + 10, bw, len, 'rgba(0,0,0,.22)', { rx }); R(Lf, bx, by, bw, len, hcol, { rx });
      R(Lf, bx + bw * .2, by, bw * .14, len, 'rgba(255,255,255,.18)');
      if (hd.fam.fin) R(Lf, lockLeft ? bx + bw : bx - 12, by + len * .08, 12, len * .84, hcol);
      if (!inside && (hd.fam.fin || lock.device === 'fph')) R(Lf, bx + bw * .15, by + len * .32, bw * .7, 64, '#0d0e0f', { rx: 6 });
    }
  } else if (inside) {
    const ry = lh - 1050, rx0 = lockLeft ? 70 : lw - 120, lc = c.insideHandle === 'lever-blk' ? black : `url(#${ss})`;
    R(Lf, rx0, ry - 55, 50, 110, lc, { rx: 6 });
    R(Lf, lockLeft ? rx0 + 25 : rx0 + 25 - 160, ry - 12, 160, 24, lc, { rx: 12 });
  }
  const FIN = { B: '#b9bcbf', P: '#e3e5e7', C: '#1d1d1e' };
  const frameDev = [];
  const xc = lockLeft ? x0 - F / 2 : x1 + F / 2;
  if (!inside) {
    (c.accessories || []).forEach(code => {
      const fc = FIN[code[2]] || FIN.B, tc = code[2] === 'C' ? '#e3e5e7' : '#2b2d2f';
      if (code.startsWith('JZ')) { const xl = code.includes('10'), pw = xl ? 300 : 200, ph = xl ? 150 : 110, px = lockLeft ? lw - pw - 90 : 90; R(Lf, px, 170, pw, ph, fc, { rx: 4 }); Lf.push(h('text', { key: 'tx' + code, x: px + pw / 2, y: 170 + ph * .74, textAnchor: 'middle', fontSize: ph * .62, fontFamily: 'Roboto, sans-serif', fontWeight: 500, fill: tc }, '12')); }
      if (code.startsWith('PZ')) { const pw = 360, ph = 80, px = lw / 2 - pw / 2, py = lh - 760; R(Lf, px, py, pw, ph, fc, { rx: 4 }); R(Lf, px + 34, py + 28, pw - 68, 24, 'rgba(0,0,0,.55)', { rx: 3 }); if (code.includes('LOGO')) Lf.push(h('text', { key: 'lg' + code, x: px + 18, y: py + 52, textAnchor: 'middle', fontSize: 30, fontFamily: 'Georgia, serif', fill: tc }, 'A')); }
      if (code.startsWith('OZ')) { Lf.push(h('circle', { key: 'oz' + code, cx: lw / 2, cy: lh - 1550, r: 17, fill: fc })); Lf.push(h('circle', { key: 'oz2' + code, cx: lw / 2, cy: lh - 1550, r: 7, fill: '#222' })); }
      if (code.startsWith('KZ')) { frameDev.push(h('circle', { key: 'kz' + code, cx: xc, cy: TH - 1380, r: 22, fill: fc, stroke: 'rgba(0,0,0,.3)', strokeWidth: 2 })); }
    });
    const dv = lock.device;
    if (dv === 'fp' || dv === 'fpb') { R(frameDev, xc - 22, TH - 1260, 44, 84, dv === 'fpb' ? '#151515' : '#c9ccce', { rx: 5 }); R(frameDev, xc - 11, TH - 1240, 22, 30, dv === 'fpb' ? '#333' : '#3a3d40', { rx: 8 }); }
    if (dv === 'pad' || dv === 'padw') { R(frameDev, xc - 28, TH - 1300, 56, 110, dv === 'padw' ? '#f2f2f0' : '#141414', { rx: 4, stroke: 'rgba(0,0,0,.3)', strokeWidth: 2 }); for (let i = 0; i < 9; i++) frameDev.push(h('circle', { key: 'kd' + i, cx: xc - 14 + (i % 3) * 14, cy: TH - 1280 + Math.floor(i / 3) * 16, r: 3.5, fill: dv === 'padw' ? '#888' : '#777' })); }
  }
  els.push(h('g', { key: 'leaf', transform: `translate(${x0} ${y0})` }, Lf));
  frameDev.forEach(e => els.push(e));
  const pad = o.pad == null ? 60 : o.pad;
  const body = inside ? h('g', { transform: `translate(${TW} 0) scale(-1 1)` }, els) : h('g', null, els);
  const el = h('svg', {
    xmlns: 'http://www.w3.org/2000/svg', viewBox: `${-pad} ${-pad} ${TW + 2 * pad} ${TH + pad}`, width: o.w, height: o.h, preserveAspectRatio: 'xMidYMax meet', role: 'img', 'aria-label': `${c.model} ${c.variant}, ${side} view`,
    style: o.style || { height: '100%', width: 'auto', maxWidth: '100%', display: 'block' }
  }, h('defs', null, defs), body);
  return { el, TW, TH };
}
export function typeThumb(T) {
  const dw = 34, dh = 60, sw = 16, oh = 16, tw = dw + (T.l ? sw : 0) + (T.r ? sw : 0), th = dh + (T.o ? oh : 0), ox = (120 - tw) / 2, oy = (90 - th) / 2, top = oy + (T.o ? oh : 0), k = [];
  k.push(h('rect', { key: 'f', x: ox, y: oy, width: tw, height: th, fill: '#fff', stroke: '#5A5D60', strokeWidth: 2 }));
  let x = ox; if (T.l) { k.push(h('rect', { key: 'l', x: x + 3, y: top + 3, width: sw - 6, height: dh - 6, fill: '#CFE0E6' })); x += sw; }
  k.push(h('rect', { key: 'd', x: x + 3, y: top + 3, width: dw - 6, height: dh - 3, fill: '#6F7275' }));
  k.push(h('rect', { key: 'hd', x: x + 8, y: top + dh * .35, width: 2.5, height: 16, fill: '#E9EAEB' }));
  x += dw; if (T.r) k.push(h('rect', { key: 'r', x: x + 3, y: top + 3, width: sw - 6, height: dh - 6, fill: '#CFE0E6' }));
  if (T.o) k.push(h('rect', { key: 'o', x: ox + 3, y: oy + 3, width: tw - 6, height: oh - 6, fill: '#CFE0E6' }));
  return h('svg', { viewBox: '0 0 120 90', width: '100%', height: '100%', 'aria-hidden': true }, k);
}
export function openIcon(id) {
  const R = id[0] === 'R', inn = id.includes('in'), hx = R ? 34 : 6, ox = R ? 6 : 34, ey = inn ? -4 : 44, sweep = (R === inn) ? 0 : 1;
  return h('svg', { viewBox: '0 -8 40 56', width: '100%', height: '100%', 'aria-hidden': true, fill: 'none', stroke: 'currentColor' },
    h('path', { d: 'M0 20H6M34 20H40', strokeWidth: 4 }), h('path', { d: `M${hx} 20V${ey}`, strokeWidth: 3 }), h('path', { d: `M${hx} ${ey}A28 28 0 0 ${sweep} ${ox} 20`, strokeWidth: 1.5, strokeDasharray: '3 3' }),
    h('text', { x: 20, y: inn ? 46 : -1, fontSize: 7, textAnchor: 'middle', fill: 'currentColor', stroke: 'none', fontFamily: 'Roboto, sans-serif' }, inn ? 'outside' : 'inside'));
}
