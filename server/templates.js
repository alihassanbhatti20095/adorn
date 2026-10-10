// Branded email templates (HTML + plain text) for the staff notification and the customer copy.
// Table layout with inline styles only, so it renders in Gmail, Outlook and mobile clients.
const GOLD = '#B8925A', TINT = '#F2E8D8', SLATE = '#5A5D60', INK = '#2B2D2F', MUTED = '#5F6265', LINE = '#E4E5E6', PANEL = '#F4F4F3';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

const FONT = "Roboto,'Helvetica Neue',Arial,sans-serif";

export function shareLink(siteUrl, reference) {
  // reference is base64url; refuse anything else so it can never break out of an attribute
  return siteUrl && /^[A-Za-z0-9_-]+$/.test(reference || '') ? `${siteUrl}/?config=${reference}#/save` : '';
}

const row = (a, b, i) => `<tr><td style="padding:9px 12px;font:13px ${FONT};color:${MUTED};width:38%;vertical-align:top;background:${i % 2 ? '#FFFFFF' : PANEL}">${esc(a)}</td><td style="padding:9px 12px;font:14px ${FONT};color:${INK};vertical-align:top;background:${i % 2 ? '#FFFFFF' : PANEL}">${esc(b)}</td></tr>`;
const table = (rows) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${LINE}">${rows.map((r, i) => row(r[0], r[1], i)).join('')}</table>`;
const h3 = (t) => `<tr><td style="padding:26px 32px 10px;font:500 13px ${FONT};letter-spacing:.08em;text-transform:uppercase;color:${GOLD}">${esc(t)}</td></tr>`;

function details(rec) {
  return [['Name', rec.name], ['Email', rec.email], ['Phone', rec.phone || '-'], ['Postcode', rec.postcode], ['Showroom', rec.showroom]];
}

/**
 * kind: 'staff' (to Adorn) or 'customer' (copy to the person who enquired)
 * ctx:  { siteUrl, images: {outside, inside} booleans, date }
 */
export function renderEmail(rec, kind, ctx) {
  const staff = kind === 'staff';
  const first = rec.name.split(/\s+/)[0] || rec.name;
  const link = shareLink(ctx.siteUrl, rec.reference);
  const title = staff ? 'New configurator enquiry' : `Thank you, ${first}`;
  const intro = staff
    ? `${rec.name} has sent an enquiry from the door configurator. The customer's copy is attached as a PDF.`
    : 'We have received your enquiry and one of our advisors will be in touch shortly. A copy of your enquiry and door configuration is below, and attached as a PDF for your records.';

  const hasImg = ctx.images.outside || ctx.images.inside;
  const imgCell = (cid, label) => `<td width="50%" style="padding:0 6px;text-align:center;vertical-align:bottom"><div style="background:${PANEL};padding:10px 0"><img src="cid:${cid}" alt="${esc(label)}" style="max-width:100%;height:auto;display:inline-block"></div><div style="font:12px ${FONT};color:${MUTED};padding-top:6px">${esc(label)}</div></td>`;
  const images = hasImg ? `<tr><td style="padding:24px 26px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${ctx.images.outside ? imgCell('door-outside', 'Outside view') : ''}${ctx.images.inside ? imgCell('door-inside', 'Inside view') : ''}</tr></table></td></tr>` : '';

  const button = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:${GOLD};border-radius:4px"><a href="${esc(href)}" style="display:inline-block;padding:13px 26px;font:500 15px ${FONT};color:#FFFFFF;text-decoration:none">${esc(label)}</a></td></tr></table>`;
  const cta = staff
    ? button(`mailto:${encodeURIComponent(rec.email)}?subject=${encodeURIComponent('Your Adorn door enquiry ' + rec.id)}`, `Reply to ${first}`)
    : link ? button(link, 'Open your configuration') : '';

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#EDEDEC">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(staff ? `${rec.name}: ${rec.summary[0] ? rec.summary[0].value : 'door enquiry'}` : 'We received your enquiry ' + rec.id)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDEDEC"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border-collapse:collapse">
<tr><td style="padding:20px 32px;border-bottom:3px solid ${GOLD}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td>${ctx.logo ? `<img src="cid:logo" alt="Adorn" height="46" style="height:46px;width:auto;display:block;border:0">` : `<span style="font:600 26px Georgia,serif;letter-spacing:.12em;color:${GOLD}">ADORN</span>`}</td>
<td align="right" style="font:13px ${FONT};color:${MUTED}">Door Configurator</td></tr></table></td></tr>
<tr><td style="background:${SLATE};padding:26px 32px">
<div style="font:500 24px ${FONT};color:#FFFFFF;line-height:1.25">${esc(title)}</div>
<div style="font:14px ${FONT};color:#E4E5E6;padding-top:6px">Reference <strong style="color:#FFFFFF;font-weight:500">${esc(rec.id)}</strong> &middot; ${esc(ctx.date)}</div></td></tr>
<tr><td style="padding:24px 32px 0;font:15px ${FONT};line-height:1.55;color:${INK}">${esc(intro)}</td></tr>
${images}
${h3(staff ? 'Customer details' : 'Your details')}
<tr><td style="padding:0 32px">${table(details(rec))}</td></tr>
${rec.message ? `${h3(staff ? 'Message' : 'Your message')}<tr><td style="padding:0 32px"><div style="background:${TINT};border-left:4px solid ${GOLD};padding:14px 16px;font:14px ${FONT};line-height:1.55;color:${INK};white-space:pre-wrap">${esc(rec.message)}</div></td></tr>` : ''}
${h3('Door configuration')}
<tr><td style="padding:0 32px">${table(rec.summary.length ? rec.summary.map((r) => [r.label, r.value]) : [['Configuration', 'See attached PDF']])}</td></tr>
${cta ? `<tr><td style="padding:30px 32px 6px">${cta}</td></tr>` : ''}
<tr><td style="padding:20px 32px 6px;font:12px ${FONT};line-height:1.5;color:${MUTED}">Reference code${link ? ' (loads this exact door under Save / load)' : ''}:<br><span style="font-family:Consolas,Menlo,monospace;font-size:11px;word-break:break-all;color:${INK}">${esc(rec.reference)}</span></td></tr>
<tr><td style="padding:22px 32px;background:${PANEL};margin-top:20px;font:12px ${FONT};line-height:1.6;color:${MUTED};text-align:center;border-top:1px solid ${LINE}">
<strong style="color:${INK};font-weight:500">Adorn Group Ltd</strong><br>Premium aluminium entrance doors${staff ? '' : '<br>Reply to this email if you would like to add anything.'}</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    title, `Reference ${rec.id} - ${ctx.date}`, '', intro, '',
    staff ? 'CUSTOMER DETAILS' : 'YOUR DETAILS', ...details(rec).map(([a, b]) => `${a}: ${b}`), '',
    ...(rec.message ? [staff ? 'MESSAGE' : 'YOUR MESSAGE', rec.message, ''] : []),
    'DOOR CONFIGURATION', ...(rec.summary.length ? rec.summary.map((r) => `${r.label}: ${r.value}`) : ['See attached PDF']), '',
    ...(link ? [`Open this door: ${link}`] : []),
    `Reference code: ${rec.reference}`, '', 'Adorn Group Ltd',
  ].join('\n');

  return { html, text };
}
