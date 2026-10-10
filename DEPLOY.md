# Adorn Configurator: server paths and deploy

Update this file when anything below changes.

## Confirmed facts

- Site: `https://configurator.adorngroup.co.uk/` (static Vite build, hash routing) plus an enquiry API at `/api/`.
- Server: VPS `159.195.113.154`, managed with **aaPanel**. Its nginx is `/www/server/nginx`, not the system nginx.
- **Live web root: `/www/wwwroot/configurator.adorngroup.co.uk`**
  - Contains `index.html`, `assets/`, `adorn-logo.jpg`, plus panel-managed `proxy_cache_dir/` and `.well-known/`. Never delete those two.
- **Server clone: `/opt/adorn`.** Repo root IS the app (frontend in `src/`, backend in `server/`). Node v22.
- Git remote: `https://github.com/alihassanbhatti20095/adorn.git`, branch `main`.
- **Enquiry backend:** `/opt/adorn/server`, listens on `127.0.0.1:4100` only, runs under pm2 as `adorn-enquiry` (saved with `pm2 save`). Other pm2 apps (`coverad` on 4000, `izhar`, `tradely`) are unrelated; do not touch them or the other sites under `/var/www`.
- **nginx routing for /api:** aaPanel locks the main site config. The route lives in a custom file that the main config already includes:
  - `/www/server/panel/vhost/nginx/extension/configurator.adorngroup.co.uk/api.conf` (our `/api/` proxy)
  - same folder also holds `spa.conf` (SPA fallback and asset caching) and `site_total.conf` (panel stats). Leave those alone.
- Traps (do not use these):
  - `/var/www/configurator` is an unused leftover copy. The domain does NOT serve it.
  - `/etc/nginx/sites-available/configurator` is not enabled; the system nginx is not what serves the site.
  - `rsync` is not installed. Use `cp`.
  - When pasting multi-line commands into the web terminal, a heredoc can get mangled and leave a `> ` prompt (Ctrl+C to cancel). Prefer one-line `printf` for writing small files.

## Deploy the frontend (run on the server)

```bash
cd /opt/adorn
git stash                  # only if `git status` shows local changes (package-lock.json sometimes does)
git pull origin main
npm ci
npm run build              # outputs dist/

cd /www/wwwroot/configurator.adorngroup.co.uk
rm -rf assets index.html adorn-logo.jpg
cp -r /opt/adorn/dist/. .
chown -R www:www assets index.html adorn-logo.jpg
```

Verify: `curl -s https://configurator.adorngroup.co.uk/ | grep -o 'index-[^"]*\.js'` must match `ls /opt/adorn/dist/assets | grep index-`.
Then hard-refresh the browser (Ctrl+Shift+R). If the old bundle persists, purge the site cache in aaPanel.
A Vite note about `Tools.tsx` being dynamically and statically imported is harmless.

## Deploy the backend

After pulling new code:
```bash
cd /opt/adorn/server
npm ci --omit=dev
npm audit                                  # expect: found 0 vulnerabilities
pm2 restart adorn-enquiry
sleep 2
curl -s http://127.0.0.1:4100/api/health   # {"ok":true}
pm2 logs adorn-enquiry --lines 5 --nostream
```
Public check: `curl -s https://configurator.adorngroup.co.uk/api/health` must print `{"ok":true}`. If it prints the site's HTML, the nginx route is missing.

### Configuration (`/opt/adorn/server/.env`, mode 600, never committed)

```
PORT=4100  HOST=127.0.0.1
MAIL_MODE=smtp  SMTP_HOST=smtp.gmail.com  SMTP_PORT=587  SMTP_SECURE=false
SMTP_USER=dean@aluglass.co.uk  SMTP_PASS=<Google App Password, 16 chars, no spaces>
MAIL_FROM="Adorn Configurator <dean@aluglass.co.uk>"   (must match SMTP_USER; Gmail rewrites other senders)
ENQUIRY_TO=dean@aluglass.co.uk   SEND_CONFIRMATION=true
DATA_FILE=data/enquiries.jsonl   RATE_LIMIT_PER_HOUR=5
```
A normal Google password is rejected (error 535); an App Password is required (myaccount.google.com/apppasswords, needs 2-Step Verification). If it is revoked, create a new one, edit `.env`, then `pm2 restart adorn-enquiry`. Test the login without sending mail:
```bash
cd /opt/adorn/server && SMTP_USER='dean@aluglass.co.uk' SMTP_PASS='<app password>' node -e "import('nodemailer').then(async({default:n})=>{try{await n.createTransport({host:'smtp.gmail.com',port:587,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}).verify();console.log('LOGIN OK')}catch(e){console.log('FAILED',e.message)}})"
```

### nginx route (already in place)

File `/www/server/panel/vhost/nginx/extension/configurator.adorngroup.co.uk/api.conf`:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:4100;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    client_max_body_size 200k;
}
```
`X-Forwarded-For` is overwritten with the real address so clients cannot fake their IP to dodge the rate limit. Do not use aaPanel's "Reverse proxy" feature for this (it uses `$proxy_add_x_forwarded_for`, which is spoofable). To recreate the file:
```bash
printf '%s\n' 'location /api/ {' '    proxy_pass http://127.0.0.1:4100;' '    proxy_set_header Host $host;' '    proxy_set_header X-Forwarded-For $remote_addr;' '    client_max_body_size 200k;' '}' > /www/server/panel/vhost/nginx/extension/configurator.adorngroup.co.uk/api.conf
/www/server/nginx/sbin/nginx -t && /www/server/nginx/sbin/nginx -s reload
```
Only reload if `nginx -t` passes.

### Data

Enquiries are stored in `/opt/adorn/server/data/enquiries.jsonl` (personal data, mode 600). Back it up and set a retention period that fits your data-protection policy. If the notification email fails the customer sees an error and the record stays with `mailed:false`; list those with `grep -v '"update"' data/enquiries.jsonl | grep '"mailed":false'`.

## Current state

- Server at commit `3f6e05c`; live bundle `index-DjLiTOPd.js`; `/api/health` OK through nginx; `/api/enquiry` validation verified publicly (HTTP 422 on a bad request); `npm audit` clean in `server/`. Deployed 2026-10-10.
- **Not yet confirmed:** a real end-to-end enquiry from the live site (notification to dean@aluglass.co.uk plus confirmation to the customer). Do one and note the result here.

## Still to do

- Footer "Data protection" and "Legal Notice" links are still `#`; add real pages.
- Rotate the Google App Password (it was shared in a chat), then update `.env` and restart.
- Frontend `npm audit` reports 1 moderate and 1 high in dev tooling; do not run `npm audit fix --force`.
- Emails go out from an aluglass.co.uk address; for an adorngroup.co.uk sender, change `.env` (and set up SPF/DKIM for it).
- Translations, real product renders and the real catalogue are still placeholders (see README).
