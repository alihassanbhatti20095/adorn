// @ts-nocheck
// Panel for the 3D house step. The three.js engine lives in ../House3D (lazy loaded), this file stays light.
import React from 'react';
import { useStore } from '../store';
import { Ic, Badge, H2, muted, goldBtn, greyBtn, G, DV, TX } from '../ui';

export const WALLS = { brick: ['Red brick', '#9C4A38'], white: ['White render', '#ECE9E2'], grey: ['Grey render', '#B3B6B8'], stone: ['Cream stone', '#D9CDB0'] };
export const ROOFS = { slate: ['Slate', '#3A3F46'], terracotta: ['Terracotta', '#A4502F'], graphite: ['Graphite', '#262A2E'] };

const chip = (on) => ({ position: 'relative', minHeight: 64, display: 'flex', alignItems: 'center', gap: 10, padding: 8, border: `1px solid ${on ? G : DV}`, borderRadius: 8, background: '#fff', color: TX, font: 'inherit', fontSize: 14, textAlign: 'left', cursor: 'pointer' });

export function View3D() {
  const { scene3d, patch, night, doorOpen, h3, showToast } = useStore();
  const set = (p) => patch({ scene3d: { ...scene3d, ...p } });
  const save = async () => {
    if (!h3) return;
    const url = h3.snapshot();
    try {
      const blob = await (await fetch(url)).blob();
      const f = new File([blob], 'adorn-3d-view.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'My Adorn door' }); return; }
    } catch { /* fall through to download */ }
    const a = document.createElement('a'); a.href = url; a.download = 'adorn-3d-view.jpg'; a.click(); showToast('Picture saved');
  };
  return (
    <div style={{ padding: 'var(--pp)', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <p style={{ margin: 0, lineHeight: 1.5 }}>Your door on a British street. Drag to look around, pinch or scroll to zoom. Press Open door and a resident walks up the path to let themselves in.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={() => patch({ doorOpen: !doorOpen })} aria-pressed={doorOpen} className="hv-tint" style={{ ...greyBtn, height: 48, justifyContent: 'center', background: doorOpen ? '#F2E8D8' : '#E9EAEB' }}><Ic n="doorOpen" s={20} />{doorOpen ? 'Close door' : 'Open door'}</button>
        <button onClick={() => patch({ night: !night })} aria-pressed={night} className="hv-tint" style={{ ...greyBtn, height: 48, justifyContent: 'center', background: night ? '#F2E8D8' : '#E9EAEB' }}><Ic n={night ? 'sun' : 'moon'} s={20} />{night ? 'Daytime' : 'Night time'}</button>
      </div>
      <button onClick={() => set({ person: !scene3d.person })} aria-pressed={scene3d.person} className="hv-tint" style={{ ...greyBtn, height: 48, justifyContent: 'center', background: scene3d.person ? '#F2E8D8' : '#E9EAEB' }}>{scene3d.person ? 'Person opens the door: on' : 'Person opens the door: off'}</button>
      <div>
        <h2 style={{ ...H2, marginBottom: 10 }}>Walls</h2>
        <div role="radiogroup" aria-label="Wall finish" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {Object.entries(WALLS).map(([id, [label, hex]]) => (
            <button key={id} role="radio" aria-checked={scene3d.wall === id} onClick={() => set({ wall: id })} className="hv-gold" style={chip(scene3d.wall === id)}>
              <span style={{ width: 40, height: 40, flex: 'none', borderRadius: 6, background: hex, border: '1px solid rgba(0,0,0,.15)' }} />{label}{scene3d.wall === id && <Badge size={20} top={4} right={4} icon={12} />}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h2 style={{ ...H2, marginBottom: 10 }}>Roof</h2>
        <div role="radiogroup" aria-label="Roof colour" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {Object.entries(ROOFS).map(([id, [label, hex]]) => (
            <button key={id} role="radio" aria-checked={scene3d.roof === id} onClick={() => set({ roof: id })} className="hv-gold" style={{ ...chip(scene3d.roof === id), flexDirection: 'column', justifyContent: 'center', gap: 6, fontSize: 13 }}>
              <span style={{ width: 36, height: 24, borderRadius: 4, background: hex }} />{label}
            </button>
          ))}
        </div>
      </div>
      <button onClick={save} disabled={!h3} className="hv-bggold" style={{ ...goldBtn, height: 48, justifyContent: 'center' }}><Ic n="download" s={18} sw={2} />Save or share this view</button>
      <span style={muted}>The house is an illustration to show your door in context. Real surroundings will differ.</span>
    </div>
  );
}
