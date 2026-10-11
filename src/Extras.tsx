// @ts-nocheck
// Share sheet, camera "see it in your space" view, style finder and house-photo colour match.
import React, { useEffect, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import { D } from './data';
import { loadImg } from './lib/core';
import { useStore, door, thumb, shareCode, shareUrl } from './store';
import { Ic, Badge, cardBtn, H2, muted, goldBtn, greyBtn, G, TX, DV } from './ui';

/* ------------------------------------------------------------------ Share sheet */
const sheetOverlay = { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(43,45,47,.55)', display: 'flex', overscrollBehavior: 'contain' };

export function ShareModal() {
  const { cfg, isMobile, closeModal, copy, showToast } = useStore();
  const [qr, setQr] = useState(false);
  const [busy, setBusy] = useState(false);
  const code = shareCode(cfg), url = shareUrl(code), name = `${cfg.model} ${cfg.variant}`;
  const text = `My Adorn door: ${name}`;
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  let qrSvg = '';
  if (qr) { try { const q = qrcode(0, 'M'); q.addData(url); q.make(); qrSvg = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch { /* too long */ } }

  // Native share sheet with a picture of the door attached when the browser supports sharing files.
  const nativeShare = async () => {
    setBusy(true);
    try {
      let files;
      try {
        const { doorPng } = await import('./lib/render');
        const blob = await (await fetch(await doorPng(door, cfg, 'outside', 800))).blob();
        const f = new File([blob], `adorn-${cfg.model.replace(/\s+/g, '-')}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [f] })) files = [f];
      } catch { /* share the link only */ }
      await navigator.share({ title: 'Adorn door configuration', text, url, ...(files ? { files } : {}) });
    } catch { /* cancelled */ }
    setBusy(false);
  };

  const download = async () => {
    setBusy(true);
    try {
      const { doorPng } = await import('./lib/render');
      const a = document.createElement('a');
      a.href = await doorPng(door, cfg, 'outside', 900); a.download = `adorn-${cfg.model.replace(/\s+/g, '-')}.jpg`; a.click();
    } catch { showToast('Could not create the image'); }
    setBusy(false);
  };

  const tile = { minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 12px', border: '1px solid #E4E5E6', borderRadius: 8, background: '#fff', color: TX, font: 'inherit', fontSize: 14, fontWeight: 500, textDecoration: 'none', cursor: 'pointer' };
  return (
    <div onClick={closeModal} style={{ ...sheetOverlay, alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 12 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '92dvh', overflowY: 'auto', background: '#fff', borderRadius: isMobile ? '16px 16px 0 0' : 8, padding: `20px 20px calc(20px + env(safe-area-inset-bottom))`, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isMobile && <span aria-hidden="true" style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, background: '#C4C6C8', marginTop: -8 }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 64, height: 64, flex: 'none', borderRadius: 6, background: '#F4F4F3', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', overflow: 'hidden' }}>{thumb(cfg.model, { variant: cfg.variant })}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="share-title" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Share your design</h2>
            <span style={muted}>{name} · anyone with the link sees this exact door</span>
          </div>
          <button onClick={closeModal} aria-label="Close" style={{ width: 44, height: 44, border: 0, background: 'transparent', color: TX, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic n="x" /></button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input readOnly value={url} aria-label="Shareable link" onFocus={(e) => e.target.select()} style={{ flex: 1, minWidth: 0, height: 48, border: '1px solid #C4C6C8', borderRadius: 8, background: '#F7F7F7', padding: '0 12px', font: 'inherit', fontSize: 13, color: TX }} />
          <button onClick={() => copy(url, 'Link copied')} className="hv-bggold" style={{ ...goldBtn, height: 48, borderRadius: 8 }}><Ic n="copy" s={18} sw={2} />Copy</button>
        </div>

        {canShare && <button onClick={nativeShare} disabled={busy} className="hv-bggold" style={{ ...goldBtn, height: 52, justifyContent: 'center', borderRadius: 8, fontSize: 16 }}><Ic n="share" s={20} sw={2} />{busy ? 'Preparing…' : 'Share…'}</button>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
          <a href={`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`} target="_blank" rel="noopener noreferrer" className="hv-tint" style={tile}>WhatsApp</a>
          <a href={`mailto:?subject=${encodeURIComponent('My Adorn door: ' + name)}&body=${encodeURIComponent(text + '\n\nOpen it here: ' + url)}`} className="hv-tint" style={tile}>Email</a>
          <a href={`sms:?&body=${encodeURIComponent(text + ' ' + url)}`} className="hv-tint" style={tile}>Message</a>
          <button onClick={download} disabled={busy} className="hv-tint" style={tile}><Ic n="download" s={18} sw={2} />Save picture</button>
        </div>

        <button onClick={() => setQr(!qr)} aria-expanded={qr} className="hv-grey" style={{ ...greyBtn, justifyContent: 'center', borderRadius: 8 }}><Ic n="qr" s={18} sw={2} />{qr ? 'Hide QR code' : 'Show QR code — open on another device'}</button>
        {qr && qrSvg && <div aria-label="QR code for the link" style={{ alignSelf: 'center', width: 200, height: 200, padding: 8, border: '1px solid #E4E5E6', borderRadius: 8 }} dangerouslySetInnerHTML={{ __html: qrSvg }} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Camera: see it in your space */
export function ARView() {
  const { cfg, patch, showToast, go } = useStore();
  const videoRef = useRef(null), boxRef = useRef(null), ptrs = useRef(new Map()), last = useRef({});
  const [err, setErr] = useState(''), [ov, setOv] = useState(null), [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [p, setP] = useState({ x: 0.5, y: 0.58, s: 0.55 }); // door centre (fractions) and door height as a fraction of the screen
  const dm = D.systemById[cfg.system];

  const close = () => patch({ arOpen: false });
  useEffect(() => {
    let stream, dead = false;
    (async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setErr('This browser cannot open the camera.'); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
        if (dead) { stream.getTracks().forEach((t) => t.stop()); return; }
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      } catch { setErr('Camera access was blocked. Allow the camera in your browser settings, or upload a photo instead.'); }
    })();
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('resize', onResize); window.addEventListener('keydown', onKey);
    return () => { dead = true; if (stream) stream.getTracks().forEach((t) => t.stop()); window.removeEventListener('resize', onResize); window.removeEventListener('keydown', onKey); };
  }, []);
  useEffect(() => {
    let live = true;
    import('./lib/render').then(({ doorOverlay }) => doorOverlay(door, cfg, 700)).then(async (o) => { const img = await loadImg(o.url); if (live) setOv({ ...o, img }); }).catch(() => {});
    return () => { live = false; };
  }, [cfg]);

  const dh = p.s * size.h, dw = ov ? dh / ov.ratio : dh * 0.5;
  const clampS = (s) => Math.min(1.3, Math.max(0.15, s));
  const down = (e) => { ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); last.current = { d: 0, s: p.s }; };
  const move = (e) => {
    const m = ptrs.current; if (!m.has(e.pointerId)) return;
    const prev = m.get(e.pointerId); m.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (m.size >= 2) {
      const [a, b] = [...m.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (last.current.d) setP((q) => ({ ...q, s: clampS(q.s * (d / last.current.d)) }));
      last.current.d = d;
    } else setP((q) => ({ ...q, x: q.x + (e.clientX - prev.x) / size.w, y: q.y + (e.clientY - prev.y) / size.h }));
  };
  const up = (e) => { ptrs.current.delete(e.pointerId); last.current.d = 0; };

  const snap = async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth || !ov) { showToast('Camera is not ready yet'); return; }
    const k = Math.min(window.devicePixelRatio || 1, 2), cw = Math.round(size.w * k), ch = Math.round(size.h * k);
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const ctx = cv.getContext('2d'), sc = Math.max(cw / v.videoWidth, ch / v.videoHeight), vw = v.videoWidth * sc, vh = v.videoHeight * sc;
    ctx.drawImage(v, (cw - vw) / 2, (ch - vh) / 2, vw, vh);
    ctx.drawImage(ov.img, (p.x * size.w - dw / 2) * k, (p.y * size.h - dh / 2) * k, dw * k, dh * k);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.9));
    const f = new File([blob], `adorn-${cfg.model.replace(/\s+/g, '-')}-in-situ.jpg`, { type: 'image/jpeg' });
    try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'My Adorn door' }); return; } } catch { return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = f.name; a.click(); showToast('Picture saved');
  };

  const ctl = { width: 48, height: 48, flex: 'none', border: 0, borderRadius: '50%', background: 'rgba(20,20,22,.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(6px)' };
  return (
    <div ref={boxRef} role="dialog" aria-modal="true" aria-label="See the door in your space" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      style={{ position: 'fixed', inset: 0, zIndex: 130, background: '#111', touchAction: 'none', userSelect: 'none', overflow: 'hidden' }}>
      <video ref={videoRef} playsInline muted autoPlay style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      {ov && !err && <img src={ov.url} alt="" draggable={false} style={{ position: 'absolute', left: p.x * size.w - dw / 2, top: p.y * size.h - dh / 2, width: dw, height: dh, pointerEvents: 'none', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.35))' }} />}
      {err && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, color: '#fff', textAlign: 'center' }}>
          <Ic n="camera" s={40} sw={1.5} /><p style={{ margin: 0, maxWidth: 320, lineHeight: 1.5 }}>{err}</p>
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => { close(); go('house'); }} className="hv-bggold" style={goldBtn}>Upload a photo instead</button>
        </div>
      )}
      <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', left: 0, right: 0, top: 0, padding: 'calc(12px + env(safe-area-inset-top)) 12px 0', display: 'flex', alignItems: 'center', gap: 12, color: '#fff' }}>
        <button onClick={close} aria-label="Close camera" style={ctl}><Ic n="x" /></button>
        <span style={{ flex: 1, fontSize: 13, textShadow: '0 1px 3px rgba(0,0,0,.6)', lineHeight: 1.35 }}>Drag the door onto your doorway. Pinch to resize.<br />{cfg.model} {cfg.variant} · {dm.name}</span>
      </div>
      {!err && (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 20px calc(16px + env(safe-area-inset-bottom))', display: 'flex', alignItems: 'center', gap: 16, background: 'linear-gradient(transparent, rgba(0,0,0,.55))' }}>
          <input type="range" min="0.15" max="1.3" step="0.01" value={p.s} aria-label="Door size" onChange={(e) => setP({ ...p, s: +e.target.value })} style={{ flex: 1, accentColor: G, height: 44 }} />
          <button onClick={snap} aria-label="Take picture" style={{ width: 64, height: 64, flex: 'none', borderRadius: '50%', border: '4px solid #fff', background: G, cursor: 'pointer' }} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Style finder (step) */
const QUESTIONS = [
  { id: 'style', q: 'How would you describe your home?', a: [['modern', 'Modern and clean'], ['classic', 'Classic or traditional'], ['bold', 'Bold and contemporary'], ['mixed', 'A bit of everything']] },
  { id: 'light', q: 'How much daylight do you want in the hallway?', a: [['lots', 'As much as possible'], ['some', 'A soft glow'], ['private', 'Privacy first']] },
  { id: 'mood', q: 'Which colour mood suits you?', a: [['dark', 'Dark and sleek'], ['light', 'Fresh and light'], ['wood', 'Natural wood'], ['green', 'Classic green'], ['brown', 'Warm brown']] },
];
const STYLE = { modern: ['stripV', 'stripL', 'stripCentre', 'slots', 'solidH', 'grooveV'], classic: ['grid', 'porthole', 'window', 'grooveFrame'], bold: ['grooveDiag', 'steps', 'slots', 'porthole'] };
const NARROW = ['stripV', 'stripL', 'stripCentre', 'slots'];
const MOOD = { dark: ['rec-7016-fs', 'rec-7016-fs'], light: ['rec-9003-fs', 'rec-9003-fs'], wood: ['wood-light-oak-fs', 'rec-7016-fs'], green: ['rec-6005-fs', 'rec-6005-fs'], brown: ['rec-8017-fs', 'rec-8017-fs'] };
const GLASS = { lots: 'clear', some: 'satinato', private: 'chinchilla' };

function rank(ans) {
  return D.MODELS.map((m) => {
    let s = (m.seed % 100) / 1000;
    s += ans.style === 'mixed' ? 1 : STYLE[ans.style].includes(m.pattern) ? 3 : 0;
    if (ans.light === 'lots') s += m.glass ? 2 : -2;
    else if (ans.light === 'some') s += m.glass ? 1 : 0;
    else s += !m.glass ? 2 : NARROW.includes(m.pattern) ? 1 : -1;
    return [s, m];
  }).sort((a, b) => b[0] - a[0]).slice(0, 6).map((x) => x[1]);
}

export function StyleFinder() {
  const { cfg, setCfg } = useStore();
  const [ans, setAns] = useState({}), [i, setI] = useState(0), [pick, setPick] = useState(null);
  const done = i >= QUESTIONS.length;
  const results = done ? rank(ans) : [];
  const apply = (m) => {
    setPick(m.code);
    const [o, f] = MOOD[ans.mood];
    setCfg({ model: m.code, glass: GLASS[ans.light], colours: { ...cfg.colours, outside: o, frame: f } });
  };
  if (!done) {
    const Q = QUESTIONS[i];
    return (
      <div style={{ padding: 'var(--pp)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 6 }} aria-hidden="true">{QUESTIONS.map((_, k) => <span key={k} style={{ flex: 1, height: 4, borderRadius: 2, background: k <= i ? G : DV }} />)}</div>
        <span style={muted}>Question {i + 1} of {QUESTIONS.length}</span>
        <h2 style={H2}>{Q.q}</h2>
        <div role="group" aria-label={Q.q} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Q.a.map(([id, label]) => (
            <button key={id} onClick={() => { setAns({ ...ans, [Q.id]: id }); setI(i + 1); try { navigator.vibrate && navigator.vibrate(8); } catch { /* ignore */ } }} className="hv-gold"
              style={{ minHeight: 56, padding: '0 16px', border: `1px solid ${DV}`, borderRadius: 8, background: '#fff', color: TX, font: 'inherit', fontSize: 16, textAlign: 'left', cursor: 'pointer' }}>{label}</button>
          ))}
        </div>
        {i > 0 && <button onClick={() => setI(i - 1)} style={{ alignSelf: 'flex-start', border: 0, background: 'none', padding: 8, font: 'inherit', fontWeight: 500, color: '#8C6A36', cursor: 'pointer' }}>Back</button>}
      </div>
    );
  }
  return (
    <div style={{ padding: 'var(--pp)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={H2}>Doors we think suit you</h2>
      <p style={{ margin: 0, lineHeight: 1.5, color: '#45484B' }}>Tap a door to try it with matching glass and colours. You can refine everything in the next steps.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
        {results.map((m, k) => (
          <button key={m.code} onClick={() => apply(m)} aria-pressed={pick === m.code} className="hv-gold" style={cardBtn(pick === m.code)}>
            <span style={{ height: 150, background: '#F4F4F3', borderRadius: 2, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingTop: 6 }}>{thumb(m.code)}</span>
            <span style={{ fontSize: 14, textAlign: 'center' }}>{m.code}{k === 0 ? ' · best match' : ''}</span>
            {pick === m.code && <Badge />}
          </button>
        ))}
      </div>
      <button onClick={() => { setAns({}); setI(0); setPick(null); }} className="hv-grey" style={{ ...greyBtn, justifyContent: 'center' }}>Start again</button>
    </div>
  );
}

/* ------------------------------------------------------------------ Colour match from the house photo */
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function rgb2hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1)), hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(hh * 60 + 360) % 360, s, l];
}
function hsl2rgb([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255));
}
const POOL = () => [...D.RECOMMENDED, ...D.FINISHES, ...D.RAL];
function nearest(rgb) {
  let best = null, bd = 1e9;
  for (const c of POOL()) { const q = hex2rgb(c.hex), d = (q[0] - rgb[0]) ** 2 * 0.3 + (q[1] - rgb[1]) ** 2 * 0.59 + (q[2] - rgb[2]) ** 2 * 0.11; if (d < bd) { bd = d; best = c; } }
  return best;
}
// Wall colour = most common mid-tone bucket in the lower three quarters of the photo (skips sky).
async function wallColour(src) {
  const img = await loadImg(src), w = 64, h = Math.max(8, Math.round((64 * img.height) / img.width));
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, Math.floor(h * 0.25), w, h - Math.floor(h * 0.25)).data, buckets = new Map();
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
    if (lum < 35 || lum > 238) continue;
    const key = (d[i] >> 5) * 64 + (d[i + 1] >> 5) * 8 + (d[i + 2] >> 5), b = buckets.get(key) || [0, 0, 0, 0];
    b[0]++; b[1] += d[i]; b[2] += d[i + 1]; b[3] += d[i + 2]; buckets.set(key, b);
  }
  let top = null; for (const b of buckets.values()) if (!top || b[0] > top[0]) top = b;
  return top ? [Math.round(top[1] / top[0]), Math.round(top[2] / top[0]), Math.round(top[3] / top[0])] : [160, 150, 140];
}

export function ColourMatch() {
  const { house, cfg, setCfg, showToast } = useStore();
  const [wall, setWall] = useState(null);
  useEffect(() => { let live = true; setWall(null); wallColour(house.src).then((c) => live && setWall(c)).catch(() => {}); return () => { live = false; }; }, [house.src]);
  if (!wall) return <p style={{ margin: 0, ...muted }}>Reading the colours of your photo…</p>;
  const [hh, ss, ll] = rgb2hsl(wall);
  const sug = [
    ['Tone on tone', nearest(hsl2rgb([hh, Math.min(0.5, ss * 0.8), Math.max(0.14, ll - 0.28)]))],
    ['Contrast', nearest(ll > 0.5 ? hsl2rgb([hh, 0.08, 0.2]) : hsl2rgb([hh, 0.1, 0.92]))],
    ['Deep accent', nearest(hsl2rgb([(hh + 180) % 360, 0.35, 0.28]))],
    ['Classic', nearest(ll > 0.5 ? hex2rgb('#383E42') : hex2rgb('#F1F0EA'))],
  ];
  const seen = new Set();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px #C4C6C8', background: `rgb(${wall})` }} />
        <span style={{ fontSize: 14, fontWeight: 500 }}>Colours that suit your house</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
        {sug.filter(([, c]) => !seen.has(c.id) && seen.add(c.id)).map(([label, c]) => {
          const on = cfg.colours.outside === c.id;
          return (
            <button key={c.id} onClick={() => { setCfg({ colours: { ...cfg.colours, outside: c.id, frame: c.id } }); showToast(`${c.name} applied`); }} aria-pressed={on} className="hv-gold"
              style={{ ...cardBtn(on, { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, minHeight: 56, textAlign: 'left' }) }}>
              <span style={{ width: 36, height: 36, flex: 'none', borderRadius: 6, background: c.bg, border: '1px solid rgba(0,0,0,.15)' }} />
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}><span style={muted}>{label}</span><span style={{ fontSize: 13, lineHeight: 1.25 }}>{c.name}</span></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
