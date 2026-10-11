// @ts-nocheck
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { STEPS, homog, mat3d, clamp } from './lib/core';
import { D } from './data';
import { useStore, door } from './store';
import { Ic, goldBtn, G, TX } from './ui';

/** Optional real renders: public/renders/{model}/{variant}/{view}.png layered over the SVG placeholder. */
const USE_REAL_RENDERS = false;
const House3D = lazy(() => import('./House3D'));

function DoorArt({ cfg, view }) {
  const main = door(cfg, view).el;
  const src = `renders/${encodeURIComponent(cfg.model)}/${cfg.variant}/${view}.png`;
  const [missing, setMissing] = useState({});
  if (!USE_REAL_RENDERS) return main;
  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
      {main}
      {!missing[src] && <img key={src} src={src} alt="" onError={() => setMissing((m) => ({ ...m, [src]: true }))} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: '50% 100%' }} />}
    </div>
  );
}

function HouseEditor() {
  const { house, cfg, houseBox, startDrag, patch, isMobile } = useStore();
  const ovRef = useRef(null);
  useEffect(() => { patch({ ovEl: ovRef.current }); return () => patch({ ovEl: null }); }, [patch]);
  const box = houseBox(house), { TW, TH } = door(cfg, 'outside', { pad: 0 });
  const dw = 400, dh = Math.round((400 * TH) / TW);
  const px = house.corners.map((p) => [p[0] * box.w, p[1] * box.h]);
  const H = homog([[0, 0], [dw, 0], [dw, dh], [0, dh]], px);
  const names = ['Top-left corner', 'Top-right corner', 'Bottom-right corner', 'Bottom-left corner'];
  const doorEl = door(cfg, 'outside', { pad: 0, w: dw, h: dh, style: { display: 'block', width: dw + 'px', height: dh + 'px' } }).el;
  const key = (i) => (e) => {
    const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!m) return;
    e.preventDefault();
    const st = e.shiftKey ? 0.02 : 0.004;
    patch({ house: { ...house, corners: house.corners.map((q, j) => (j === i ? [q[0] + m[0] * st, q[1] + m[1] * st] : q)) } });
  };
  return (
    <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, zIndex: 4, touchAction: 'none', userSelect: 'none' }}>
      <div role="img" aria-label="Your house photo" style={{ width: '100%', height: '100%', backgroundImage: `url(${house.src})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }} />
      <div ref={ovRef} onPointerDown={(e) => { e.preventDefault(); startDrag({ i: -1, x: e.clientX, y: e.clientY, orig: house.corners }); }}
        style={{ position: 'absolute', left: 0, top: 0, width: dw, height: dh, transformOrigin: '0 0', transform: mat3d(H), filter: `brightness(${house.bright})`, cursor: 'move', touchAction: 'none' }}>{doorEl}</div>
      {px.map((p, i) => (
        <button key={i} aria-label={names[i] + ' — drag or use arrow keys'} onKeyDown={key(i)}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); startDrag({ i, x: e.clientX, y: e.clientY, orig: house.corners }); }}
          style={{ position: 'absolute', left: p[0], top: p[1], width: isMobile ? 34 : 24, height: isMobile ? 34 : 24, margin: isMobile ? '-17px 0 0 -17px' : '-12px 0 0 -12px', borderRadius: '50%', background: G, border: '3px solid #fff', padding: 0, cursor: 'grab', touchAction: 'none', boxShadow: '0 1px 4px rgba(0,0,0,.35)' }} />
      ))}
    </div>
  );
}

function DropZone() {
  const { dropHover, patch, loadFile, isMobile } = useStore();
  return (
    <div onDragOver={(e) => { e.preventDefault(); if (!dropHover) patch({ dropHover: true }); }} onDragLeave={() => patch({ dropHover: false })}
      onDrop={(e) => { e.preventDefault(); patch({ dropHover: false }); loadFile(e.dataTransfer.files[0]); }}
      style={{ position: 'absolute', ...(isMobile ? { left: 10, right: 10, top: 10, bottom: 64 } : { inset: 24 }), zIndex: 4, border: `2px dashed ${dropHover ? '#A68049' : G}`, background: 'rgba(255,255,255,.9)', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center', padding: isMobile ? 14 : 24 }}>
      <span style={{ color: G }}><Ic n="image" s={40} sw={1.5} /></span>
      <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 500 }}>{isMobile ? 'Add a photo of your house' : 'Drag and drop a photo of your house'}</h2>
      <p style={{ margin: 0, fontSize: 14, color: '#5F6265', maxWidth: 340 }}>JPG or PNG, ideally taken straight-on to the entrance in daylight.</p>
      <button onClick={() => useStore.getState().fileEl?.click()} className="hv-bggold" style={goldBtn}><Ic n="upload" s={18} sw={2} />Load image</button>
    </div>
  );
}

const fx = (on) => ({ width: 44, height: 44, flex: 'none', border: `1px solid ${on ? G : '#E4E5E6'}`, borderRadius: 4, background: on ? '#F2E8D8' : '#fff', color: TX, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' });
const iconBtn = { width: 44, height: 44, flex: 'none', border: '1px solid #E4E5E6', borderRadius: 4, background: '#fff', color: TX, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

export default function Stage({ L }) {
  const { cfg, view, zoom, pan, night, doorOpen, step, panelOpen, rendering, house, cookie, isMobile, isLand, isShort, patch, go, stageW, stageH } = useStore();
  const stageRef = useRef(null), ptrs = useRef(new Map()), gest = useRef({}), lastTap = useRef(0);
  const [gesturing, setGesturing] = useState(false);
  const T = D.typeById[cfg.type], view3d = step === 'view3d', canOpen = view3d || !(T.l || T.r || T.o);

  // Touch: pinch to zoom, drag to pan when zoomed, swipe sideways to flip outside/inside, double-tap to zoom. Wheel zooms on desktop.
  const gDown = (e) => {
    if (step === 'house' || step === 'view3d' || e.target.closest('button, a, input, select, textarea, [role=dialog]')) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gest.current, n = ptrs.current.size;
    if (n === 1) Object.assign(g, { x0: e.clientX, y0: e.clientY, t0: Date.now(), moved: 0, pan0: pan, d0: 0 });
    if (n === 2) { const [a, b] = [...ptrs.current.values()]; Object.assign(g, { d0: Math.hypot(a.x - b.x, a.y - b.y), z0: useStore.getState().zoom, moved: 99 }); }
    setGesturing(true);
  };
  const gMove = (e) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gest.current, z = useStore.getState().zoom;
    if (ptrs.current.size >= 2 && g.d0) {
      const [a, b] = [...ptrs.current.values()], nz = clamp(+(g.z0 * (Math.hypot(a.x - b.x, a.y - b.y) / g.d0)).toFixed(2), 0.6, 3);
      patch({ zoom: nz });
    } else if (ptrs.current.size === 1) {
      const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
      g.moved = Math.max(g.moved || 0, Math.hypot(dx, dy));
      if (z > 1.05) patch({ pan: { x: g.pan0.x + dx, y: g.pan0.y + dy } });
    }
  };
  const gUp = (e) => {
    if (!ptrs.current.has(e.pointerId)) return;
    const g = gest.current, z = useStore.getState().zoom, wasSingle = ptrs.current.size === 1;
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) setGesturing(false);
    if (!wasSingle) { g.d0 = 0; return; }
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0, dt = Date.now() - g.t0;
    if (z <= 1.05 && Math.abs(dx) > 70 && Math.abs(dy) < 60 && dt < 600) { patch({ view: dx < 0 ? 'inside' : 'outside', doorOpen: false }); try { navigator.vibrate && navigator.vibrate(10); } catch { /* unsupported */ } return; }
    if (g.moved < 8 && dt < 250) {
      const now = Date.now();
      if (now - lastTap.current < 320) { patch(z > 1.05 ? { zoom: 1, pan: { x: 0, y: 0 } } : { zoom: 2.2 }); lastTap.current = 0; } else lastTap.current = now;
    }
    if (useStore.getState().zoom <= 1.05 && (pan.x || pan.y)) patch({ pan: { x: 0, y: 0 } });
  };
  const gWheel = (e) => { if (step === 'house' || step === 'view3d') return; const nz = clamp(+(zoom - e.deltaY * 0.0015).toFixed(2), 0.6, 3); patch(nz <= 1.05 ? { zoom: nz, pan: { x: 0, y: 0 } } : { zoom: nz }); };

  // Door swing preview: hinge side comes from the opening direction, mirrored when looking from inside.
  const inside = view === 'inside', hingeRight = (cfg.opening[0] === 'R') !== inside, towardViewer = (cfg.opening.endsWith('out')) !== inside;
  const swing = (hingeRight ? 1 : -1) * (towardViewer ? 1 : -1) * 62;

  useEffect(() => {
    const el = stageRef.current;
    patch({ stageEl: el });
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect(), s = useStore.getState();
      if (Math.abs(r.width - s.stageW) > 1 || Math.abs(r.height - s.stageH) > 1) patch({ stageW: r.width, stageH: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [patch]);

  const idx = STEPS.findIndex((x) => x.id === step), houseMode = step === 'house';
  const atFirst = idx === 0, atLast = idx === STEPS.length - 1;
  const canFs = typeof document !== 'undefined' && !!document.fullscreenEnabled;
  const toggleFs = () => { if (!document.fullscreenElement) stageRef.current?.requestFullscreen?.(); else document.exitFullscreen(); };
  const pager = (disabled, onClick, label, icon) => (
    <button onClick={onClick} disabled={disabled} aria-label={label} className="hv-bggold"
      style={{ width: isMobile ? 44 : 40, height: isMobile ? 44 : 40, border: 0, borderRadius: '50%', background: disabled ? '#C9CBCD' : G, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer' }}><Ic n={icon} /></button>
  );

  return (
    <main ref={stageRef} aria-label="Door preview" onPointerDown={gDown} onPointerMove={gMove} onPointerUp={gUp} onPointerCancel={gUp} onWheel={gWheel}
      style={{ flex: 1, order: L.stageOrder, position: 'relative', overflow: 'hidden', minWidth: 0, minHeight: 0, background: '#EDEDEC', touchAction: step === 'house' || step === 'view3d' ? undefined : 'none' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(70,58,44,.10) 0 3px, transparent 3px 72px), repeating-linear-gradient(90deg, rgba(70,58,44,.06) 0 3px, transparent 3px 230px), linear-gradient(180deg, #DCD6CC 0%, #C9C1B4 100%)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: isMobile ? (isShort ? 'max(12%, 56px)' : 'max(16%, 64px)') : '16%', borderTop: '8px solid #B3AB9F', background: 'repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 2px, transparent 2px 150px), repeating-linear-gradient(0deg, rgba(0,0,0,.08) 0 2px, transparent 2px 50px), linear-gradient(180deg, #9F978C, #82796F)' }} />

      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: night && !houseMode && !view3d ? 1 : 0, transition: 'opacity .6s ease', background: 'linear-gradient(180deg, rgba(8,14,34,.78), rgba(18,20,34,.6))' }} />
      {!houseMode && !view3d && (
        <div style={{ position: 'absolute', left: isMobile ? 12 : 24, right: isMobile ? 12 : 24, top: isMobile ? 56 : 76, bottom: isMobile ? (isShort ? 'max(12%, 56px)' : 'max(16%, 64px)') : '16%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', pointerEvents: 'none' }}>
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '50% 100%', transition: gesturing ? 'none' : 'transform .25s ease', perspective: 1600, filter: night ? 'drop-shadow(0 0 26px rgba(255,196,110,.38))' : undefined }}>
            {doorOpen && canOpen && <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, #FFD9A0 0%, #8A6A44 45%, #2A2118 100%)' }} />}
            <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', transformOrigin: hingeRight ? '100% 50%' : '0% 50%', transform: doorOpen && canOpen ? `rotateY(${swing}deg)` : 'none', transition: 'transform .9s cubic-bezier(.3,.7,.2,1)', filter: night ? 'brightness(.78)' : undefined }}>
              <DoorArt cfg={cfg} view={view} />
            </div>
            {rendering && <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(242,232,216,0) 30%, rgba(242,232,216,.7) 50%, rgba(242,232,216,0) 70%)', backgroundSize: '220% 100%', animation: 'adornShimmer .9s linear infinite', pointerEvents: 'none' }} />}
          </div>
        </div>
      )}

      {houseMode && !house && <DropZone />}
      {houseMode && house && <HouseEditor />}

      {view3d && <Suspense fallback={<div role="status" style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EDEDEC', color: '#5F6265' }}>Loading 3D view…</div>}><House3D /></Suspense>}
      {view3d && (
        <div role="group" aria-label="Camera angle" className="adorn-rail" style={{ position: 'absolute', top: isMobile ? 8 : 16, left: isMobile ? 8 : 16, right: isMobile ? 64 : 'auto', zIndex: 6, display: 'flex', gap: 4, padding: 4, background: '#fff', borderRadius: 999, border: '1px solid #E4E5E6', overflowX: 'auto' }}>
          {[['door', 'Door'], ['front', 'Whole house'], ['left', 'Left'], ['right', 'Right']].map(([id, label]) => (
            <button key={id} onClick={() => useStore.getState().h3 && useStore.getState().h3.view(id)} className="hv-tint" style={{ flex: 'none', height: isMobile ? 40 : 36, padding: '0 14px', border: 0, borderRadius: 999, background: 'transparent', color: TX, font: 'inherit', fontSize: isMobile ? 13 : 14, fontWeight: 500, cursor: 'pointer' }}>{label}</button>
          ))}
        </div>
      )}
      {!houseMode && !view3d && (
        <div role="group" aria-label="View" style={{ position: 'absolute', top: isMobile ? 8 : 16, left: isMobile ? 8 : 16, zIndex: 6, display: 'flex', gap: 4, padding: 4, background: '#fff', borderRadius: 999, border: '1px solid #E4E5E6' }}>
          {['outside', 'inside'].map((id) => (
            <button key={id} aria-pressed={view === id} onClick={() => patch({ view: id })}
              style={{ height: isMobile ? 40 : 36, padding: isMobile ? '0 14px' : '0 16px', border: 0, borderRadius: 999, background: view === id ? G : 'transparent', color: view === id ? '#fff' : TX, font: 'inherit', fontSize: isMobile ? 13 : 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>{id === 'outside' ? 'Outside view' : 'Inside view'}</button>
          ))}
        </div>
      )}

      {!isMobile && !panelOpen && (
        <button onClick={() => patch({ panelOpen: true })} className="hv-bggold" style={{ ...goldBtn, position: 'absolute', top: 72, left: 16, zIndex: 6, fontSize: 14 }}><Ic n="menu" s={18} sw={2} />Menu</button>
      )}

      {!houseMode && !view3d && (
        <div style={isMobile ? { position: 'absolute', left: 8, bottom: 8, zIndex: 6, display: 'flex', gap: 6 } : { position: 'absolute', top: 16, right: 16, zIndex: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => patch({ zoom: Math.min(3, +(zoom + 0.25).toFixed(2)) })} aria-label="Zoom in" className="hv-tint" style={iconBtn}><Ic n="zoomIn" /></button>
          <button onClick={() => patch(zoom - 0.25 <= 1.05 ? { zoom: Math.max(0.6, +(zoom - 0.25).toFixed(2)), pan: { x: 0, y: 0 } } : { zoom: +(zoom - 0.25).toFixed(2) })} aria-label="Zoom out" className="hv-tint" style={iconBtn}><Ic n="zoomOut" /></button>
          {canFs && <button onClick={toggleFs} aria-label="Fullscreen" className="hv-tint" style={iconBtn}><Ic n="max" /></button>}
        </div>
      )}

      {!houseMode && (
        <div role="group" aria-label="Preview effects" style={isMobile ? { position: 'absolute', top: 8, right: 8, zIndex: 6, display: 'flex', flexDirection: 'column', gap: 6 } : { position: 'absolute', top: 16, right: 76, zIndex: 6, display: 'flex', gap: 6 }}>
          <button onClick={() => patch({ night: !night })} aria-pressed={night} aria-label={night ? 'Switch to daylight' : 'Switch to night'} title={night ? 'Daylight' : 'Night'} className="hv-tint" style={fx(night)}><Ic n={night ? 'sun' : 'moon'} /></button>
          <button onClick={() => canOpen && patch({ doorOpen: !doorOpen })} disabled={!canOpen} aria-pressed={doorOpen} aria-label={doorOpen ? 'Close the door' : 'Open the door'} title={canOpen ? (doorOpen ? 'Close the door' : 'Open the door') : 'Door swing is available for single doors'} className="hv-tint" style={{ ...fx(doorOpen), opacity: canOpen ? 1 : 0.4, cursor: canOpen ? 'pointer' : 'not-allowed' }}><Ic n="doorOpen" /></button>
          {!view3d && <button onClick={() => patch({ arOpen: true })} aria-label="See it in your space with the camera" title="See it in your space" className="hv-tint" style={fx(false)}><Ic n="camera" /></button>}
        </div>
      )}

      <nav aria-label="Step pager" style={{ position: 'absolute', right: isMobile ? 8 : 16, bottom: isMobile ? 8 : 16, zIndex: 6, display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, padding: 4, background: '#fff', borderRadius: 999, border: '1px solid #E4E5E6' }}>
        {pager(atFirst, () => !atFirst && go(STEPS[idx - 1].id, true), 'Previous step', 'chevL')}
        <span aria-live="polite" style={{ minWidth: 44, textAlign: 'center', fontSize: 14, fontWeight: 500 }}>{`${idx + 1}/${STEPS.length}`}</span>
        {pager(atLast, () => !atLast && go(STEPS[idx + 1].id, true), 'Next step', 'chevR')}
      </nav>

      {!cookie && (
        <div role="dialog" aria-label="Cookies" style={isMobile ? { position: 'fixed', left: 8, right: 8, bottom: 'calc(8px + env(safe-area-inset-bottom))', zIndex: 90, background: '#fff', border: '1px solid #CFD1D3', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 8px 28px rgba(0,0,0,.25)' } : { position: 'absolute', left: 16, right: 16, bottom: L.cookieBottom, zIndex: 8, maxWidth: 480, background: '#fff', border: '1px solid #E4E5E6', borderRadius: 4, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Cookies</h2>
          <p style={{ margin: 0, fontSize: isMobile ? 13 : 14, lineHeight: 1.45, color: '#45484B' }}>We use cookies to remember your configuration and to understand how the configurator is used. You can accept all cookies or choose which ones to allow.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => useStore.getState().saveCookie(true, true)} className="hv-dark" style={{ flex: isMobile ? 1 : 'none', height: 44, padding: '0 22px', border: 0, borderRadius: 4, background: '#111214', color: '#fff', font: 'inherit', fontWeight: 500, cursor: 'pointer' }}>Agree</button>
            <button onClick={() => patch({ modal: 'cookies', ckA: false, ckM: false })} className="hv-tint" style={{ flex: isMobile ? 1 : 'none', height: 44, padding: '0 18px', border: '1px solid #2B2D2F', borderRadius: 4, background: '#fff', color: TX, font: 'inherit', cursor: 'pointer' }}>Manage settings</button>
          </div>
        </div>
      )}
    </main>
  );
}
