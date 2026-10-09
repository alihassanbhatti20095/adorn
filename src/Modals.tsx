// @ts-nocheck
import React, { useEffect } from 'react';
import { D } from './data';
import { useStore } from './store';
import { Ic, G, TX } from './ui';

const ERR = '#C0392B';
const overlay = { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(43,45,47,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const dialog = (w) => ({ width: '100%', maxWidth: w, background: '#fff', borderRadius: 4, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 });
const h2 = { margin: 0, fontSize: 24, fontWeight: 500 };
const grey = { height: 44, padding: '0 20px', border: 0, borderRadius: 4, background: '#E9EAEB', color: TX, font: 'inherit', cursor: 'pointer' };
const gold = { height: 44, padding: '0 20px', border: 0, borderRadius: 4, background: G, color: '#fff', font: 'inherit', fontWeight: 500, cursor: 'pointer' };
const outlined = { height: 44, padding: '0 20px', border: '1px solid #2B2D2F', borderRadius: 4, background: '#fff', color: TX, font: 'inherit', cursor: 'pointer' };
const dark = { height: 44, padding: '0 20px', border: 0, borderRadius: 4, background: '#111214', color: '#fff', font: 'inherit', fontWeight: 500, cursor: 'pointer' };

function Overlay({ children, onClose }) {
  return <div onClick={onClose} style={overlay}>{children}</div>;
}
const stop = (e) => e.stopPropagation();

function ResetModal() {
  const { closeModal, confirmReset } = useStore();
  return (
    <Overlay onClose={closeModal}>
      <div role="dialog" aria-modal="true" aria-labelledby="reset-title" onClick={stop} style={dialog(440)}>
        <h2 id="reset-title" style={h2}>Reset configuration</h2>
        <p style={{ margin: 0, lineHeight: 1.5, color: '#45484B' }}>All your choices will be discarded and the default door restored. This can’t be undone unless you saved a reference code.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button onClick={closeModal} className="hv-grey" style={grey}>Cancel</button>
          <button onClick={confirmReset} className="hv-bggold" style={gold}>Reset</button>
        </div>
      </div>
    </Overlay>
  );
}

function CookieModal() {
  const { closeModal, ckA, ckM, patch, saveCookie } = useStore();
  const row = (label, desc, checked, onChange, disabled) => (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: disabled ? 'default' : 'pointer' }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} style={{ width: 18, height: 18, accentColor: G, margin: '2px 0 0' }} />
      <span><strong style={{ fontWeight: 500 }}>{label}</strong><br /><span style={{ fontSize: 12, color: '#5F6265' }}>{desc}</span></span>
    </label>
  );
  return (
    <Overlay onClose={closeModal}>
      <div role="dialog" aria-modal="true" aria-labelledby="ck-title" onClick={stop} style={dialog(460)}>
        <h2 id="ck-title" style={h2}>Cookie settings</h2>
        {row('Necessary', 'Remembers your configuration and consent. Always on.', true, () => {}, true)}
        {row('Analytics', 'Anonymous usage statistics.', ckA, () => patch({ ckA: !ckA }))}
        {row('Marketing', 'Personalised content on other sites.', ckM, () => patch({ ckM: !ckM }))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button onClick={() => saveCookie(ckA, ckM)} className="hv-tint" style={outlined}>Save settings</button>
          <button onClick={() => saveCookie(true, true)} style={dark}>Agree to all</button>
        </div>
      </div>
    </Overlay>
  );
}

function EnquiryModal() {
  const { closeModal, enq, enqErr, enqStatus, cfg, patch, submitEnq } = useStore();
  const code = `${cfg.model} ${cfg.variant}`;
  const set = (id) => (e) => patch({ enq: { ...useStore.getState().enq, [id]: e.target.value }, enqErr: { ...useStore.getState().enqErr, [id]: undefined } });
  const fields = [['name', 'Full name', 'text', 'name'], ['email', 'Email', 'email', 'email'], ['phone', 'Phone (optional)', 'tel', 'tel'], ['postcode', 'Postcode', 'text', 'postal-code']];
  return (
    <Overlay onClose={closeModal}>
      <div role="dialog" aria-modal="true" aria-labelledby="enq-title" onClick={stop} style={{ width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 64, flex: 'none', background: '#5A5D60', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 0 24px' }}>
          <h2 id="enq-title" style={h2}>Enquiry</h2>
          <button onClick={closeModal} aria-label="Close" style={{ width: 44, height: 44, border: 0, background: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ic n="x" /></button>
        </div>
        {enqStatus === 'sent' ? (
          <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <span style={{ width: 56, height: 56, borderRadius: '50%', background: G, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="check" s={28} sw={2.5} /></span>
            <h3 style={{ ...h2, margin: 0 }}>Thanks, we'll be in touch</h3>
            <p style={{ margin: 0, color: '#5F6265', maxWidth: 360, lineHeight: 1.5 }}>Your enquiry for {code} has been sent. An Adorn advisor will contact you shortly.</p>
            <button onClick={closeModal} style={{ ...gold, padding: '0 22px' }}>Close</button>
          </div>
        ) : (
          <form noValidate onSubmit={(e) => { e.preventDefault(); submitEnq(); }} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#F2E8D8', borderRadius: 4, fontSize: 14 }}>Configuration: <strong style={{ fontWeight: 500 }}>{code}</strong></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {fields.map(([id, label, type, auto]) => (
                <label key={id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
                  <input type={type} autoComplete={auto} value={enq[id]} onChange={set(id)} aria-invalid={!!enqErr[id]}
                    style={{ height: 44, border: `1px solid ${enqErr[id] ? ERR : '#C4C6C8'}`, borderRadius: 4, padding: '0 12px', font: 'inherit', fontSize: 14, color: TX }} />
                  {enqErr[id] && <span role="alert" style={{ fontSize: 12, color: ERR }}>{enqErr[id]}</span>}
                </label>
              ))}
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Preferred showroom</span>
              <select value={enq.showroom} onChange={set('showroom')} style={{ height: 44, border: '1px solid #C4C6C8', borderRadius: 4, padding: '0 10px', font: 'inherit', fontSize: 14, background: '#fff', color: TX }}>
                {D.SHOWROOMS.map((sr) => <option key={sr} value={sr}>{sr}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Message <span style={{ fontWeight: 400, color: '#5F6265' }}>(optional)</span></span>
              <textarea value={enq.message} onChange={set('message')} rows={4} style={{ border: '1px solid #C4C6C8', borderRadius: 4, padding: '10px 12px', font: 'inherit', fontSize: 14, color: TX, resize: 'vertical' }} />
            </label>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 14, lineHeight: 1.45 }}>
              <input type="checkbox" checked={enq.consent} onChange={() => patch({ enq: { ...enq, consent: !enq.consent }, enqErr: { ...enqErr, consent: undefined } })} aria-invalid={!!enqErr.consent} style={{ width: 18, height: 18, accentColor: G, margin: '2px 0 0', flex: 'none' }} />
              <span>I agree that Adorn Group Ltd may store my details to respond to this enquiry, as described in the <a href="#">data protection notice</a>.</span>
            </label>
            {enqErr.consent && <span role="alert" style={{ fontSize: 12, color: ERR, marginTop: -8 }}>{enqErr.consent}</span>}
            {enqStatus === 'error' && <span role="alert" style={{ fontSize: 14, color: ERR }}>Something went wrong sending your enquiry. Please try again.</span>}
            <button type="submit" disabled={enqStatus === 'sending'} className="hv-bggold" style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: 0, borderRadius: 4, background: G, color: '#fff', font: 'inherit', fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>
              {enqStatus === 'sending' ? 'Sending…' : 'Send enquiry'}
            </button>
          </form>
        )}
      </div>
    </Overlay>
  );
}

export default function Modals() {
  const { modal, enqStatus, closeModal } = useStore();
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && useStore.getState().modal && useStore.getState().enqStatus !== 'sending') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeModal]);
  if (modal === 'reset') return <ResetModal />;
  if (modal === 'cookies') return <CookieModal />;
  if (modal === 'enquiry') return <EnquiryModal />;
  return null;
}
