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

## Still to do before real use

- Point `postEnquiry` at the real endpoint (`window.ADORN_API_ENDPOINT`). It currently only simulates a send.
- Footer "Data protection" and "Legal Notice" links are still `#`.
- `npm audit` reports 1 moderate and 1 high in dev tooling; do not run `npm audit fix --force`.
