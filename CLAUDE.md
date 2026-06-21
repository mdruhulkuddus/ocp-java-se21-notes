# CLAUDE.md

Context for AI agents working on this repository. Read this before making changes.

## What this is

A **static study-reader** for the *OCP Oracle Certified Professional Java SE 21
Developer Study Guide*. It presents one chapter at a time, each with three
switchable views (English handnote, Bangla handnote, MCQ practice). The site is
bilingual (English + Bengali) and ships with a light/dark theme.

**Hard constraints — do not break these:**

- Pure **HTML + CSS + vanilla JS**. No build step, no framework, no bundler, no
  package manager, no dependencies.
- Must run as plain static files served over HTTP and deploy to GitHub Pages
  with zero config.

## Project structure

```
ocp-book-site/
├── index.html        # App shell: header, sidebar, tab strip, breadcrumb, footer
├── style.css         # Design system: theme tokens, layout, components
├── script.js         # All app logic: chapter data, routing, fetch+inject, theme
├── README.md         # Short project description
├── CLAUDE.md         # This file
└── chapters/
    └── <nn>-<slug>/  # One folder per chapter (e.g. 04-core-apis/)
        ├── handnote   .html   # English handnote fragment
        ├── bangla     .html   # Bangla handnote fragment
        └── questions  .html   # MCQ practice fragment
```

Chapter folders currently present: `01-building-blocks`, `04-core-apis`,
`05-methods`. The rest are declared in `script.js` but have no files yet
(their tabs show a disabled "(soon)" state).

> Note: filenames are **not** standardized. Chapter 4 uses
> `handnote.html` / `bangla.html` / `questions.html`, while chapters 1 and 5 use
> descriptive names like `Ch5_Methods_Handnote_EN.html`. The actual path always
> comes from the `chapters` array in `script.js` — that array is the source of
> truth, not any naming convention.

## How it works

### Single source of truth
`script.js` holds a `chapters` array. Each entry:

```js
{
  id: "core-apis",        // hash slug used in the URL
  number: 4,              // display number / ordering
  title: "Core APIs",     // sidebar + breadcrumb label
  titleBn: "",            // optional Bengali title (unused so far)
  handnoteFile: "chapters/04-core-apis/handnote.html",  // or null
  banglaFile:   "chapters/04-core-apis/bangla.html",    // or null
  questionsFile:"chapters/04-core-apis/questions.html", // or null
}
```

Any `*File` set to `null` disables that view's tab and shows a "(soon)" state.

The `views` array defines the three tabs and maps each to its chapter field
(`handnoteFile`, `banglaFile`, `questionsFile`). Tab order follows this array.

### Routing
- URL hash format: `#<chapter-id>/<view>` — e.g. `#core-apis/handnote`.
- Hash is **linkable and restored on reload**; `route()` runs on load and on
  `hashchange`, and normalizes the hash to the canonical form.
- Invalid/missing chapter or view falls back to the first chapter/view that has
  content. A `loadToken` counter guards against out-of-order async loads.

### Content loading (important)
Each chapter fragment is a **complete, self-contained HTML document** with its
own `<head>`/`<style>`. The shell loads it into an **`<iframe>`** so the
fragment's CSS and JS stay isolated and never leak into the shell. `script.js`
auto-sizes the iframe to its content height so the page scrolls as one (no nested
scrollbar), and re-fits on window resize.

Before swapping in the iframe, the shell does a `fetch(path, {method:"HEAD"})`
probe so a missing file shows a themed error instead of the server's raw 404.

### Theme
Light is primary. `data-theme` on `<html>` toggles light/dark; preference is
persisted in `localStorage` under `ocp-theme`. Theme tokens live in `style.css`.

### Header behavior
The header auto-hides on scroll-down and returns on scroll-up (listens to both
the reading region and the window, for desktop vs. mobile scroll containers).

## Running locally

`fetch()` does not work on the `file://` protocol, so the folder **must** be
served over HTTP:

```bash
python -m http.server 8000   # or: npx serve .
```

Then open <http://localhost:8000>. Double-clicking `index.html` will fail to load
chapter content.

## Deploy

Push to GitHub and enable Pages on the branch root. Everything is static, so no
configuration or build is required.

## How to add a chapter

1. Create `chapters/<nn>-<slug>/` and add the fragment HTML file(s). Each
   fragment must be a full standalone HTML document (own `<head>`/`<style>`),
   since it renders inside an isolated iframe.
2. In `script.js`, set the matching chapter entry's `handnoteFile` /
   `banglaFile` / `questionsFile` to the new path(s). Leave any not-yet-written
   view as `null` — its tab will show "(soon)" automatically.
3. No other wiring needed: the sidebar, tabs, routing, and breadcrumb all derive
   from the `chapters` array.

## Conventions & gotchas

- The shell renders sidebar, tabs, breadcrumb, and page indicator entirely from
  data — edit the `chapters`/`views` arrays, not the DOM, to change navigation.
- `script.js` is **shell-only**: it does not implement MCQ scoring, content
  generation, or per-view logic. Any interactivity (e.g. quiz behavior) lives
  inside the individual fragment files.
- Fonts are loaded from Google Fonts in `index.html`: Merriweather (serif
  headings), Inter (sans body), JetBrains Mono (code), Noto Sans Bengali
  (Bengali text).
- Keep new code dependency-free and framework-free to preserve the zero-build,
  GitHub-Pages-ready guarantee.
