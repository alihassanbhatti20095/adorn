// @ts-nocheck
import { create } from 'zustand';
import { D } from './data';
import { STEPS, PANELS, OPEN, clamp, enc, dec, loadImg, homog, applyH, drawTri, postEnquiry } from './lib/core';
import { doorSVG } from './lib/door';

const LS = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
};

/* ---------- config normalisation + dependency rules ---------- */
export function normalize(c) {
  const d = D.DEFAULT;
  c = Object.assign({}, d, c || {});
  c.colours = Object.assign({}, d.colours, c.colours || {});
  if (!D.modelByCode[c.model]) c.model = d.model;
  const r = D.RULES.models[c.model];
  if (!r.variants.includes(c.variant)) c.variant = r.variants[0];
  if (!r.types.includes(c.type)) c.type = r.types[0];
  if (!r.systems.includes(c.system)) c.system = r.systems[0];
  ['outside', 'inside', 'frame'].forEach((k) => { if (!D.colourById[c.colours[k]]) c.colours[k] = d.colours[k]; });
  if (!D.glassById[c.glass]) c.glass = d.glass;
  if (!D.handleById[c.handle]) c.handle = d.handle;
  if (!D.lockById[c.lock]) c.lock = d.lock;
  if (!D.insideById[c.insideHandle]) c.insideHandle = d.insideHandle;
  if (!D.ralByCode[c.handleRal]) c.handleRal = '9005';
  c.accessories = Array.isArray(c.accessories) ? c.accessories.filter((a) => D.ACCESSORIES.some((x) => x.code === a)) : [];
  if (!PANELS[c.panel]) c.panel = d.panel;
  if (!['fixed', 'tilt'].includes(c.overlight)) c.overlight = 'fixed';
  if (!OPEN[c.opening]) c.opening = d.opening;
  c.handleColour = !!c.handleColour;
  return c;
}

export function hashStep() {
  const m = location.hash.match(/^#\/([\w-]+)/);
  return m && STEPS.find((s) => s.id === m[1]) ? m[1] : null;
}

export function shareUrl(code) { return location.origin + location.pathname + '?config=' + code; }

/** Short share code: only what differs from the default door, so links stay compact. Old full codes still load. */
export function shareCode(c) {
  const d = D.DEFAULT, o = {};
  for (const k of Object.keys(c)) {
    if (k === 'colours') {
      const cc = {};
      for (const j of Object.keys(c.colours)) if (c.colours[j] !== d.colours[j]) cc[j] = c.colours[j];
      if (Object.keys(cc).length) o.colours = cc;
    } else if (JSON.stringify(c[k]) !== JSON.stringify(d[k])) o[k] = c[k];
  }
  return enc(o);
}

const buzz = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch { /* unsupported */ } };
const HIST_MAX = 60;
let lastPush = 0, lastKeys = '';

/* ---------- door render cache ---------- */
const cache = new Map();
export function door(c, side, o) {
  const key = side + JSON.stringify(c) + JSON.stringify(o || {});
  if (cache.has(key)) return cache.get(key);
  if (cache.size > 400) cache.clear();
  const r = doorSVG(D, c, side, o);
  cache.set(key, r);
  return r;
}
export const thumb = (code, extra) => door(Object.assign({}, D.DEFAULT, { model: code }, extra || {}), 'outside', { pad: 50 }).el;

export function dims(c) {
  const sys = D.systemById[c.system], T = D.typeById[c.type];
  const W = clamp(+c.width || sys.minW, sys.minW, sys.maxW), H = clamp(+c.height || sys.minH, sys.minH, sys.maxH);
  return { W, H, OW: W + (T.l ? 420 : 0) + (T.r ? 420 : 0), OH: H + (T.o ? 460 : 0) };
}

/* ---------- initial state ---------- */
const fromShare = typeof location !== 'undefined' && !!new URLSearchParams(location.search).get('config');
function initialCfg() {
  let cfg = D.DEFAULT;
  try {
    const q = new URLSearchParams(location.search).get('config');
    if (q) cfg = dec(q);
    else { const s = LS.get('adorn.cfg'); if (s) cfg = JSON.parse(s); }
  } catch { /* fall back to default */ }
  return normalize(cfg);
}
function initialCookie() { try { return JSON.parse(LS.get('adorn.cookies')); } catch { return null; } }

export function viewport() {
  if (typeof window === 'undefined') return { isMobile: false, isLand: false, isShort: false };
  const w = window.innerWidth, h = window.innerHeight, isLand = h < 500 && w > h;
  return { isLand, isMobile: w < 900 || isLand, isShort: h < 680 };
}

let pt, tt;
let dragState = null;

export const useStore = create((set, get) => ({
  cfg: initialCfg(), past: [], future: [], fromShare, night: false, doorOpen: false, arOpen: false, scene3d: { wall: 'brick', roof: 'slate' }, h3: null, visited: {}, pan: { x: 0, y: 0 },
  step: hashStep() || 'model', panelOpen: !(fromShare && viewport().isMobile), sheetTall: false, modelFilter: 'all', view: 'outside', zoom: 1,
  colourTab: 'outside', ralQ: '', searchQ: '', sysOpen: {}, acc: { handles: true, inside: false }, lockOpen: {},
  modal: null, refCode: '', loadInput: '', loadError: '', toast: '',
  enq: { name: '', email: '', phone: '', postcode: '', message: '', showroom: 'No preference', consent: false, website: '' }, enqErr: {}, enqStatus: 'idle', enqMsg: '',
  cookie: initialCookie(), ckA: false, ckM: false, lang: LS.get('adorn.lang') || 'en',
  rendering: false, house: null, ...viewport(),
  stageW: 900, stageH: 700, printing: false, dropHover: false, stageEl: null, ovEl: null, fileEl: null,

  patch: (p) => set(p),

  pulse: () => { clearTimeout(pt); set({ rendering: true }); pt = setTimeout(() => set({ rendering: false }), 420); },

  // Every config change goes through commit so undo/redo sees it. Rapid edits of the same field (a width slider) collapse into one undo step.
  commit: (cfg, key) => {
    const s = get();
    if (JSON.stringify(cfg) === JSON.stringify(s.cfg)) return;
    const now = Date.now(), merge = key && key === lastKeys && now - lastPush < 700 && s.past.length;
    lastPush = now; lastKeys = key || '';
    LS.set('adorn.cfg', JSON.stringify(cfg));
    set({ cfg, past: merge ? s.past : [...s.past, s.cfg].slice(-HIST_MAX), future: [], refCode: '' });
  },

  setCfg: (patch) => {
    const s = get();
    const cfg = normalize(Object.assign({}, s.cfg, patch));
    if (cfg.system !== s.cfg.system) {
      const sy = D.systemById[cfg.system];
      cfg.width = clamp(+cfg.width || sy.minW, sy.minW, sy.maxW);
      cfg.height = clamp(+cfg.height || sy.minH, sy.minH, sy.maxH);
    }
    get().commit(cfg, Object.keys(patch).join());
    buzz();
    get().pulse();
  },

  undo: () => {
    const s = get();
    if (!s.past.length) return;
    lastKeys = '';
    LS.set('adorn.cfg', JSON.stringify(s.past[s.past.length - 1]));
    set({ cfg: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.cfg, ...s.future], refCode: '' });
    buzz(12); get().pulse();
  },
  redo: () => {
    const s = get();
    if (!s.future.length) return;
    lastKeys = '';
    LS.set('adorn.cfg', JSON.stringify(s.future[0]));
    set({ cfg: s.future[0], future: s.future.slice(1), past: [...s.past, s.cfg].slice(-HIST_MAX), refCode: '' });
    buzz(12); get().pulse();
  },

  go: (id, quiet) => {
    set((s) => ({ step: id, panelOpen: true, visited: { ...s.visited, [s.step]: true, [id]: true }, modal: id === 'reset' && !quiet ? 'reset' : s.modal }));
    try { history.replaceState(null, '', location.pathname + location.search + '#/' + id); } catch { /* ignore */ }
  },

  showToast: (msg) => { clearTimeout(tt); set({ toast: msg }); tt = setTimeout(() => set({ toast: '' }), 2600); },
  closeModal: () => set((s) => ({ modal: null, enqStatus: s.enqStatus === 'sent' ? 'idle' : s.enqStatus })),

  confirmReset: () => {
    get().commit(normalize(D.DEFAULT), 'reset');
    set({ modal: null, refCode: '', view: 'outside', zoom: 1, pan: { x: 0, y: 0 }, doorOpen: false });
    get().pulse(); get().showToast('Configuration reset');
  },

  setLang: (lg) => {
    set({ lang: lg }); LS.set('adorn.lang', lg); document.documentElement.lang = lg;
    if (lg !== 'en') get().showToast('Only English strings are available in this preview');
  },

  saveCookie: (an, mk) => {
    const ck = { necessary: true, analytics: an, marketing: mk, date: new Date().toISOString() };
    LS.set('adorn.cookies', JSON.stringify(ck)); set({ cookie: ck, modal: null });
  },

  copy: (text, msg) => {
    const fail = () => get().showToast('Select the code and press Ctrl+C');
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => get().showToast(msg), fail); else fail();
  },

  loadCode: () => {
    const s = get();
    try {
      const o = dec(s.loadInput);
      if (!o || typeof o !== 'object' || Array.isArray(o) || (o.model && !D.modelByCode[o.model])) throw new Error('bad');
      get().commit(normalize(o), 'load');
      set({ loadError: '', loadInput: '' }); get().pulse(); get().showToast('Configuration loaded');
    } catch { set({ loadError: 'Code not found' }); }
  },

  submitEnq: () => {
    const q = get().enq, err = {};
    if (!q.name.trim()) err.name = 'Please enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.email.trim())) err.email = 'Please enter a valid email address';
    if (q.phone.trim() && !/^[+\d][\d\s()-]{6,}$/.test(q.phone.trim())) err.phone = 'Please enter a valid phone number';
    if (!q.postcode.trim()) err.postcode = 'Please enter your postcode';
    if (!q.consent) err.consent = 'Please accept to continue';
    set({ enqErr: err });
    if (Object.keys(err).length) return;
    set({ enqStatus: 'sending', enqMsg: '' });
    const cfg = get().cfg;
    Promise.all([import('./steps/Tools'), import('./lib/render')])
      .then(async ([{ summary }, { doorImages }]) => postEnquiry(Object.assign({}, q, { config: cfg, reference: enc(cfg), summary: summary(cfg).map((r) => ({ label: r.label, value: r.value })), images: await doorImages(door, cfg, D.DEFAULT) })))
      .then(() => set((s) => ({ enqStatus: 'sent', enq: Object.assign({}, s.enq, { message: '' }) })))
      .catch((e) => set({ enqStatus: 'error', enqErr: (e && e.fields) || {}, enqMsg: e && (e.status === 502 || (e.status >= 400 && e.status < 500)) ? e.message : '' }));
  },

  doPrint: () => {
    set({ printing: true, refCode: enc(get().cfg) });
    setTimeout(() => window.print(), 350);
  },

  /* ----- house photo editor ----- */
  houseBox: (hs) => {
    const s = get(), aw = Math.max(100, s.stageW - 48), ah = Math.max(100, s.stageH - 48), k = Math.min(aw / hs.iw, ah / hs.ih), w = hs.iw * k, hh = hs.ih * k;
    return { x: (s.stageW - w) / 2, y: (s.stageH - hh) / 2, w, h: hh };
  },
  defaultCorners: (hs) => {
    const box = get().houseBox(hs), { TW, TH } = door(get().cfg, 'outside', { pad: 0 });
    const dh = box.h * 0.5, dw = (dh * TW) / TH, cx = box.w / 2, by = box.h * 0.92;
    const a = (cx - dw / 2) / box.w, b = (cx + dw / 2) / box.w, t = (by - dh) / box.h, bt = by / box.h;
    return [[a, t], [b, t], [b, bt], [a, bt]];
  },
  loadFile: (file) => {
    if (!file || !/^image\//.test(file.type)) return get().showToast('Please choose a JPG or PNG image');
    const rd = new FileReader();
    rd.onload = () => loadImg(rd.result).then((img) => {
      const hs = { src: rd.result, iw: img.naturalWidth, ih: img.naturalHeight, scale: 1, bright: 1 };
      hs.corners = get().defaultCorners(hs); set({ house: hs });
    });
    rd.readAsDataURL(file);
  },
  startDrag: (d) => { dragState = d; },
  endDrag: () => { dragState = null; },
  dragMove: (e) => {
    const s = get();
    if (!dragState || !s.house) return;
    const d = dragState, hs = s.house, box = get().houseBox(hs), dx = (e.clientX - d.x) / box.w, dy = (e.clientY - d.y) / box.h;
    set({ house: Object.assign({}, hs, { corners: d.orig.map((p, i) => (d.i === -1 || d.i === i ? [p[0] + dx, p[1] + dy] : p)) }) });
  },
  saveImage: async () => {
    const s = get(), hs = s.house;
    if (!hs || !s.ovEl) return;
    const svg = s.ovEl.querySelector('svg');
    if (!svg) return;
    const { TW, TH } = door(s.cfg, 'outside', { pad: 0 }), sw = 1200, sh = Math.round((1200 * TH) / TW);
    const cl = svg.cloneNode(true);
    cl.setAttribute('width', sw); cl.setAttribute('height', sh); cl.removeAttribute('style');
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(cl));
    try {
      const [photo, doorImg] = await Promise.all([loadImg(hs.src), loadImg(url)]);
      const cv = document.createElement('canvas'); cv.width = hs.iw; cv.height = hs.ih;
      const ctx = cv.getContext('2d'); ctx.drawImage(photo, 0, 0);
      const H = homog([[0, 0], [sw, 0], [sw, sh], [0, sh]], hs.corners.map((p) => [p[0] * hs.iw, p[1] * hs.ih]));
      ctx.filter = `brightness(${hs.bright})`;
      const N = 18;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const s00 = [(i * sw) / N, (j * sh) / N], s10 = [((i + 1) * sw) / N, (j * sh) / N], s01 = [(i * sw) / N, ((j + 1) * sh) / N], s11 = [((i + 1) * sw) / N, ((j + 1) * sh) / N];
        const m = (p) => applyH(H, p[0], p[1]);
        drawTri(ctx, doorImg, [s00, s10, s11], [m(s00), m(s10), m(s11)]);
        drawTri(ctx, doorImg, [s00, s11, s01], [m(s00), m(s11), m(s01)]);
      }
      ctx.filter = 'none';
      cv.toBlob((b) => {
        const a = document.createElement('a'); a.href = URL.createObjectURL(b);
        a.download = `adorn-${s.cfg.model.replace(/\s+/g, '-')}-house.png`; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000); get().showToast('Image saved');
      }, 'image/png');
    } catch { get().showToast('Could not export the image'); }
  },
}));
