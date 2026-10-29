// Builds the static site at the repo root from src/.
// app.js and app.css get a content hash so phones fetch new code after a push;
// sw.js gets a new cache name for the same reason. Run: npm install && npm run build
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const at = (p) => join(root, p);

await build({
  entryPoints: [at("src/entry.jsx")],
  bundle: true,
  minify: true,
  format: "iife",
  loader: { ".jsx": "jsx" },
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: at("app.js"),
  logLevel: "warning",
});

const css = join(mkdtempSync(join(tmpdir(), "po-")), "in.css");
writeFileSync(css, "@tailwind base;@tailwind components;@tailwind utilities;");
execFileSync(
  join(root, "node_modules/.bin/tailwindcss"),
  ["-i", css, "-o", at("app.css"), "--content", at("src/app.jsx"), "--minify"],
  { stdio: ["ignore", "ignore", "inherit"] }
);

const ver = createHash("sha1")
  .update(readFileSync(at("app.js")))
  .update(readFileSync(at("app.css")))
  .digest("hex")
  .slice(0, 10);

writeFileSync(
  at("index.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Progressive Overload</title>
<meta name="theme-color" content="#0E1214">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Overload">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="stylesheet" href="app.css?v=${ver}">
<style>html,body{background:#0E1214;color:#EEF3F2;color-scheme:dark;margin:0}</style>
</head>
<body>
<div id="root"></div>
<script src="app.js?v=${ver}"></script>
</body>
</html>
`
);

writeFileSync(
  at("sw.js"),
  `const CACHE = "overload-${ver}";
const CORE = ["./", "index.html", "app.js?v=${ver}", "app.css?v=${ver}", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
// Network first so a push shows up on the next open; the cache covers no signal.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("index.html")))
  );
});
`
);
console.log("built", ver);
