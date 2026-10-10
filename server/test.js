// Run: cd server && npm install && npm test
// Starts the service in log mode on a random port with a temp data file, then exercises it.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const port = 4100 + Math.floor(Math.random() * 800);
const dataFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'adorn-')), 'enq.jsonl');
const child = spawn(process.execPath, [path.join(here, 'index.js')], {
  env: { ...process.env, PORT: String(port), MAIL_MODE: 'log', ENQUIRY_TO: 'sales@example.com', DATA_FILE: dataFile, RATE_LIMIT_PER_HOUR: '4' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
let out = '';
child.stdout.on('data', (d) => { out += d; });

const base = `http://127.0.0.1:${port}`;
const good = {
  name: 'Jane <b>Doe</b>', email: 'jane@example.com', phone: '+44 20 7946 0958', postcode: 'SW1A 1AA', message: 'Hello\nworld',
  showroom: 'Main showroom', consent: true, reference: 'abc123', config: { model: 'AL1 88E' },
  summary: [{ label: 'Door model', value: 'AL1 88E' }, { label: 'Colour', value: 'RAL 7016' }],
};
const post = (body, headers = {}) => fetch(base + '/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

let failed = 0;
const check = (name, cond) => { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) failed++; };

for (let i = 0; i < 50 && !out.includes('enquiry service'); i++) await new Promise((r) => setTimeout(r, 100));

let r = await fetch(base + '/api/health');
check('health 200', r.status === 200);

r = await post({ ...good }, { 'X-Forwarded-For': '10.0.0.1' });
const ok = await r.json();
check('valid enquiry 200 with id', r.status === 200 && /^ENQ-[0-9A-F]{8}$/.test(ok.id));
const mail = out.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
check('email logged and HTML-escaped', mail.includes('Jane &lt;b&gt;Doe&lt;/b&gt;') && !mail.includes('>Jane <b>') && mail.includes('RAL 7016') && mail.includes('Reply-To') && mail.includes('jane@example.com'));
const copy = mail.slice(mail.indexOf('CONFIRMATION'));
check('confirmation sent to customer', out.includes('CONFIRMATION') && out.includes('To: jane@example.com') && mail.includes('We received your enquiry'));
check('customer copy includes their details, message and configuration', ['+44 20 7946 0958', 'SW1A 1AA', 'Main showroom', 'Your message', 'Hello', 'RAL 7016', 'Jane &lt;b&gt;Doe&lt;/b&gt;'].every((t) => copy.includes(t)));
const lines = fs.readFileSync(dataFile, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
check('stored then marked mailed', lines.length === 2 && lines[0].email === 'jane@example.com' && lines[1].mailed === true);

r = await post({ ...good, name: '', email: 'nope', postcode: '', consent: false }, { 'X-Forwarded-For': '10.0.0.2' });
const bad = await r.json();
check('invalid fields 422 with field errors', r.status === 422 && bad.fields.name && bad.fields.email && bad.fields.postcode && bad.fields.consent);

r = await post({ ...good, website: 'http://spam' }, { 'X-Forwarded-For': '10.0.0.3' });
const before = fs.readFileSync(dataFile, 'utf8').split('\n').length;
check('honeypot looks like success but stores nothing', r.status === 200 && before === fs.readFileSync(dataFile, 'utf8').split('\n').length);

r = await post('{not json', { 'X-Forwarded-For': '10.0.0.4' });
check('bad JSON 400', r.status === 400);

r = await post({ ...good, message: 'x'.repeat(200 * 1024) }, { 'X-Forwarded-For': '10.0.0.5' });
check('oversized body 413', r.status === 413);

r = await fetch(base + '/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'hi' });
check('non-JSON content type 415', r.status === 415);

r = await fetch(base + '/api/enquiry');
check('GET enquiry 405', r.status === 405);

const codes = [];
for (let i = 0; i < 6; i++) codes.push((await post(good, { 'X-Forwarded-For': '10.9.9.9' })).status);
check('rate limit: 4 allowed then 429', codes.join() === '200,200,200,200,429,429');

child.kill();
console.log(failed ? `\n${failed} FAILED` : '\nAll passed');
process.exit(failed ? 1 : 0);
