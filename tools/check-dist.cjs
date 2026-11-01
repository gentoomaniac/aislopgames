// Fails if an HTML file in the dist folder references a local file that isn't in it.
// Usage: node tools/check-dist.cjs <dist-dir>
const fs = require("fs");
const path = require("path");

const dist = path.resolve(process.argv[2]);
const isLocal = (ref) => ref && !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref);
const refPattern = /\b(?:src|href)\s*=\s*["']([^"']*)["']|url\(\s*["']?([^"')]*)/gi;

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

let missing = 0;
for (const file of htmlFiles(dist)) {
  const html = fs.readFileSync(file, "utf8");
  for (const match of html.matchAll(refPattern)) {
    const ref = match[1] ?? match[2];
    if (!isLocal(ref)) continue;
    const target = path.join(path.dirname(file), ref.split(/[?#]/)[0]);
    const insideDist = target.startsWith(dist + path.sep);
    if (!insideDist || !fs.existsSync(target)) {
      console.error(`${path.relative(dist, file)}: missing ${ref}`);
      missing++;
    }
  }
}
if (missing) process.exit(1);
console.log("dist: all local references resolve");
