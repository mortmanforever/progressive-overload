# Progressive Overload

A phone-first gym log for progressive overload. Open it from your home screen, log sets, and track trophies and estimated 1RM per exercise.

The site is static and served by GitHub Pages from the repository root. `src/` holds the source; `app.js` and `app.css` are the built files.

Your log is stored in the browser on your own device. Use Export backup on the home screen to keep a copy.

## Building

```
npm install
npm run build
```

This regenerates `app.js`, `app.css`, `index.html` and `sw.js` at the repo root from `src/`. Commit those files; GitHub Pages serves the root of `main`. Keep the storage key (`po-log-v1`) and the saved data shape unchanged so logs already on a phone keep loading.
