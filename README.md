# OCP Java SE 21 — Study Reader

A static study-reader for *OCP Oracle Certified Professional Java SE 21 Developer Study
Guide* material. Pure HTML/CSS/vanilla JS — **no build step, no framework, no package
manager, no dependencies.**

## Run it locally

Chapter content is loaded as HTML fragments via `fetch()`, and `fetch()` does **not** work
on the `file://` protocol. You must serve the folder over HTTP:

```bash
# any one of these, from the project root:
python -m http.server 8000
# or
npx serve .
```

Then open <http://localhost:8000>. Opening `index.html` directly by double-clicking will
fail to load chapter content.

## Deploy (GitHub Pages)

Push to a GitHub repo and enable Pages on the branch root — no configuration needed, since
everything is static.

## How it works

- `index.html` — the shell (header, sidebar, tabs, breadcrumb, footer).
- `style.css` — the design system (cream background, green accent, dual-language fonts).
- `script.js` — the `chapters` array (single source of truth), fetch + inject, hash
  routing, and theme toggle.
- `chapters/<nn>-<slug>/` — three fragment files per chapter: `handnote.html`,
  `bangla.html`, `questions.html`.

The URL hash is `#<chapter-id>/<view>` (e.g. `#core-apis/handnote`) — linkable and restored
on reload. Theme is persisted in `localStorage`.

See [CLAUDE.md](CLAUDE.md) for the fragment convention and how to add a new chapter.
