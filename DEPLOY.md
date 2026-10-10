# Adorn Configurator: server paths and deploy

Update this file when anything below changes.

## Confirmed facts

- Site: `https://configurator.adorngroup.co.uk/` (static Vite build, hash routing)
- Server: VPS `159.195.113.154`, managed with **aaPanel**. Its nginx is `/www/server/nginx`, not the system nginx.
- **Live web root: `/www/wwwroot/configurator.adorngroup.co.uk`**
  - Contains `index.html`, `assets/`, `adorn-logo.jpg`, plus panel-managed `proxy_cache_dir/` and `.well-known/`. Never delete those two.
- **Server clone: `/opt/adorn`.** Repo root IS the app (no subfolder). Node v22.
- Git remote: `https://github.com/alihassanbhatti20095/adorn.git`, branch `main`.
- Traps (do not use these):
  - `/var/www/configurator` is an unused leftover copy. The domain does NOT serve it.
  - `/etc/nginx/sites-available/configurator` is not enabled; system nginx is not what serves the site.
  - `rsync` is not installed. Use `cp`.
- Not run by pm2 (pm2 runs `coverad`, `izhar`, `tradely`, which are other apps). Do not touch the other apps under `/var/www`.

## Deploy (run on the server)

```bash
cd /opt/adorn
git stash                  # only if `git status` shows local changes (package-lock.json often does)
git pull origin main
npm ci
npm run build              # outputs dist/

cd /www/wwwroot/configurator.adorngroup.co.uk
rm -rf assets index.html adorn-logo.jpg
cp -r /opt/adorn/dist/. .
chown -R www:www assets index.html adorn-logo.jpg
```

Verify: `curl -s https://configurator.adorngroup.co.uk/ | grep -o 'index-[^"]*\.js'` must match `ls /opt/adorn/dist/assets | grep index-`.
Then hard-refresh the browser (Ctrl+Shift+R). If the old bundle persists, purge the site cache in aaPanel or run `/www/server/nginx/sbin/nginx -s reload`.

Last deployed: commit `fbb6e2f` (mobile rework), bundle `index-vauZW1u9.js`, 2026-10-10.

## Enquiry backend deploy (one-time setup, then updates)

The service lives in `/opt/adorn/server`, listens only on `127.0.0.1:4100` (port 4000 is taken by coverad) and runs under pm2 as `adorn-enquiry`.

**1. Install and configure**
```bash
cd /opt/adorn && git pull origin main
cd server && npm ci --omit=dev
cp .env.example .env && chmod 600 .env
nano .env        # ENQUIRY_TO, MAIL_FROM, SMTP_HOST/PORT/USER/PASS (MAIL_MODE=smtp)
```
**2. Start under pm2**
```bash
pm2 start index.js --name adorn-enquiry
pm2 save
curl -s http://127.0.0.1:4100/api/health      # {"ok":true}
```
**3. Route /api to it in aaPanel nginx.** Website > configurator.adorngroup.co.uk > Config, and add this ABOVE any `location /`:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:4100;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;   # overwrite, so clients cannot spoof their IP for the rate limit
    client_max_body_size 200k;
}
```
Save, then test: `curl -s https://configurator.adorngroup.co.uk/api/health`.

**4. Rebuild the frontend** (the deploy block above) so the form posts to `/api/enquiry`.

**5. Send a real test enquiry** from the live site and confirm the email arrives (check spam). Send-from address needs SPF/DKIM on adorngroup.co.uk or mail may be junked.

**Update later:** `cd /opt/adorn && git pull origin main && cd server && npm ci --omit=dev && pm2 restart adorn-enquiry`

**Data:** enquiries are stored in `/opt/adorn/server/data/enquiries.jsonl` (personal data, mode 600). Back it up, and set a retention period to suit your data-protection policy. If the email fails the customer sees an error and the record stays in the file with `mailed:false`; list them with `grep -v '"update"' data/enquiries.jsonl | grep '"mailed":false'`.

## Still to do before real use

- Fill in SMTP details (not known to me) and the real `ENQUIRY_TO` address.
- Footer "Data protection" and "Legal Notice" links are still `#`.
- `npm audit` reports 1 moderate and 1 high in dev tooling; do not run `npm audit fix --force`.
