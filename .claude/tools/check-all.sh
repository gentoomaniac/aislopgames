#!/bin/sh
# Syntax + browser check for every page in a checkout: check-all.sh <repo-dir>
dir=${1:-.}
status=0
for f in "$dir"/index.html "$dir"/games/*.html; do
  node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8");const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;let m;while((m=re.exec(s))){try{new Function(m[1])}catch(e){console.error(process.argv[1],e.message);process.exit(1)}}' "$f" || status=1
  printf '%s: ' "$(basename "$f")"
  node "$(dirname "$0")/check-page.cjs" "$f" || status=1
done
exit $status
