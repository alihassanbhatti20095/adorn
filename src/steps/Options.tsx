// @ts-nocheck
import React from 'react';
import { D } from '../data';
import { PANELS, OPEN, clamp } from '../lib/core';
import { openIcon } from '../lib/door';
import { useStore, dims } from '../store';
import { Badge, Ic, RadioDot, cardBtn, H2, muted, stripes, G, GT, DV, TX } from '../ui';

const ERR = '#C0392B';

/* ------------------------------------------------------------------ Construction */
function Dim({ k, label, min, max }) {
  const { cfg, setCfg } = useStore();
  const val = cfg[k], n = +val, bad = !(n >= min && n <= max), id = 'dim-' + k;
  const round = { width: 40, height: 40, flex: 'none', borderRadius: '50%', border: '1px solid #C4C6C8', background: '#fff', color: TX, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label htmlFor={id} style={{ fontSize: 14, fontWeight: 500 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => setCfg({ [k]: clamp((n || min) - 10, min, max) })} aria-label={`Decrease ${label}`} className="hv-gold hv-tint" style={round}><Ic n="minus" /></button>
        <div style={{ position: 'relative', flex: 1 }}>
          <input id={id} type="number" inputMode="numeric" value={val} onChange={(e) => setCfg({ [k]: e.target.value === '' ? '' : +e.target.value })} aria-invalid={bad}
            style={{ width: '100%', height: 44, border: `1px solid ${bad ? ERR : '#C4C6C8'}`, background: bad ? '#FDECEA' : '#fff', borderRadius: 4, padding: '0 44px 0 12px', font: 'inherit', fontSize: 16, color: TX }} />
          <span style={{ position: 'absolute', right: 12, top: 13, fontSize: 12, color: '#5F6265' }}>mm</span>
        </div>
        <button onClick={() => setCfg({ [k]: clamp((n || min) + 10, min, max) })} aria-label={`Increase ${label}`} className="hv-gold hv-tint" style={round}><Ic n="plus" /></button>
      </div>
      {bad && <span role="alert" style={{ fontSize: 12, color: ERR }}>{`Min ${min} / Max ${max} mm`}</span>}
      <input type="range" min={min} max={max} step="10" value={clamp(n || min, min, max)} onChange={(e) => setCfg({ [k]: +e.target.value })} aria-label={`${label} slider`} style={{ width: '100%', accentColor: G, margin: '4px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', ...muted }}><span>{min} mm</span><span>{max} mm</span></div>
    </div>
  );
}

function Segmented({ label, children, cols = 2 }) {
  return <div role="radiogroup" aria-label={label} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, border: '1px solid #C4C6C8', borderRadius: 4, overflow: 'hidden' }}>{children}</div>;
}

export function Construction() {
  const { cfg, setCfg } = useStore();
  const sys = D.systemById[cfg.system], T = D.typeById[cfg.type], dm = dims(cfg);
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h2 style={H2}>Choose dimension</h2>
        <Dim k="width" label="Door width" min={sys.minW} max={sys.maxW} />
        <Dim k="height" label="Door height" min={sys.minH} max={sys.maxH} />
        <div style={{ padding: '12px 14px', background: GT, borderRadius: 4, fontSize: 14 }}>Overall dimension: <strong style={{ fontWeight: 500 }}>{`${dm.OW} x ${dm.OH}`}</strong></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={H2}>Panel</h2>
        <Segmented label="Panel">
          {Object.keys(PANELS).map((id) => (
            <button key={id} role="radio" aria-checked={cfg.panel === id} onClick={() => setCfg({ panel: id })}
              style={{ minHeight: 56, padding: '10px 12px', border: 0, background: cfg.panel === id ? G : '#fff', color: cfg.panel === id ? '#fff' : TX, font: 'inherit', fontSize: 14, lineHeight: 1.3, textAlign: 'left', cursor: 'pointer' }}>{PANELS[id]}</button>
          ))}
        </Segmented>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={H2}>Overlight type</h2>
        <Segmented label="Overlight type">
          {[['fixed', 'Fixed'], ['tilt', 'Tilt opening']].map(([id, label]) => {
            const on = T.o && cfg.overlight === id;
            return (
              <button key={id} role="radio" aria-checked={on} disabled={!T.o} onClick={() => T.o && setCfg({ overlight: id })}
                style={{ height: 48, padding: '0 12px', border: 0, background: !T.o ? '#E9EAEB' : on ? G : '#fff', color: !T.o ? '#B5B7B9' : on ? '#fff' : TX, font: 'inherit', fontSize: 14, textAlign: 'left', cursor: T.o ? 'pointer' : 'not-allowed' }}>{label}</button>
            );
          })}
        </Segmented>
        {!T.o && <span style={muted}>Choose a type with an overlight to enable this option.</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={H2}>Opening direction</h2>
        <div role="radiogroup" aria-label="Opening direction" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {Object.keys(OPEN).map((id) => {
            const sel = cfg.opening === id;
            return (
              <button key={id} role="radio" aria-checked={sel} onClick={() => setCfg({ opening: id })} className="hv-gold"
                style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: `1px solid ${sel ? G : DV}`, borderRadius: 4, background: '#fff', font: 'inherit', fontSize: 14, color: TX, cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ width: 44, height: 44, flex: 'none', color: '#5A5D60' }}>{openIcon(id)}</span>
                <span>{OPEN[id]}</span>
                {sel && <Badge size={20} icon={12} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Colours */
function Swatch({ col, sel, onPick, wrapName }) {
  const title = col.label ? `${col.name} ${col.label}` : col.name;
  return (
    <button onClick={onPick} title={title} aria-label={title} aria-pressed={sel}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 0, padding: '4px 0', cursor: 'pointer', font: 'inherit', color: TX, minWidth: 0 }}>
      <span style={{ position: 'relative', width: 56, height: 56, borderRadius: 4, background: col.bg, boxShadow: `0 0 0 1px rgba(0,0,0,.14), 0 0 0 ${sel ? 3 : 0}px #fff, 0 0 0 ${sel ? 5 : 0}px ${G}` }}>
        {sel && (
          <span aria-hidden="true" style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: G, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
            <Ic n="check" s={12} sw={3} />
          </span>
        )}
      </span>
      <span style={{ fontSize: 12, lineHeight: 1.25, textAlign: 'center', ...(wrapName ? { maxWidth: 76, overflowWrap: 'anywhere' } : {}) }}>{col.name}</span>
    </button>
  );
}
const swatchGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '14px 8px' };

export function Colours() {
  const { cfg, setCfg, colourTab, ralQ, patch } = useStore();
  const curId = cfg.colours[colourTab], cur = D.colourById[curId];
  const pick = (col) => setCfg({ colours: Object.assign({}, cfg.colours, { [colourTab]: col.id }) });
  const q = ralQ.trim().toLowerCase().replace(/^ral\s*/, '');
  const ral = D.RAL.filter((x) => !q || x.code.includes(q) || x.label.toLowerCase().includes(q));
  const groups = [['Recommended', D.RECOMMENDED], ['Finishes', D.FINISHES], ['Woodgrain', D.WOODGRAIN]];
  return (
    <div>
      <div role="tablist" aria-label="Colour surface" style={{ position: 'sticky', top: 0, zIndex: 2, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: '#fff', borderBottom: '1px solid #E4E5E6' }}>
        {[['outside', 'Outside'], ['inside', 'Inside'], ['frame', 'Frame']].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={colourTab === id} onClick={() => patch({ colourTab: id })} className="hv-tint"
            style={{ height: 52, border: 0, borderBottom: `3px solid ${colourTab === id ? G : 'transparent'}`, background: '#fff', font: 'inherit', fontSize: 14, fontWeight: colourTab === id ? 500 : 400, color: TX, cursor: 'pointer' }}>{label}</button>
        ))}
      </div>
      <div style={{ padding: '16px 24px 0', ...muted }}>Selected: <strong style={{ color: TX, fontWeight: 500 }}>{cur.name + (cur.label ? ' ' + cur.label : '')}</strong></div>
      {groups.map(([name, items]) => (
        <div key={name} style={{ padding: '18px 24px 6px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={H2}>{name}</h2>
          <div style={swatchGrid}>{items.map((c) => <Swatch key={c.id} col={c} sel={c.id === curId} onPick={() => pick(c)} wrapName />)}</div>
        </div>
      ))}
      <div style={{ padding: '18px 24px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={H2}>Full RAL Classic</h2>
        <label style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 12, color: '#5F6265', display: 'flex' }}><Ic n="search" s={18} sw={2} /></span>
          <input type="search" value={ralQ} onChange={(e) => patch({ ralQ: e.target.value })} placeholder="Search RAL code or name, e.g. 7016" aria-label="Search RAL code"
            style={{ width: '100%', height: 44, border: '1px solid #C4C6C8', borderRadius: 4, padding: '0 12px 0 38px', font: 'inherit', fontSize: 14, color: TX }} />
        </label>
        {!ral.length && <span style={{ fontSize: 14, color: '#5F6265' }}>No RAL colours match.</span>}
        <div style={swatchGrid}>{ral.map((c) => <Swatch key={c.id} col={c} sel={c.id === curId} onPick={() => pick(c)} />)}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Glass */
export function Glass() {
  const { cfg, setCfg } = useStore();
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {D.GLASS_GROUPS.map((g) => (
        <div key={g.name} role="radiogroup" aria-label={g.name} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={H2}>{g.name}</h2>
          {g.items.map((x) => {
            const sel = x.id === cfg.glass;
            return (
              <button key={x.id} role="radio" aria-checked={sel} onClick={() => setCfg({ glass: x.id })} className="hv-gold"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', border: `1px solid ${sel ? G : DV}`, borderRadius: 4, background: '#fff', font: 'inherit', color: TX, cursor: 'pointer', textAlign: 'left' }}>
                <RadioDot on={sel} />
                <span style={{ width: 52, height: 52, flex: 'none', borderRadius: 4, background: x.bg, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 14, fontWeight: 500 }}>{x.name}</span><span style={muted}>{x.desc}</span></span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Handles */
function Accordion({ label, open, onToggle, children }) {
  return (
    <>
      <button onClick={onToggle} aria-expanded={open} className="hv-bggold"
        style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', border: 0, borderRadius: 4, background: G, color: '#fff', font: 'inherit', fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>
        {label}
        <span style={{ display: 'flex', transform: `rotate(${open ? 180 : 0}deg)`, transition: 'transform .2s' }}><Ic n="chevD" /></span>
      </button>
      {open && children}
    </>
  );
}

export function Handles() {
  const { cfg, setCfg, acc, patch } = useStore();
  const ral = D.ralByCode[cfg.handleRal];
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Accordion label="Door handles" open={acc.handles} onToggle={() => patch({ acc: Object.assign({}, acc, { handles: !acc.handles }) })}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0 10px' }}>
          {D.HANDLES.map((f) => (
            <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14, padding: 14, border: '1px solid #E4E5E6', borderRadius: 4 }}>
              <div style={{ height: 150, borderRadius: 2, background: stripes, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: f.w / 2.2, height: 110, background: cfg.handleColour ? ral.hex : f.black ? '#1c1c1d' : 'linear-gradient(90deg, #8d9195, #eceef0 45%, #9a9ea1)', borderRadius: f.profile === 'round' ? 8 : 2 }} />
              </div>
              <div role="radiogroup" aria-label={`${f.name} length`} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 500 }}>{f.name}</span>
                <span style={{ fontSize: 12, lineHeight: 1.45, color: '#5F6265' }}>{f.spec}</span>
                {f.options.map((o) => (
                  <button key={o.id} role="radio" aria-checked={o.id === cfg.handle} onClick={() => setCfg({ handle: o.id })}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 32, padding: '2px 0', border: 0, background: 'none', font: 'inherit', fontSize: 14, color: TX, cursor: 'pointer', textAlign: 'left' }}>
                    <RadioDot on={o.id === cfg.handle} size={18} dot={8} />{o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, border: '1px solid #E4E5E6', borderRadius: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
              <input type="checkbox" checked={cfg.handleColour} onChange={() => setCfg({ handleColour: !cfg.handleColour })} style={{ width: 18, height: 18, accentColor: G, margin: 0 }} />Colour
            </label>
            <span style={muted}>Powder-coat the outside handle in a RAL colour instead of stainless steel.</span>
            {cfg.handleColour && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 40, height: 40, flex: 'none', borderRadius: 4, background: ral.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)' }} />
                <select value={cfg.handleRal} onChange={(e) => setCfg({ handleRal: e.target.value })} aria-label="Handle RAL colour"
                  style={{ flex: 1, height: 40, border: '1px solid #C4C6C8', borderRadius: 4, padding: '0 10px', font: 'inherit', fontSize: 14, background: '#fff', color: TX }}>
                  {D.RAL.map((x) => <option key={x.code} value={x.code}>{`RAL ${x.code} ${x.label}`}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </Accordion>
      <Accordion label="Inside handle" open={acc.inside} onToggle={() => patch({ acc: Object.assign({}, acc, { inside: !acc.inside }) })}>
        <div role="radiogroup" aria-label="Inside handle" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
          {D.INSIDE_HANDLES.map((o) => {
            const sel = o.id === cfg.insideHandle;
            return (
              <button key={o.id} role="radio" aria-checked={sel} onClick={() => setCfg({ insideHandle: o.id })} className="hv-gold"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: `1px solid ${sel ? G : DV}`, borderRadius: 4, background: '#fff', font: 'inherit', fontSize: 14, color: TX, cursor: 'pointer', textAlign: 'left' }}>
                <RadioDot on={sel} size={18} dot={8} />{o.name}
              </button>
            );
          })}
        </div>
      </Accordion>
    </div>
  );
}

/* ------------------------------------------------------------------ Accessories */
const FC = { B: 'linear-gradient(90deg, #a6a9ac, #dfe1e3, #a6a9ac)', P: 'linear-gradient(90deg, #c9ccce, #fbfbfb, #c9ccce)', C: '#1d1d1e' };
const shape = (code) => (code.startsWith('JZ') ? [code.includes('10') ? 54 : 44, 30, 2] : code.startsWith('PZ') ? [64, 18, 2] : code.startsWith('OZ') ? [18, 18, '50%'] : [26, 26, '50%']);

export function Accessories() {
  const { cfg, setCfg } = useStore();
  const none = !cfg.accessories.length;
  const card = (code, name, sel, pick, sh, bg) => (
    <button key={code} onClick={pick} aria-pressed={sel} className="hv-gold" style={cardBtn(sel, { textAlign: 'left' })}>
      <span style={{ height: 76, borderRadius: 2, background: stripes, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {sh && <span style={{ width: sh[0], height: sh[1], borderRadius: sh[2], background: bg }} />}
      </span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{code}</span>
      <span style={{ fontSize: 12, lineHeight: 1.3, color: '#5F6265' }}>{name}</span>
      {sel && <Badge />}
    </button>
  );
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, ...muted }}>Select any number of accessories.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
        {card('None', 'No accessories', none, () => setCfg({ accessories: [] }), null, null)}
        {D.ACCESSORIES.map((a) => {
          const sel = cfg.accessories.includes(a.code);
          return card(a.code, `${a.name}, ${a.finish}`, sel, () => setCfg({ accessories: sel ? cfg.accessories.filter((x) => x !== a.code) : cfg.accessories.concat(a.code) }), shape(a.code), FC[a.f]);
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Locks */
export function Locks() {
  const { cfg, setCfg, lockOpen, patch } = useStore();
  return (
    <div role="radiogroup" aria-label="Lock" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {D.LOCKS.map((x) => {
        const sel = x.id === cfg.lock, open = !!lockOpen[x.id];
        return (
          <div key={x.id} style={{ border: `1px solid ${sel ? G : DV}`, borderRadius: 4, background: '#fff' }}>
            <button role="radio" aria-checked={sel} onClick={() => setCfg({ lock: x.id })}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: 0, background: 'none', font: 'inherit', color: TX, cursor: 'pointer', textAlign: 'left' }}>
              <RadioDot on={sel} />
              <span style={{ width: 60, height: 60, flex: 'none', borderRadius: 2, background: stripes, display: 'flex', alignItems: 'flex-end', padding: 4, fontSize: 10, color: '#5F6265' }}>Photo</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}><span style={{ fontSize: 14, fontWeight: 500 }}>{x.name}</span><span style={muted}>{x.desc}</span></span>
            </button>
            <div style={{ padding: '0 12px 10px 44px' }}>
              <button onClick={() => patch({ lockOpen: Object.assign({}, lockOpen, { [x.id]: !open }) })} aria-expanded={open}
                style={{ display: 'flex', alignItems: 'center', gap: 4, border: 0, background: 'none', padding: '4px 0', font: 'inherit', fontSize: 12, fontWeight: 500, color: '#8C6A36', cursor: 'pointer' }}>
                {`Included items (${x.items.length})`}
                <span style={{ display: 'flex', transform: `rotate(${open ? 180 : 0}deg)`, transition: 'transform .2s' }}><Ic n="chevD" s={16} sw={2} /></span>
              </button>
              {open && <ul style={{ margin: '4px 0 0', padding: '0 0 0 18px', fontSize: 12, lineHeight: 1.6, color: '#5F6265' }}>{x.items.map((it) => <li key={it}>{it}</li>)}</ul>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
