// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { STEPS, LANGS, G, TX } from './lib/core';
import { useStore, hashStep, viewport } from './store';
import { Ic } from './ui';
import Stage from './Stage';
import Modals from './Modals';
import PrintSheet from './PrintSheet';
import { Reset, Search, TypeStep, ModelStep, Variants, Systems } from './steps/Selection';
import { Construction, Colours, Glass, Handles, Accessories, Locks } from './steps/Options';
import { House, PrintPanel, PrintActions, Save } from './steps/Tools';

const BODY = {
  reset: Reset, search: Search, type: TypeStep, model: ModelStep, variants: Variants, systems: Systems, construction: Construction,
  colours: Colours, glass: Glass, handles: Handles, accessories: Accessories, locks: Locks, house: House, print: PrintPanel, save: Save,
};

const layout = (mob, tall, land) => (land
  ? { mainDir: 'row', railDir: 'column', railW: 76, railH: 'auto', railOrder: 0, railBT: 0, railBR: '1px solid #E4E5E6', railBtnW: '100%', railBtnH: 64, panelW: 'min(340px, 46vw)', panelH: 'auto', hpad: 12, logoH: 32, headerH: 48, codeSize: 14, langW: 104, footerH: 24, titleH: 48, titleSize: 18, bodyPad: 16, stageOrder: 2 }
  : mob
  ? { mainDir: 'column', railDir: 'row', railW: '100%', railH: 64, railOrder: 2, railBT: '1px solid #E4E5E6', railBR: 0, railBtnW: 84, railBtnH: 64, panelW: '100%', panelH: tall ? '64dvh' : '__SH__', hpad: 12, logoH: 40, headerH: 56, codeSize: 15, langW: 104, footerH: 28, titleH: 52, titleSize: 18, bodyPad: 16, stageOrder: 0 }
  : { mainDir: 'row', railDir: 'column', railW: 100, railH: 'auto', railOrder: 0, railBT: 0, railBR: '1px solid #E4E5E6', railBtnW: '100%', railBtnH: 80, panelW: 480, panelH: 'auto', hpad: 24, logoH: 64, headerH: 75, codeSize: 18, langW: 180, footerH: 36, titleH: 64, titleSize: 24, bodyPad: 24, stageOrder: 2 });

function HiddenFile() {
  const patch = useStore((s) => s.patch);
  return (
    <input type="file" accept="image/*" aria-label="Upload house photo" style={{ display: 'none' }}
      ref={(el) => { if (el && useStore.getState().fileEl !== el) patch({ fileEl: el }); }}
      onChange={(e) => { useStore.getState().loadFile(e.target.files[0]); e.target.value = ''; }} />
  );
}

export default function App() {
  const { cfg, step, panelOpen, sheetTall, isMobile, isLand, isShort, lang, toast, patch, go, setLang } = useStore();
  const L = layout(isMobile, sheetTall, isLand);
  if (L.panelH === '__SH__') L.panelH = isShort ? '36dvh' : '42dvh';
  const railRef = useRef(null);
  const idx = STEPS.findIndex((s) => s.id === step), cur = STEPS[idx];
  const Body = BODY[step];

  useEffect(() => {
    const onResize = () => patch(viewport());
    const onHash = () => { const s = hashStep(); if (s && s !== useStore.getState().step) patch({ step: s, panelOpen: true }); };
    const onMove = (e) => useStore.getState().dragMove(e);
    const onUp = () => useStore.getState().endDrag();
    const onAfterPrint = () => patch({ printing: false });
    window.addEventListener('resize', onResize); window.addEventListener('hashchange', onHash);
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('afterprint', onAfterPrint);
    onResize();
    return () => {
      window.removeEventListener('resize', onResize); window.removeEventListener('hashchange', onHash);
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [patch]);

  useEffect(() => {
    const a = railRef.current && railRef.current.querySelector('[aria-current]');
    if (a && isMobile) a.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [step, isMobile, panelOpen]);

  const showRail = isMobile || panelOpen;
  return (
    <>
      <div id="adorn-app" style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Roboto, system-ui, sans-serif', color: TX, fontSize: 14, overflow: 'hidden' }}>
        <header style={{ height: L.headerH, flex: 'none', background: '#DCDEE0', display: 'flex', alignItems: 'center', gap: 16, padding: `0 ${L.hpad}px`, borderBottom: '1px solid #CFD1D3' }}>
          <a href="#/model" aria-label="Adorn door configurator home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            {/* The logo JPG has a white background; multiply blends it into the grey header. */}
            <img src="/adorn-logo.jpg" alt="Adorn" style={{ height: L.logoH, width: 'auto', display: 'block', mixBlendMode: 'multiply' }} />
          </a>
          <div style={{ flex: 1 }} />
          <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.25 }}>
            <span style={{ fontSize: 12, color: '#5A5D60' }}>Model</span>
            <span style={{ fontSize: L.codeSize, fontWeight: 500, whiteSpace: 'nowrap' }}>{`${cfg.model} ${cfg.variant}`}</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Language</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ height: 40, width: L.langW, border: '1px solid #C4C6C8', borderRadius: 4, background: '#fff', padding: '0 10px', font: 'inherit', fontSize: 14, color: TX, cursor: 'pointer' }}>
              {LANGS.map((lg) => <option key={lg.id} value={lg.id}>{lg.label}</option>)}
            </select>
          </label>
        </header>

        <div style={{ flex: 1, display: 'flex', flexDirection: L.mainDir, minHeight: 0, position: 'relative' }}>
          {showRail && (
            <nav ref={railRef} aria-label="Configurator steps" className="adorn-rail" style={{ flex: 'none', order: L.railOrder, display: 'flex', flexDirection: L.railDir, width: L.railW, height: L.railH, overflow: 'auto', scrollSnapType: isMobile && !isLand ? 'x proximity' : undefined, background: '#fff', borderRight: L.railBR, borderTop: L.railBT }}>
              {STEPS.map((s) => {
                const a = s.id === step;
                return (
                  <button key={s.id} onClick={() => go(s.id)} aria-current={a ? 'step' : undefined} title={s.label} className={a ? 'hv-bggold' : 'hv-tint'}
                    style={{ flex: 'none', width: L.railBtnW, minHeight: L.railBtnH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 4 : 6, scrollSnapAlign: 'center', padding: '6px 4px', border: 0, background: a ? G : '#fff', color: a ? '#fff' : TX, font: 'inherit', fontSize: isMobile ? 11 : 12, lineHeight: 1.15, textAlign: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                    <Ic n={s.icon} s={isMobile ? 22 : 24} sw={1.6} /><span>{s.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {panelOpen && (
            <section aria-label={cur.label} style={{ flex: 'none', order: 1, width: L.panelW, height: L.panelH, zIndex: 30, display: 'flex', flexDirection: 'column', background: '#fff', boxShadow: isMobile && !isLand ? '0 -6px 20px rgba(0,0,0,.14)' : 'none', borderRight: '1px solid #E4E5E6', borderRadius: isMobile && !isLand ? '12px 12px 0 0' : 0, overflow: 'hidden', transition: isMobile && !isLand ? 'height .25s ease' : undefined }}>
              <div style={{ height: L.titleH, flex: 'none', background: '#5A5D60', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px' }}>
                <button onClick={() => idx > 0 && go(STEPS[idx - 1].id, true)} aria-label="Previous step" disabled={idx === 0}
                  style={{ width: 44, height: 44, border: 0, background: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}><Ic n="arrowLeft" /></button>
                <h1 style={{ flex: 1, minWidth: 0, margin: 0, fontSize: L.titleSize, fontWeight: 500, lineHeight: 1.15, ...(isMobile ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }) }}>{cur.label}</h1>
                {isMobile && !isLand && <button onClick={() => patch({ sheetTall: !sheetTall })} aria-label={sheetTall ? 'Shrink panel' : 'Expand panel'} aria-pressed={sheetTall}
                  style={{ width: 44, height: 44, border: 0, background: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'pointer' }}><span style={{ display: 'flex', transform: `rotate(${sheetTall ? 0 : 180}deg)`, transition: 'transform .2s' }}><Ic n="chevD" /></span></button>}
                <button onClick={() => patch({ panelOpen: false })} aria-label="Close panel"
                  style={{ width: 44, height: 44, border: 0, background: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'pointer' }}><Ic n="x" /></button>
              </div>
              <div className="adorn-body" style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', minHeight: 0, position: 'relative' }}><Body /></div>
              {step === 'print' && <PrintActions />}
            </section>
          )}

          <Stage L={L} />
          <HiddenFile />
        </div>

        <footer style={{ minHeight: L.footerH, paddingBottom: 'env(safe-area-inset-bottom)', flex: 'none', display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 18, padding: `0 ${L.hpad}px`, borderTop: '1px solid #E4E5E6', background: '#fff', fontSize: isMobile ? 11 : 12, color: '#5F6265', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <button onClick={() => patch({ modal: 'cookies', ckA: false, ckM: false })} className="hv-text" style={{ border: 0, background: 'none', padding: 0, font: 'inherit', color: '#5F6265', cursor: 'pointer' }}>Cookies</button>
          <a href="#" style={{ color: '#5F6265', textDecoration: 'none' }}>Data protection</a>
          <a href="#" style={{ color: '#5F6265', textDecoration: 'none' }}>Legal Notice</a>
          <span style={{ flex: 1 }} />
          <span>{isMobile ? '© 2026 Adorn' : 'Powered by Adorn © 2026'}</span>
        </footer>

        <Modals />
        {toast && (
          <div role="status" style={{ position: 'fixed', left: '50%', top: L.headerH + 12, maxWidth: 'calc(100vw - 24px)', transform: 'translateX(-50%)', zIndex: 120, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: '#2B2D2F', color: '#fff', borderRadius: 4, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,.18)' }}>
            <span style={{ color: '#D9B98A', display: 'flex' }}><Ic n="check" s={14} sw={3} /></span>{toast}
          </div>
        )}
      </div>
      <PrintSheet />
    </>
  );
}
