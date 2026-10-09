// @ts-nocheck
import React from 'react';
import { ICONS, G, GT, TX, DV } from './lib/core';

/** SVG icon from the shared path table. */
export function Ic({ n, s = 22, sw = 1.75 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {ICONS[n].map((e, i) =>
        e[0] === 'p' ? <path key={i} d={e[1]} /> : e[0] === 'c' ? <circle key={i} cx={e[1]} cy={e[2]} r={e[3]} /> : <rect key={i} x={e[1]} y={e[2]} width={e[3]} height={e[4]} rx={e[5] || 0} />
      )}
    </svg>
  );
}

/** Gold circular check badge, top-right of a selected card. */
export function Badge({ size = 24, top = 6, right = 6, icon = 14 }) {
  return (
    <span aria-hidden="true" style={{ position: 'absolute', top, right, width: size, height: size, borderRadius: '50%', background: G, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Ic n="check" s={icon} sw={3} />
    </span>
  );
}

export function RadioDot({ on, size = 20, dot = 10 }) {
  return (
    <span style={{ width: size, height: size, flex: 'none', borderRadius: '50%', border: `2px solid ${on ? G : '#8E9194'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ width: dot, height: dot, borderRadius: '50%', background: on ? G : 'transparent' }} />
    </span>
  );
}

export const cardBtn = (sel, extra = {}) => ({
  position: 'relative', display: 'flex', flexDirection: 'column', gap: 6, padding: 8, border: `1px solid ${sel ? G : DV}`, borderRadius: 4,
  background: '#fff', font: 'inherit', color: TX, cursor: 'pointer', ...extra,
});

export const H2 = { margin: 0, fontSize: 18, fontWeight: 500 };
export const goldBtn = { height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', border: 0, borderRadius: 4, background: G, color: '#fff', font: 'inherit', fontWeight: 500, cursor: 'pointer' };
export const greyBtn = { height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', border: 0, borderRadius: 4, background: '#E9EAEB', color: TX, font: 'inherit', cursor: 'pointer' };
export const muted = { fontSize: 12, color: '#5F6265' };
export const stripes = 'repeating-linear-gradient(135deg, #EEEFEF 0 6px, #E4E5E6 6px 12px)';
export { G, GT, TX, DV };
