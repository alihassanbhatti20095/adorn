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

## Enquiry backend
`postEnquiry` in `src/lib/core.ts` is a stub (1.1 s delay). Set `window.ADORN_API_ENDPOINT = '/api/enquiry'` to POST `{name, email, phone, postcode, message, showroom, consent, config, reference}`.

## Not done yet
Translations (language switcher is wired but only English strings exist), admin panel, real product renders, real lock/handle photos and system cross-sections, privacy/legal pages.
