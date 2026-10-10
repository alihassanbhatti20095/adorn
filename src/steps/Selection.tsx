// @ts-nocheck
import React from 'react';
import { D } from '../data';
import { VAR_DESC } from '../lib/core';
import { typeThumb } from '../lib/door';
import { useStore, thumb, door } from '../store';
import { Badge, Ic, cardBtn, H2, muted, G, DV, TX } from '../ui';

const typeThumbs = {};
D.TYPES.forEach((t) => { typeThumbs[t.id] = typeThumb(t); });
export const getTypeThumb = (id) => typeThumbs[id];

function ModelCard({ code, sel, onPick }) {
  return (
    <button onClick={onPick} aria-pressed={sel} className="hv-gold" style={cardBtn(sel)}>
      <span style={{ height: 130, background: '#F4F4F3', borderRadius: 2, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingTop: 6 }}>{thumb(code)}</span>
      <span style={{ fontSize: 14, textAlign: 'center' }}>{code}</span>
      {sel && <Badge />}
    </button>
  );
}

export function Reset() {
  const patch = useStore((s) => s.patch);
  return (
    <div style={{ padding: 'var(--pp)', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <p style={{ margin: 0, lineHeight: 1.5 }}>Discard every choice and start again from the default door: AL1 88E A, single door, 1100 x 2100 mm.</p>
      <button onClick={() => patch({ modal: 'reset' })} className="hv-bggold" style={{ height: 44, padding: '0 20px', border: 0, borderRadius: 4, background: G, color: '#fff', font: 'inherit', fontWeight: 500, cursor: 'pointer' }}>Reset configuration</button>
    </div>
  );
}

export function Search() {
  const { searchQ, cfg, patch, setCfg, go } = useStore();
  const q = searchQ.trim().toLowerCase().replace(/\s+/g, '');
  const res = q.length >= 2 ? D.MODELS.filter((m) => m.code.toLowerCase().replace(/\s+/g, '').includes(q)) : [];
  return (
    <div style={{ padding: 'var(--pp)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Search model</span>
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 12, color: '#5F6265', display: 'flex' }}><Ic n="search" s={18} sw={2} /></span>
          <input type="search" value={searchQ} onChange={(e) => patch({ searchQ: e.target.value })} placeholder="e.g. AL1 or 88E" aria-describedby="search-help"
            style={{ width: '100%', height: 44, border: '1px solid #C4C6C8', borderRadius: 4, padding: '0 12px 0 38px', font: 'inherit', fontSize: 14, color: TX }} />
        </span>
        <span id="search-help" style={muted}>Please enter at least 2 characters.</span>
      </label>
      {q.length >= 2 && !res.length && <div style={{ padding: '32px 16px', border: '1px dashed #C4C6C8', borderRadius: 4, textAlign: 'center', color: '#5F6265' }}>No models found</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
        {res.map((m) => <ModelCard key={m.code} code={m.code} sel={m.code === cfg.model} onPick={() => { setCfg({ model: m.code }); go('variants'); }} />)}
      </div>
    </div>
  );
}

export function TypeStep() {
  const { cfg, setCfg } = useStore();
  const R = D.RULES.models[cfg.model];
  return (
    <div style={{ padding: 'var(--pp)', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
      {D.TYPES.map((t) => {
        const ok = R.types.includes(t.id), sel = t.id === cfg.type;
        return (
          <button key={t.id} onClick={() => ok && setCfg({ type: t.id })} disabled={!ok} aria-pressed={sel} className={ok ? 'hv-gold' : ''}
            title={ok ? t.label : `${t.label} — not available for ${cfg.model}`}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, padding: 10, border: `1px solid ${sel ? G : DV}`, borderRadius: 4, background: ok ? '#fff' : '#E9EAEB', color: ok ? TX : '#B5B7B9', font: 'inherit', fontSize: 14, cursor: ok ? 'pointer' : 'not-allowed', textAlign: 'left' }}>
            <span style={{ height: 100, background: ok ? '#F4F4F3' : '#E9EAEB', opacity: ok ? 1 : 0.45, borderRadius: 2, display: 'block' }}>{typeThumbs[t.id]}</span>
            <span style={{ lineHeight: 1.3 }}>{t.label}</span>
            {sel && <Badge />}
          </button>
        );
      })}
    </div>
  );
}

const ORNAMENT = ['grid', 'porthole', 'window', 'steps'];
const FILTERS = [['all', 'All', () => true], ['glass', 'Glass', (m) => m.glass], ['solid', 'Solid', (m) => !m.glass], ['ornament', 'Ornament', (m) => m.glass && ORNAMENT.includes(m.pattern)]];

export function ModelStep() {
  const { cfg, setCfg, modelFilter, patch } = useStore();
  const test = FILTERS.find((f) => f[0] === modelFilter)[2];
  const groups = [{ name: 'GLASS', items: D.MODELS.filter((m) => m.glass && test(m)) }, { name: 'WITHOUT GLASS', items: D.MODELS.filter((m) => !m.glass && test(m)) }].filter((g) => g.items.length);
  return (
    <>
      <div role="group" aria-label="Filter models" className="adorn-rail" style={{ position: 'sticky', top: 0, zIndex: 3, display: 'flex', gap: 8, padding: '10px var(--pp)', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #E4E5E6' }}>
        {FILTERS.map(([id, label, fn]) => {
          const on = modelFilter === id;
          return (
            <button key={id} aria-pressed={on} onClick={() => patch({ modelFilter: id })} className={on ? 'hv-bggold' : 'hv-tint'}
              style={{ flex: 'none', height: 40, padding: '0 16px', border: `1px solid ${on ? G : '#C4C6C8'}`, borderRadius: 999, background: on ? G : '#fff', color: on ? '#fff' : TX, font: 'inherit', fontSize: 14, fontWeight: on ? 500 : 400, cursor: 'pointer' }}>
              {label}<span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>{D.MODELS.filter(fn).length}</span>
            </button>
          );
        })}
      </div>
      {groups.map((g) => (
        <div key={g.name}>
          <h2 style={{ position: 'sticky', top: 60, zIndex: 2, margin: 0, padding: '14px var(--pp)', background: '#fff', borderBottom: '1px solid #E4E5E6', fontSize: 18, fontWeight: 500, letterSpacing: '0.04em' }}>{g.name}</h2>
          <div style={{ padding: '16px var(--pp) 24px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
            {g.items.map((m) => <ModelCard key={m.code} code={m.code} sel={m.code === cfg.model} onPick={() => setCfg({ model: m.code })} />)}
          </div>
        </div>
      ))}
      {!groups.length && <div style={{ margin: 'var(--pp)', padding: '32px 16px', border: '1px dashed #C4C6C8', borderRadius: 4, textAlign: 'center', color: '#5F6265' }}>No models match this filter.</div>}
    </>
  );
}

export function Variants() {
  const { cfg, setCfg } = useStore();
  const R = D.RULES.models[cfg.model];
  if (!R.variants.length) return <div style={{ margin: 'var(--pp)', padding: '32px 16px', border: '1px dashed #C4C6C8', borderRadius: 4, textAlign: 'center', color: '#5F6265' }}>This model has no variants.</div>;
  return (
    <div style={{ padding: 'var(--pp)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={H2}>External and internal variations</h2>
      {R.variants.map((x) => {
        const vc = Object.assign({}, cfg, { variant: x }), sel = x === cfg.variant;
        const pane = (label, el) => (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ height: 170, background: '#F4F4F3', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingTop: 6 }}>{el}</span>
            <span style={muted}>{label}</span>
          </span>
        );
        return (
          <button key={x} onClick={() => setCfg({ variant: x })} aria-pressed={sel} className="hv-gold"
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10, padding: 12, border: `1px solid ${sel ? G : DV}`, borderRadius: 4, background: '#fff', font: 'inherit', color: TX, cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {pane('Outside', door(vc, 'outside', { pad: 40 }).el)}
              {pane('Inside', door(vc, 'inside', { pad: 40 }).el)}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 500 }}>{`${cfg.model} ${x}`}</span>
              <span style={muted}>{VAR_DESC[x]}</span>
            </span>
            {sel && <Badge />}
          </button>
        );
      })}
    </div>
  );
}

export function Systems() {
  const { cfg, setCfg, sysOpen, patch } = useStore();
  const R = D.RULES.models[cfg.model];
  return (
    <div role="radiogroup" aria-label="System" style={{ padding: 'var(--pp)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {D.SYSTEMS.map((x) => {
        const ok = R.systems.includes(x.id), sel = x.id === cfg.system, open = !!sysOpen[x.id];
        return (
          <div key={x.id} style={{ position: 'relative', border: `1px solid ${sel ? G : DV}`, borderRadius: 4, background: ok ? '#fff' : '#E9EAEB', opacity: ok ? 1 : 0.55 }}>
            <button role="radio" aria-checked={sel} disabled={!ok} onClick={() => ok && setCfg({ system: x.id })}
              style={{ width: '100%', display: 'grid', gridTemplateColumns: '96px 1fr', gap: 14, alignItems: 'center', padding: 12, border: 0, background: 'transparent', font: 'inherit', color: TX, textAlign: 'left', cursor: ok ? 'pointer' : 'not-allowed' }}>
              <span style={{ height: 96, borderRadius: 2, background: 'repeating-linear-gradient(135deg, #EEEFEF 0 6px, #E4E5E6 6px 12px)', display: 'flex', alignItems: 'flex-end', padding: 6, fontSize: 11, color: '#5F6265' }}>Cross-section</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 500 }}>{x.name}</span>
                <span style={muted}>Basic depth {x.depth} · {x.uValue}</span>
                <span style={muted}>{`Width ${x.minW}–${x.maxW} mm · Height ${x.minH}–${x.maxH} mm`}</span>
                {!ok && <span style={muted}>Not available for this model</span>}
              </span>
            </button>
            <div style={{ padding: '0 12px 12px 122px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
              <button onClick={() => patch({ sysOpen: Object.assign({}, sysOpen, { [x.id]: !open }) })} aria-expanded={open}
                style={{ display: 'flex', alignItems: 'center', gap: 4, border: 0, background: 'none', padding: '4px 0', font: 'inherit', fontSize: 14, fontWeight: 500, color: '#8C6A36', cursor: 'pointer' }}>
                {open ? 'Less' : 'More'}
                <span style={{ display: 'flex', transform: `rotate(${open ? 180 : 0}deg)`, transition: 'transform .2s' }}><Ic n="chevD" s={16} sw={2} /></span>
              </button>
              {open && <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#5F6265' }}>{x.desc}</p>}
            </div>
            {sel && <Badge top={8} right={8} />}
          </div>
        );
      })}
    </div>
  );
}
