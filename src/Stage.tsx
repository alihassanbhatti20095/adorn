// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { STEPS, homog, mat3d } from './lib/core';
import { useStore, door } from './store';
import { Ic, goldBtn, G, TX } from './ui';

/** Optional real renders: public/renders/{model}/{variant}/{view}.png layered over the SVG placeholder. */
const USE_REAL_RENDERS = false;

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
  const { house, cfg, houseBox, startDrag, patch } = useStore();
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
          style={{ position: 'absolute', left: p[0], top: p[1], width: 24, height: 24, margin: '-12px 0 0 -12px', borderRadius: '50%', background: G, border: '3px solid #fff', padding: 0, cursor: 'grab', touchAction: 'none', boxShadow: '0 1px 4px rgba(0,0,0,.35)' }} />
      ))}
    </div>
  );
}

function DropZone() {
  const { dropHover, patch, loadFile } = useStore();
  return (
    <div onDragOver={(e) => { e.preventDefault(); if (!dropHover) patch({ dropHover: true }); }} onDragLeave={() => patch({ dropHover: false })}
      onDrop={(e) => { e.preventDefault(); patch({ dropHover: false }); loadFile(e.dataTransfer.files[0]); }}
      style={{ position: 'absolute', inset: 24, zIndex: 4, border: `2px dashed ${dropHover ? '#A68049' : G}`, background: 'rgba(255,255,255,.9)', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: 24 }}>
      <span style={{ color: G }}><Ic n="image" s={40} sw={1.5} /></span>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Drag and drop a photo of your house</h2>
      <p style={{ margin: 0, fontSize: 14, color: '#5F6265', maxWidth: 340 }}>JPG or PNG, ideally taken straight-on to the entrance in daylight.</p>
      <button onClick={() => useStore.getState().fileEl?.click()} className="hv-bggold" style={goldBtn}><Ic n="upload" s={18} sw={2} />Load image</button>
    </div>
  );
}

const iconBtn = { width: 44, height: 44, border: '1px solid #E4E5E6', borderRadius: 4, background: '#fff', color: TX, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

export default function Stage({ L }) {
  const { cfg, view, zoom, step, panelOpen, rendering, house, cookie, isMobile, patch, go, stageW, stageH } = useStore();
  const stageRef = useRef(null);

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
  const toggleFs = () => { if (!document.fullscreenElement) stageRef.current?.requestFullscreen?.(); else document.exitFullscreen(); };
  const pager = (disabled, onClick, label, icon) => (
    <button onClick={onClick} disabled={disabled} aria-label={label} className="hv-bggold"
      style={{ width: 40, height: 40, border: 0, borderRadius: '50%', background: disabled ? '#C9CBCD' : G, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer' }}><Ic n={icon} /></button>
  );

  return (
    <main ref={stageRef} aria-label="Door preview" style={{ flex: 1, order: L.stageOrder, position: 'relative', overflow: 'hidden', minWidth: 0, minHeight: 0, background: '#EDEDEC' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(70,58,44,.10) 0 3px, transparent 3px 72px), repeating-linear-gradient(90deg, rgba(70,58,44,.06) 0 3px, transparent 3px 230px), linear-gradient(180deg, #DCD6CC 0%, #C9C1B4 100%)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '16%', borderTop: '8px solid #B3AB9F', background: 'repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 2px, transparent 2px 150px), repeating-linear-gradient(0deg, rgba(0,0,0,.08) 0 2px, transparent 2px 50px), linear-gradient(180deg, #9F978C, #82796F)' }} />

      {!houseMode && (
        <div style={{ position: 'absolute', left: 24, right: 24, top: 76, bottom: '16%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', pointerEvents: 'none' }}>
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', transform: `scale(${zoom})`, transformOrigin: '50% 100%', transition: 'transform .25s ease' }}>
            <DoorArt cfg={cfg} view={view} />
            {rendering && <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(242,232,216,0) 30%, rgba(242,232,216,.7) 50%, rgba(242,232,216,0) 70%)', backgroundSize: '220% 100%', animation: 'adornShimmer .9s linear infinite', pointerEvents: 'none' }} />}
          </div>
        </div>
      )}

      {houseMode && !house && <DropZone />}
      {houseMode && house && <HouseEditor />}

      {!houseMode && (
        <div role="group" aria-label="View" style={{ position: 'absolute', top: 16, left: 16, zIndex: 6, display: 'flex', gap: 4, padding: 4, background: '#fff', borderRadius: 999, border: '1px solid #E4E5E6' }}>
          {['outside', 'inside'].map((id) => (
            <button key={id} aria-pressed={view === id} onClick={() => patch({ view: id })}
              style={{ height: 36, padding: '0 16px', border: 0, borderRadius: 999, background: view === id ? G : 'transparent', color: view === id ? '#fff' : TX, font: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>{id === 'outside' ? 'Outside view' : 'Inside view'}</button>
          ))}
        </div>
      )}

      {!isMobile && !panelOpen && (
        <button onClick={() => patch({ panelOpen: true })} className="hv-bggold" style={{ ...goldBtn, position: 'absolute', top: 72, left: 16, zIndex: 6, fontSize: 14 }}><Ic n="menu" s={18} sw={2} />Menu</button>
      )}

      {!houseMode && (
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => patch({ zoom: Math.min(2, +(zoom + 0.2).toFixed(2)) })} aria-label="Zoom in" className="hv-tint" style={iconBtn}><Ic n="zoomIn" /></button>
          <button onClick={() => patch({ zoom: Math.max(0.6, +(zoom - 0.2).toFixed(2)) })} aria-label="Zoom out" className="hv-tint" style={iconBtn}><Ic n="zoomOut" /></button>
          <button onClick={toggleFs} aria-label="Fullscreen" className="hv-tint" style={iconBtn}><Ic n="max" /></button>
        </div>
      )}

      <nav aria-label="Step pager" style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 6, display: 'flex', alignItems: 'center', gap: 10, padding: 6, background: '#fff', borderRadius: 999, border: '1px solid #E4E5E6' }}>
        {pager(atFirst, () => !atFirst && go(STEPS[idx - 1].id, true), 'Previous step', 'chevL')}
        <span aria-live="polite" style={{ minWidth: 44, textAlign: 'center', fontSize: 14, fontWeight: 500 }}>{`${idx + 1}/${STEPS.length}`}</span>
        {pager(atLast, () => !atLast && go(STEPS[idx + 1].id, true), 'Next step', 'chevR')}
      </nav>

      {!cookie && (
        <div role="dialog" aria-label="Cookies" style={{ position: 'absolute', left: 16, right: 16, bottom: L.cookieBottom, zIndex: 8, maxWidth: 480, background: '#fff', border: '1px solid #E4E5E6', borderRadius: 4, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Cookies</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#45484B' }}>We use cookies to remember your configuration and to understand how the configurator is used. You can accept all cookies or choose which ones to allow.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => useStore.getState().saveCookie(true, true)} className="hv-dark" style={{ height: 44, padding: '0 22px', border: 0, borderRadius: 4, background: '#111214', color: '#fff', font: 'inherit', fontWeight: 500, cursor: 'pointer' }}>Agree</button>
            <button onClick={() => patch({ modal: 'cookies', ckA: false, ckM: false })} className="hv-tint" style={{ height: 44, padding: '0 18px', border: '1px solid #2B2D2F', borderRadius: 4, background: '#fff', color: TX, font: 'inherit', cursor: 'pointer' }}>Manage settings</button>
          </div>
        </div>
      )}
    </main>
  );
}
