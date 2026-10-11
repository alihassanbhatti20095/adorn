#!/usr/bin/env bash
# Deploy frontend + backend on the VPS. Run from anywhere: bash /opt/adorn/deploy.sh
# Steps mirror DEPLOY.md. Stops on the first error.
set -euo pipefail

REPO=/opt/adorn
WEBROOT=/www/wwwroot/configurator.adorngroup.co.uk
SITE=https://configurator.adorngroup.co.uk

cd "$REPO"
echo "== pull =="
# package-lock.json sometimes differs locally; stash any local changes so the pull cannot conflict
if [ -n "$(git status --porcelain)" ]; then git stash; fi
git pull origin main

echo "== frontend build =="
npm ci
npm run build

echo "== publish to web root =="
cd "$WEBROOT"
rm -rf assets index.html adorn-logo.jpg   # leaves proxy_cache_dir/ and .well-known/ alone
cp -r "$REPO"/dist/. .
chown -R www:www assets index.html adorn-logo.jpg

echo "== backend =="
cd "$REPO/server"
npm ci --omit=dev
pm2 restart adorn-enquiry
sleep 2

echo "== verify =="
echo -n "local api:  "; curl -s http://127.0.0.1:4100/api/health; echo
echo -n "public api: "; curl -s "$SITE/api/health"; echo
echo -n "live bundle:  "; curl -s "$SITE/" | grep -o 'index-[^"]*\.js' | head -1
echo -n "built bundle: "; ls "$REPO/dist/assets" | grep '^index-.*\.js$' | head -1
pm2 logs adorn-enquiry --lines 5 --nostream
echo "Done. Hard-refresh the browser (Ctrl+Shift+R)."
