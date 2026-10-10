// @ts-nocheck
import React from 'react';
import { D } from '../data';
import { PANELS, OPEN, VAR_DESC, enc } from '../lib/core';
import { useStore, thumb, dims, shareUrl } from '../store';
import { getTypeThumb } from './Selection';
import { Ic, goldBtn, greyBtn, muted, G, TX } from '../ui';

const ERR = '#C0392B';

/* ------------------------------------------------------------------ House photo */
export function House() {
  const { house, patch, loadFile, saveImage, defaultCorners } = useStore();
  const fileRef = useStore((s) => s.fileEl);
  const pick = () => useStore.getState().fileEl && useStore.getState().fileEl.click();
  const set = (p) => patch({ house: Object.assign({}, house, p) });
  const onScale = (e) => {
    const ns = +e.target.value, f = ns / house.scale;
    const cx = house.corners.reduce((a, p) => a + p[0], 0) / 4, cy = house.corners.reduce((a, p) => a + p[1], 0) / 4;
    set({ scale: ns, corners: house.corners.map((p) => [cx + (p[0] - cx) * f, cy + (p[1] - cy) * f]) });
  };
  const slider = (label, pct, min, max, value, onChange) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 500 }}>{label}<span style={{ fontWeight: 400, color: '#5F6265' }}>{pct}</span></span>
      <input type="range" min={min} max={max} step="0.01" value={value} onChange={onChange} style={{ accentColor: G }} />
    </label>
  );
  return (
    <div style={{ padding: 'var(--pp)', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <p style={{ margin: 0, lineHeight: 1.5 }}>Upload a photo of your house front and place the door into the opening to preview it in situ.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={pick} className="hv-bggold" style={goldBtn}><Ic n="upload" s={18} sw={2} />Load image</button>
        <button onClick={saveImage} disabled={!house} style={{ ...greyBtn, color: house ? TX : '#B5B7B9', cursor: house ? 'pointer' : 'not-allowed' }}><Ic n="download" s={18} sw={2} />Save image</button>
      </div>
      {house && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {slider('Scale', Math.round(house.scale * 100) + '%', 0.3, 2.5, house.scale, onScale)}
          {slider('Brightness', Math.round(house.bright * 100) + '%', 0.4, 1.6, house.bright, (e) => set({ bright: +e.target.value }))}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => set({ scale: 1, bright: 1, corners: defaultCorners(house) })} className="hv-grey" style={{ height: 40, padding: '0 16px', border: 0, borderRadius: 4, background: '#E9EAEB', color: TX, font: 'inherit', cursor: 'pointer' }}>Reset position</button>
            <button onClick={() => patch({ house: null })} style={{ height: 40, padding: '0 16px', border: 0, borderRadius: 4, background: 'transparent', color: '#8C6A36', font: 'inherit', fontWeight: 500, cursor: 'pointer' }}>Remove photo</button>
          </div>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#5F6265' }}>Drag the gold corners onto the corners of your door opening to match the perspective. Drag the door itself to move it. Corners also move with the arrow keys.</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Print / Enquiry */
export function summary(c) {
  const sys = D.systemById[c.system], T = D.typeById[c.type], hd = D.handleById[c.handle], lk = D.lockById[c.lock], gl = D.glassById[c.glass], co = D.colourById, dm = dims(c);
  const rows = [
    { step: 'model', label: 'Door model', value: c.model, thumb: thumb(c.model) },
    { step: 'variants', label: 'Model variant', value: `${c.model} ${c.variant} — ${VAR_DESC[c.variant]}`, thumb: thumb(c.model, { variant: c.variant }) },
    { step: 'type', label: 'Type', value: T.label, thumb: getTypeThumb(T.id) },
    { step: 'systems', label: 'System', value: sys.name },
    { step: 'construction', label: 'Dimensions', value: `Door ${dm.W} x ${dm.H} mm · Overall ${dm.OW} x ${dm.OH} mm` },
    { step: 'construction', label: 'Panel', value: PANELS[c.panel] },
    T.o ? { step: 'construction', label: 'Overlight', value: c.overlight === 'tilt' ? 'Tilt opening' : 'Fixed' } : null,
    { step: 'construction', label: 'Opening direction', value: OPEN[c.opening] },
    { step: 'colours', label: 'Colour outside', value: co[c.colours.outside].name, sw: co[c.colours.outside].bg },
    { step: 'colours', label: 'Colour inside', value: co[c.colours.inside].name, sw: co[c.colours.inside].bg },
    { step: 'colours', label: 'Frame colour', value: co[c.colours.frame].name, sw: co[c.colours.frame].bg },
    { step: 'glass', label: 'Glass', value: gl.name, sw: gl.bg },
    { step: 'handles', label: 'Door handle', value: hd.code + (c.handleColour ? ` · RAL ${c.handleRal}` : '') },
    { step: 'handles', label: 'Inside handle', value: D.insideById[c.insideHandle].name },
    { step: 'accessories', label: 'Accessories', value: c.accessories.length ? c.accessories.join(', ') : 'None' },
    { step: 'locks', label: 'Lock', value: lk.name },
  ].filter(Boolean);
  return rows.map((x) => ({ ...x, sw: x.sw || '#F4F4F3', thumb: x.thumb || null }));
}

export function PrintPanel() {
  const { cfg, go } = useStore();
  return (
    <div style={{ padding: '8px var(--pp) 24px' }}>
      {summary(cfg).map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E4E5E6' }}>
          <span style={{ width: 48, height: 48, borderRadius: 4, background: r.sw, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', overflow: 'hidden' }}>{r.thumb}</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}><span style={muted}>{r.label}</span><span style={{ fontSize: 14, lineHeight: 1.35 }}>{r.value}</span></span>
          <button onClick={() => go(r.step)} aria-label={`Edit ${r.label}`} style={{ border: 0, background: 'none', padding: 6, font: 'inherit', fontSize: 14, fontWeight: 500, color: '#8C6A36', cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
        </div>
      ))}
    </div>
  );
}

export function PrintActions() {
  const { patch, enqStatus, doPrint } = useStore();
  return (
    <div style={{ flex: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '14px var(--pp)', borderTop: '1px solid #E4E5E6', background: '#fff' }}>
      <button onClick={() => patch({ modal: 'enquiry', enqStatus: enqStatus === 'sent' ? 'idle' : enqStatus })} className="hv-bggold"
        style={{ height: 48, border: 0, borderRadius: 4, background: G, color: '#fff', font: 'inherit', fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>Enquiry</button>
      <button onClick={doPrint} className="hv-grey"
        style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 0, borderRadius: 4, background: '#E9EAEB', color: TX, font: 'inherit', fontSize: 16, cursor: 'pointer' }}>Print</button>
    </div>
  );
}

/* ------------------------------------------------------------------ Save / load */
export function Save() {
  const { cfg, refCode, loadInput, loadError, patch, copy, loadCode } = useStore();
  const field = { border: '1px solid #C4C6C8', borderRadius: 4, color: TX, background: '#F7F7F7' };
  return (
    <div style={{ padding: 'var(--pp)', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <p style={{ margin: 0, lineHeight: 1.5 }}>Reference code represents current configuration. You can save this code if you want to load this configuration later.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label htmlFor="ref-code" style={{ fontSize: 14, fontWeight: 500 }}>Reference code:</label>
        <textarea id="ref-code" readOnly value={refCode} onFocus={(e) => e.target.select()} rows={3} placeholder="Press “Get a reference code”"
          style={{ ...field, width: '100%', padding: '10px 12px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, resize: 'none', wordBreak: 'break-all' }} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => patch({ refCode: enc(cfg) })} className="hv-bggold" style={{ ...goldBtn, display: 'block' }}>Get a reference code</button>
          {refCode && <button onClick={() => copy(refCode, 'Reference code copied')} className="hv-grey" style={greyBtn}><Ic n="copy" s={16} sw={2} />Copy</button>}
        </div>
        {refCode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={muted}>Select reference code. Then right click or press Ctrl+C.</span>
            <label htmlFor="share-url" style={{ fontSize: 14, fontWeight: 500, marginTop: 8 }}>Shareable link</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input id="share-url" readOnly value={shareUrl(refCode)} onFocus={(e) => e.target.select()} style={{ ...field, flex: 1, minWidth: 0, height: 40, padding: '0 10px', font: 'inherit', fontSize: 12 }} />
              <button onClick={() => copy(shareUrl(refCode), 'Link copied')} className="hv-grey" style={{ height: 40, padding: '0 14px', border: 0, borderRadius: 4, background: '#E9EAEB', color: TX, font: 'inherit', cursor: 'pointer' }}>Copy link</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <a href={`mailto:?subject=${encodeURIComponent('My Adorn door configuration ' + cfg.model + ' ' + cfg.variant)}&body=${encodeURIComponent('Reference code: ' + refCode + String.fromCharCode(10, 10) + 'Open it directly: ' + shareUrl(refCode))}`} className="hv-grey"
                style={{ ...greyBtn, height: 44, textDecoration: 'none', color: TX }}>Email me this code</a>
              {typeof navigator !== 'undefined' && navigator.share && (
                <button onClick={() => navigator.share({ title: 'Adorn door configuration', text: `${cfg.model} ${cfg.variant}`, url: shareUrl(refCode) }).catch(() => {})} className="hv-grey" style={greyBtn}>Share…</button>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{ height: 1, background: '#E4E5E6' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label htmlFor="load-code" style={{ fontSize: 14, fontWeight: 500 }}>Load configuration:</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="load-code" value={loadInput} onChange={(e) => patch({ loadInput: e.target.value, loadError: '' })} placeholder="Paste a reference code" aria-invalid={!!loadError}
            style={{ flex: 1, minWidth: 0, height: 44, border: `1px solid ${loadError ? ERR : '#C4C6C8'}`, borderRadius: 4, padding: '0 12px', font: 'inherit', fontSize: 14, color: TX }} />
          <button onClick={loadCode} className="hv-bggold" style={{ height: 44, padding: '0 20px', border: 0, borderRadius: 4, background: G, color: '#fff', font: 'inherit', fontWeight: 500, cursor: 'pointer' }}>Load</button>
        </div>
        {loadError && <span role="alert" style={{ fontSize: 12, color: ERR }}>{loadError}</span>}
      </div>
    </div>
  );
}
