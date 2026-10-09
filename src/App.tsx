// @ts-nocheck
import React, { useEffect } from 'react';
import { STEPS, LANGS, G, TX } from './lib/core';
import { useStore, hashStep } from './store';
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

const layout = (mob) => (mob
  ? { mainDir: 'column', railDir: 'row', railW: '100%', railH: 76, railOrder: 2, railBT: '1px solid #E4E5E6', railBR: 0, railBtnW: 88, railBtnH: 76, panelW: '100%', panelH: '62vh', panelPos: 'fixed', panelBottom: 108, panelShadow: '0 -8px 24px rgba(0,0,0,.18)', hpad: 12, logoH: 52, codeSize: 15, langW: 108, footerH: 32, cookieBottom: 80, stageOrder: 0 }
  : { mainDir: 'row', railDir: 'column', railW: 100, railH: 'auto', railOrder: 0, railBT: 0, railBR: '1px solid #E4E5E6', railBtnW: '100%', railBtnH: 80, panelW: 480, panelH: 'auto', panelPos: 'relative', panelBottom: 'auto', panelShadow: 'none', hpad: 24, logoH: 64, codeSize: 18, langW: 180, footerH: 36, cookieBottom: 80, stageOrder: 2 });

function HiddenFile() {
  const patch = useStore((s) => s.patch);
  return (
    <input type="file" accept="image/*" aria-label="Upload house photo" style={{ display: 'none' }}
      ref={(el) => { if (el && useStore.getState().fileEl !== el) patch({ fileEl: el }); }}
      onChange={(e) => { useStore.getState().loadFile(e.target.files[0]); e.target.value = ''; }} />
  );
}

export default function App() {
  const { cfg, step, panelOpen, isMobile, lang, toast, patch, go, setLang } = useStore();
  const L = layout(isMobile);
  const idx = STEPS.findIndex((s) => s.id === step), cur = STEPS[idx];
  const Body = BODY[step];

  useEffect(() => {
    const onResize = () => patch({ isMobile: window.innerWidth < 768 });
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

  const showRail = isMobile || panelOpen;
  return (
    <>
      <div id="adorn-app" style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Roboto, system-ui, sans-serif', color: TX, fontSize: 14, overflow: 'hidden' }}>
        <header style={{ height: 75, flex: 'none', background: '#DCDEE0', display: 'flex', alignItems: 'center', gap: 16, padding: `0 ${L.hpad}px`, borderBottom: '1px solid #CFD1D3' }}>
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
            <nav aria-label="Configurator steps" style={{ flex: 'none', order: L.railOrder, display: 'flex', flexDirection: L.railDir, width: L.railW, height: L.railH, overflow: 'auto', background: '#fff', borderRight: L.railBR, borderTop: L.railBT }}>
              {STEPS.map((s) => {
                const a = s.id === step;
                return (
                  <button key={s.id} onClick={() => go(s.id)} aria-current={a ? 'step' : undefined} title={s.label} className={a ? 'hv-bggold' : 'hv-tint'}
                    style={{ flex: 'none', width: L.railBtnW, minHeight: L.railBtnH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 4px', border: 0, background: a ? G : '#fff', color: a ? '#fff' : TX, font: 'inherit', fontSize: 12, lineHeight: 1.2, textAlign: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                    <Ic n={s.icon} s={24} sw={1.6} /><span>{s.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {panelOpen && (
            <section aria-label={cur.label} style={{ flex: 'none', order: 1, width: L.panelW, height: L.panelH, position: L.panelPos, left: 0, right: 0, bottom: L.panelBottom, zIndex: 30, display: 'flex', flexDirection: 'column', background: '#fff', boxShadow: L.panelShadow, borderRight: '1px solid #E4E5E6' }}>
              <div style={{ height: 64, flex: 'none', background: '#5A5D60', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px' }}>
                <button onClick={() => idx > 0 && go(STEPS[idx - 1].id, true)} aria-label="Previous step" disabled={idx === 0}
                  style={{ width: 44, height: 44, border: 0, background: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}><Ic n="arrowLeft" /></button>
                <h1 style={{ flex: 1, margin: 0, fontSize: 24, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur.label}</h1>
                <button onClick={() => patch({ panelOpen: false })} aria-label="Close panel"
                  style={{ width: 44, height: 44, border: 0, background: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'pointer' }}><Ic n="x" /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, position: 'relative' }}><Body /></div>
              {step === 'print' && <PrintActions />}
            </section>
          )}

          <Stage L={L} />
          <HiddenFile />
        </div>

        <footer style={{ height: L.footerH, flex: 'none', display: 'flex', alignItems: 'center', gap: 18, padding: `0 ${L.hpad}px`, borderTop: '1px solid #E4E5E6', background: '#fff', fontSize: 12, color: '#5F6265', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <button onClick={() => patch({ modal: 'cookies', ckA: false, ckM: false })} className="hv-text" style={{ border: 0, background: 'none', padding: 0, font: 'inherit', color: '#5F6265', cursor: 'pointer' }}>Cookies</button>
          <a href="#" style={{ color: '#5F6265', textDecoration: 'none' }}>Data protection</a>
          <a href="#" style={{ color: '#5F6265', textDecoration: 'none' }}>Legal Notice</a>
          <span style={{ flex: 1 }} />
          <span>Powered by Adorn © 2026</span>
        </footer>

        <Modals />
        {toast && (
          <div role="status" style={{ position: 'fixed', left: '50%', top: 88, transform: 'translateX(-50%)', zIndex: 120, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: '#2B2D2F', color: '#fff', borderRadius: 4, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,.18)' }}>
            <span style={{ color: '#D9B98A', display: 'flex' }}><Ic n="check" s={14} sw={3} /></span>{toast}
          </div>
        )}
      </div>
      <PrintSheet />
    </>
  );
}
