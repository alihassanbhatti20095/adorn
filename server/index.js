// Adorn configurator enquiry service: validates, stores and emails enquiries.
// POST /api/enquiry and GET /api/health. Runs behind nginx on the same origin as the site.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';

const here = path.dirname(fileURLToPath(import.meta.url));

/* ---------- tiny .env loader (no dependency) ---------- */
try {
  for (const line of fs.readFileSync(path.join(here, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch { /* no .env: rely on the real environment */ }

const env = process.env;
export const config = {
  port: +env.PORT || 4100,
  host: env.HOST || '127.0.0.1',
  to: (env.ENQUIRY_TO || '').split(',').map((s) => s.trim()).filter(Boolean),
  from: env.MAIL_FROM || 'Adorn Configurator <no-reply@localhost>',
  mailMode: env.MAIL_MODE || 'smtp',
  dataFile: path.resolve(here, env.DATA_FILE || 'data/enquiries.jsonl'),
  rateLimit: +env.RATE_LIMIT_PER_HOUR || 5,
  confirm: env.SEND_CONFIRMATION !== 'false',
  smtp: { host: env.SMTP_HOST, port: +env.SMTP_PORT || 587, secure: env.SMTP_SECURE === 'true', user: env.SMTP_USER, pass: env.SMTP_PASS },
};

const SHOWROOMS = ['No preference', 'Main showroom', 'Trade showroom', 'Video consultation'];
const MAX_BODY = 100 * 1024;

/* ---------- helpers ---------- */
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
// strip control characters (keeps \n and \t), trim, cap length
const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '');
const oneLine = (v, max) => clean(v, max).replace(/[\r\n]+/g, ' ');

export function validate(b) {
  const errors = {};
  const out = {
    name: oneLine(b.name, 120),
    email: oneLine(b.email, 200),
    phone: oneLine(b.phone, 40),
    postcode: oneLine(b.postcode, 20),
    message: clean(b.message, 2000),
    showroom: oneLine(b.showroom, 60),
    reference: oneLine(b.reference, 4000),
  };
  if (!out.name) errors.name = 'Please enter your full name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) errors.email = 'Please enter a valid email address';
  if (out.phone && !/^[+\d][\d\s()-]{6,}$/.test(out.phone)) errors.phone = 'Please enter a valid phone number';
  if (!out.postcode) errors.postcode = 'Please enter your postcode';
  if (b.consent !== true) errors.consent = 'Please accept to continue';
  if (!SHOWROOMS.includes(out.showroom)) out.showroom = 'No preference';
  out.config = b.config && typeof b.config === 'object' && !Array.isArray(b.config) ? b.config : null;
  if (!out.config) errors.config = 'Missing configuration';
  out.summary = Array.isArray(b.summary)
    ? b.summary.slice(0, 40).map((r) => ({ label: oneLine(r && r.label, 60), value: oneLine(r && r.value, 300) })).filter((r) => r.label)
    : [];
  return { errors, value: out };
}

/* ---------- rate limit (per IP, in memory) ---------- */
const hits = new Map();
export function limited(ip) {
  const now = Date.now(), win = 3600_000, list = (hits.get(ip) || []).filter((t) => now - t < win);
  if (list.length >= config.rateLimit) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list);
  return false;
}
setInterval(() => { const now = Date.now(); for (const [ip, l] of hits) if (!l.some((t) => now - t < 3600_000)) hits.delete(ip); }, 600_000).unref();

/* ---------- storage + mail ---------- */
function store(rec) {
  fs.mkdirSync(path.dirname(config.dataFile), { recursive: true });
  fs.appendFileSync(config.dataFile, JSON.stringify(rec) + '\n', { mode: 0o600 });
}

let transport;
function mailer() {
  if (!transport) {
    transport = config.mailMode === 'log'
      ? nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' })
      : nodemailer.createTransport({ host: config.smtp.host, port: config.smtp.port, secure: config.smtp.secure, auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined });
  }
  return transport;
}

export function emailBody(rec) {
  const rows = rec.summary.map((r) => `${r.label}: ${r.value}`).join('\n');
  const text = [
    `New configurator enquiry ${rec.id}`, '',
    `Name: ${rec.name}`, `Email: ${rec.email}`, `Phone: ${rec.phone || '-'}`, `Postcode: ${rec.postcode}`, `Showroom: ${rec.showroom}`, '',
    'Message:', rec.message || '-', '', 'Configuration:', rows || JSON.stringify(rec.config), '', `Reference code: ${rec.reference}`,
  ].join('\n');
  const tr = (a, b) => `<tr><td style="padding:4px 12px 4px 0;color:#5F6265;vertical-align:top">${esc(a)}</td><td style="padding:4px 0">${esc(b)}</td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;color:#2B2D2F;font-size:14px">
<h2 style="margin:0 0 12px">New configurator enquiry</h2>
<table>${tr('Name', rec.name)}${tr('Email', rec.email)}${tr('Phone', rec.phone || '-')}${tr('Postcode', rec.postcode)}${tr('Showroom', rec.showroom)}</table>
<h3 style="margin:16px 0 6px">Message</h3><p style="white-space:pre-wrap;margin:0">${esc(rec.message || '-')}</p>
<h3 style="margin:16px 0 6px">Configuration</h3><table>${rec.summary.map((r) => tr(r.label, r.value)).join('')}</table>
<p style="color:#5F6265;font-size:12px;margin-top:16px">Reference code (load under Save / load): <code style="word-break:break-all">${esc(rec.reference)}</code></p></div>`;
  return { text, html };
}

async function sendMail(rec) {
  if (!config.to.length) throw new Error('ENQUIRY_TO not configured');
  const { text, html } = emailBody(rec);
  const info = await mailer().sendMail({
    from: config.from,
    to: config.to,
    replyTo: { name: rec.name, address: rec.email },
    subject: `Configurator enquiry ${rec.id}: ${rec.summary[0] ? rec.summary[0].value : 'door'} (${rec.name})`,
    text,
    html,
  });
  if (config.mailMode === 'log') console.log('--- MAIL (log mode) ---\n' + info.message.toString() + '\n-----------------------');
}

// Automatic acknowledgement to the customer. Best effort: a failure here never fails the enquiry.
export function confirmationBody(rec) {
  const rows = rec.summary.map((r) => `${r.label}: ${r.value}`).join('\n');
  const text = [
    `Hello ${rec.name},`, '',
    'Thank you for your enquiry. We have received your door configuration and will be in touch shortly.', '',
    `Your reference: ${rec.id}`, '',
    'A copy of your enquiry:', `Name: ${rec.name}`, `Email: ${rec.email}`, `Phone: ${rec.phone || '-'}`, `Postcode: ${rec.postcode}`, `Showroom: ${rec.showroom}`, '',
    'Your message:', rec.message || '-', '',
    'Your configuration:', rows || '-', '',
    'You can reload this exact door any time under Save / load with this reference code:', rec.reference, '',
    'Reply to this email if you would like to add anything.',
  ].join('\n');
  const tr = (a, b) => `<tr><td style="padding:4px 12px 4px 0;color:#5F6265;vertical-align:top">${esc(a)}</td><td style="padding:4px 0">${esc(b)}</td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;color:#2B2D2F;font-size:14px;line-height:1.5">
<p>Hello ${esc(rec.name)},</p>
<p>Thank you for your enquiry. We have received your door configuration and will be in touch shortly.</p>
<p>Your reference: <strong>${esc(rec.id)}</strong></p>
<h3 style="margin:16px 0 6px">A copy of your enquiry</h3><table>${tr('Name', rec.name)}${tr('Email', rec.email)}${tr('Phone', rec.phone || '-')}${tr('Postcode', rec.postcode)}${tr('Showroom', rec.showroom)}</table>
<h3 style="margin:16px 0 6px">Your message</h3><p style="white-space:pre-wrap;margin:0">${esc(rec.message || '-')}</p>
<h3 style="margin:16px 0 6px">Your configuration</h3><table>${rec.summary.map((r) => tr(r.label, r.value)).join('')}</table>
<p style="color:#5F6265;font-size:12px">Reload this exact door under Save / load with this reference code:<br><code style="word-break:break-all">${esc(rec.reference)}</code></p>
<p>Reply to this email if you would like to add anything.</p></div>`;
  return { text, html };
}

async function sendConfirmation(rec) {
  const { text, html } = confirmationBody(rec);
  const info = await mailer().sendMail({ from: config.from, to: rec.email, replyTo: config.to.length ? config.to[0] : undefined, subject: `We received your enquiry ${rec.id}`, text, html });
  if (config.mailMode === 'log') console.log('--- CONFIRMATION (log mode) ---\n' + info.message.toString() + '\n-----------------------');
}

/* ---------- http ---------- */
function send(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0, over = false;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (over) return;
      if (size > MAX_BODY) { over = true; chunks.length = 0; reject(Object.assign(new Error('too large'), { code: 413 })); } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/health' && req.method === 'GET') return send(res, 200, { ok: true });
  if (url.pathname !== '/api/enquiry') return send(res, 404, { error: 'Not found' });
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'Method not allowed' }); }
  if (!/^application\/json/i.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'Send JSON' });

  // nginx sets X-Forwarded-For; the service only listens on 127.0.0.1 so it cannot be spoofed from outside.
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  let body;
  try { body = JSON.parse(await readBody(req)); } catch (e) {
    if (e.code === 413) { res.setHeader('Connection', 'close'); res.on('finish', () => req.destroy()); return send(res, 413, { error: 'Request too large' }); }
    return send(res, 400, { error: 'Invalid JSON' });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return send(res, 400, { error: 'Invalid request' });

  // Honeypot: bots fill the hidden field. Pretend success, store nothing.
  if (body.website) return send(res, 200, { ok: true });
  if (limited(ip)) { res.setHeader('Retry-After', '3600'); return send(res, 429, { error: 'Too many enquiries. Please try again later.' }); }

  const { errors, value } = validate(body);
  if (Object.keys(errors).length) return send(res, 422, { error: 'Please check the form', fields: errors });

  const rec = { id: 'ENQ-' + crypto.randomBytes(4).toString('hex').toUpperCase(), receivedAt: new Date().toISOString(), ip, mailed: false, ...value };
  try { store(rec); } catch (e) { console.error('store failed', e); return send(res, 500, { error: 'Could not save your enquiry' }); }
  try {
    await sendMail(rec);
    store({ id: rec.id, mailed: true, update: true });
    if (config.confirm) await sendConfirmation(rec).catch((e) => console.error('confirmation failed', rec.id, e.message));
  } catch (e) {
    console.error('mail failed', rec.id, e.message);
    return send(res, 502, { error: 'We could not send your enquiry. Please try again.' });
  }
  return send(res, 200, { ok: true, id: rec.id });
}

// Starts on import. pm2 runs this through its own wrapper, so do not gate on process.argv[1].
const server = http.createServer((req, res) => handle(req, res).catch((e) => {
  console.error(e);
  if (!res.headersSent) send(res, 500, { error: 'Server error' });
}));
server.requestTimeout = 15_000;
server.listen(config.port, config.host, () => console.log(`Adorn enquiry service on http://${config.host}:${config.port} (mail: ${config.mailMode}, to: ${config.to.join(', ') || 'NOT SET'})`));
