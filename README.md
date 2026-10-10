# Adorn Door Configurator

Front-end door configurator (React + TypeScript + Vite + Zustand), built from the Claude Design prototype.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
```

## Structure
- `src/data.ts` — mock catalogue (models, systems, colours, glass, handles, accessories, locks) and dependency rules (`D.RULES`). Replace with a real API/CMS later.
- `src/store.ts` — Zustand store: config, normalisation/rules, navigation, save/load, enquiry, house-photo editor.
- `src/lib/door.ts` — SVG door renderer (placeholder art driven by the config).
- `src/steps/` — one component per configurator step. `Stage.tsx` is the preview, `Modals.tsx` the dialogs, `PrintSheet.tsx` the A4 print layout.
- `public/adorn-logo.jpg` — Adorn logo (header + print sheet).

## Plugging in real renders
Set `USE_REAL_RENDERS = true` in `src/Stage.tsx` and add PNGs at `public/renders/{model}/{variant}/{outside|inside}.png`. Missing files fall back to the SVG placeholder.

## Enquiry backend (`server/`)
Small Node service (one dependency, nodemailer). `POST /api/enquiry` validates the form, appends it to `server/data/enquiries.jsonl`, and emails it to `ENQUIRY_TO` with the customer as Reply-To. Emails are branded HTML (logo, door renders, details, configuration) with an A4 PDF copy attached, sent to Adorn and to the customer (`SEND_CONFIRMATION`). It rate-limits per IP, has a honeypot field, caps the body at 100 KB and HTML-escapes everything in the email. `GET /api/health` for monitoring.

```
cd server && npm install
cp .env.example .env        # set ENQUIRY_TO, MAIL_FROM and SMTP_*; MAIL_MODE=log prints mail instead of sending
npm test                    # self-contained tests (log mode, temp data file)
npm start                   # http://127.0.0.1:4100
```
In dev, `npm run dev` (frontend) proxies `/api` to port 4100. Production deployment: see `DEPLOY.md`.

## Not done yet
Translations (language switcher is wired but only English strings exist), admin panel, real product renders, real lock/handle photos and system cross-sections, privacy/legal pages.
