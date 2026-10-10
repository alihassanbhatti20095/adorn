// A4 enquiry sheet attached to both emails. pdfkit with the built-in Helvetica (no font files needed).
import PDFDocument from 'pdfkit';
import qrcode from 'qrcode-generator';
import { shareLink } from './templates.js';

const GOLD = '#B8925A', SLATE = '#5A5D60', INK = '#2B2D2F', MUTED = '#5F6265', LINE = '#E4E5E6', PANEL = '#F4F4F3';

// Built-in PDF fonts only cover WinAnsi. Keep what they can show, strip diacritics from the rest (c-caron -> c).
const WIN_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.split(''));
export function pdfText(s) {
  return String(s == null ? '' : s).normalize('NFC').split('').map((ch) => {
    const c = ch.codePointAt(0);
    if (c === 10 || c === 9 || (c >= 32 && c <= 126) || (c >= 160 && c <= 255) || WIN_EXTRA.has(ch)) return ch;
    const extra = { 'Ł': 'L', 'ł': 'l', 'Đ': 'D', 'đ': 'd', 'ı': 'i', 'İ': 'I' }[ch];
    if (extra) return extra;
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return /^[\x20-\x7e]+$/.test(base) ? base : '?';
  }).join('');
}

/**
 * rec: stored enquiry record. ctx: { siteUrl, logo: Buffer|null, images: {outside: Buffer|null, inside: Buffer|null}, date }
 * Resolves to a Buffer.
 */
export function buildPdf(rec, ctx) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true, info: { Title: `Adorn enquiry ${rec.id}`, Author: 'Adorn Group Ltd', Subject: 'Door configuration enquiry' } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const L = 40, W = doc.page.width - 80, bottom = () => doc.page.height - 56;
    const need = (h) => { if (doc.y + h > bottom()) doc.addPage(); };

    /* header */
    if (ctx.logo) { try { doc.image(ctx.logo, L, 36, { height: 44 }); } catch { /* bad logo: skip */ } }
    doc.font('Helvetica-Bold').fontSize(15).fillColor(INK).text(pdfText(`${rec.summary[0] ? rec.summary[0].value : 'Door'} enquiry`), L, 38, { width: W, align: 'right' });
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(pdfText(`Reference ${rec.id}  |  ${ctx.date}`), L, 58, { width: W, align: 'right' });
    doc.moveTo(L, 92).lineTo(L + W, 92).lineWidth(2).strokeColor(GOLD).stroke();
    doc.y = 108;

    const heading = (t) => { need(46); doc.moveDown(0.4); doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD).text(pdfText(t.toUpperCase()), L, doc.y, { characterSpacing: 1 }); doc.moveDown(0.4); };
    const rows = (list) => {
      list.forEach(([a, b], i) => {
        const val = pdfText(b || '-');
        doc.font('Helvetica').fontSize(10);
        const h = Math.max(doc.heightOfString(val, { width: W - 150 - 16 }), 12) + 8;
        need(h);
        const y = doc.y;
        if (i % 2 === 0) doc.rect(L, y, W, h).fill(PANEL);
        doc.fillColor(MUTED).fontSize(9).text(pdfText(a), L + 8, y + 4, { width: 134 });
        doc.fillColor(INK).fontSize(10).text(val, L + 150, y + 4, { width: W - 150 - 8 });
        doc.y = y + h;
      });
      doc.moveDown(0.5);
    };

    /* renders */
    const { outside, inside } = ctx.images;
    if (outside || inside) {
      const boxW = outside && inside ? (W - 16) / 2 : W / 2, boxH = 140, y = doc.y;
      [['Outside view', outside], ['Inside view', inside]].filter((x) => x[1]).forEach(([label, buf], i) => {
        const x = outside && inside ? L + i * (boxW + 16) : L + (W - boxW) / 2;
        doc.rect(x, y, boxW, boxH).fill(PANEL);
        try { doc.image(buf, x + 6, y + 6, { fit: [boxW - 12, boxH - 12], align: 'center', valign: 'bottom' }); } catch { /* skip bad image */ }
        doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(label, x, y + boxH + 4, { width: boxW, align: 'center' });
      });
      doc.y = y + boxH + 18;
    }

    heading('Customer details');
    rows([['Name', rec.name], ['Email', rec.email], ['Phone', rec.phone || '-'], ['Postcode', rec.postcode], ['Showroom', rec.showroom]]);

    if (rec.message) {
      heading('Message');
      doc.font('Helvetica').fontSize(10);
      const msg = pdfText(rec.message), h = doc.heightOfString(msg, { width: W - 28 }) + 20;
      need(h);
      const y = doc.y;
      doc.rect(L, y, W, h).fill('#F2E8D8'); doc.rect(L, y, 4, h).fill(GOLD);
      doc.fillColor(INK).text(msg, L + 16, y + 10, { width: W - 28 });
      doc.y = y + h + 8;
    }

    heading('Door configuration');
    rows(rec.summary.length ? rec.summary.map((r) => [r.label, r.value]) : [['Configuration', '(see reference code)']]);

    /* QR + reference */
    need(110);
    heading('Reference code');
    const link = shareLink(ctx.siteUrl, rec.reference), y0 = doc.y;
    let qrW = 0;
    if (link) {
      try {
        const q = qrcode(0, 'L'); q.addData(link); q.make();
        const n = q.getModuleCount(), cell = 80 / n; qrW = 80;
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) doc.rect(L + c * cell, y0 + r * cell, cell + 0.3, cell + 0.3).fill(INK);
      } catch { qrW = 0; /* QR is optional (data too long) */ }
    }
    const tx = L + (qrW ? qrW + 16 : 0);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(qrW ? 'Scan the code, or paste the reference below under Save / load in the configurator, to reopen this exact door.' : 'Paste this reference under Save / load in the configurator to reopen this exact door.', tx, y0, { width: W - (tx - L) });
    doc.font('Courier').fontSize(7).fillColor(INK).text(pdfText(rec.reference), tx, doc.y + 6, { width: W - (tx - L) });
    doc.y = Math.max(doc.y, y0 + qrW) + 10;

    /* footer on every page (bottom margin zeroed while drawing so pdfkit does not add a page) */
    const { start, count } = doc.bufferedPageRange();
    for (let i = 0; i < count; i++) {
      doc.switchToPage(start + i);
      const keep = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.moveTo(L, doc.page.height - 44).lineTo(L + W, doc.page.height - 44).lineWidth(0.5).strokeColor(LINE).stroke();
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(`Adorn Group Ltd  |  Premium aluminium entrance doors  |  Page ${i + 1} of ${count}`, L, doc.page.height - 34, { width: W, align: 'center', lineBreak: false });
      doc.page.margins.bottom = keep;
    }
    doc.end();
  });
}
