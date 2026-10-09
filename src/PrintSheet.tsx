// @ts-nocheck
import React from 'react';
import qrcode from 'qrcode-generator';
import { enc } from './lib/core';
import { useStore, door, shareUrl } from './store';
import { summary } from './steps/Tools';

const exact = { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' };

export default function PrintSheet() {
  const { cfg, refCode, printing } = useStore();
  if (!printing) return null;
  const code = refCode || enc(cfg);
  let qr = '';
  try { const q = qrcode(0, 'L'); q.addData(shareUrl(code)); q.make(); qr = q.createSvgTag({ cellSize: 2, margin: 0, scalable: true }); } catch { /* QR is optional */ }
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const view = (el, label) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2mm' }}>
      <div style={{ height: '95mm', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', background: '#F4F4F3', ...exact }}>{el}</div>
      <span style={{ fontSize: '9pt', color: '#5F6265' }}>{label}</span>
    </div>
  );
  return (
    <div id="adorn-print" style={{ fontFamily: 'Roboto, sans-serif', color: '#2B2D2F', fontSize: '11pt' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '2px solid #B8925A' }}>
        <img src="/adorn-logo.jpg" alt="Adorn" style={{ height: '22mm', width: 'auto' }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16pt', fontWeight: 500 }}>{`${cfg.model} ${cfg.variant}`}</div>
          <div style={{ fontSize: '9pt', color: '#5F6265' }}>Door configuration · {date}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8mm', margin: '6mm 0' }}>
        {view(door(cfg, 'outside', { pad: 40 }).el, 'Outside view')}
        {view(door(cfg, 'inside', { pad: 40 }).el, 'Inside view')}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
        <tbody>
          {summary(cfg).map((r, i) => (
            <tr key={i}>
              <td style={{ padding: '1.6mm 0', borderBottom: '1px solid #E4E5E6', color: '#5F6265', width: '42mm' }}>{r.label}</td>
              <td style={{ padding: '1.6mm 0', borderBottom: '1px solid #E4E5E6' }}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: '8mm', alignItems: 'flex-start', marginTop: '6mm' }}>
        <div style={{ width: '32mm', height: '32mm', flex: 'none' }} dangerouslySetInnerHTML={{ __html: qr }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2mm', minWidth: 0 }}>
          <span style={{ fontSize: '10pt', fontWeight: 500 }}>Reference code</span>
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '7pt', wordBreak: 'break-all', color: '#45484B' }}>{code}</span>
          <span style={{ fontSize: '9pt', color: '#5F6265' }}>Scan the code or load the reference in the configurator under Save / load.</span>
        </div>
      </div>
    </div>
  );
}
