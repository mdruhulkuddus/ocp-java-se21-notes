# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Running locally

`fetch()` does not work on the `file://` protocol, so the folder **must** be
served over HTTP:

```bash
python -m http.server 8000   # or: npx serve .
```

Then open <http://localhost:8000>. Double-clicking `index.html` will fail to load
chapter content.

There is no build, lint, or test command — the three root files (`index.html`,
`style.css`, `script.js`) are shipped as-is. Verification is manual: load the
page, switch chapters/views, toggle theme and focus mode.

## Deploy

Push to GitHub and enable Pages on the branch root. Everything is static, so no
configuration or build is required.

## Architecture

Three root files plus a `chapters/` tree. `index.html` is the shell markup,
`style.css` the design system, `script.js` all app logic.

### Single source of truth
`script.js` holds a `chapters` array. Each entry:

```js
{
  id: "core-apis",        // hash slug used in the URL
  number: 4,              // display number / ordering
  title: "Core APIs",     // sidebar + breadcrumb label
  titleBn: "",            // optional Bengali subtitle in the tab strip
  handnoteFile: "chapters/04-core-apis/Ch4_CoreAPIs_Handnote_EN.html",      // or null
  banglaFile:   "chapters/04-core-apis/Ch4_CoreAPIs_HandNote_Bangla.html",  // or null
  questionsFile:"chapters/04-core-apis/Ch4_CoreAPIs_MCQ_Practice.html",     // or null
}
```

Any `*File` set to `null` disables that view's tab and shows a "(soon)" state.

The `views` array defines the three tabs and maps each to its chapter field
(`handnoteFile`, `banglaFile`, `questionsFile`). Tab order follows this array.

Sidebar, tabs, breadcrumb, and the tab-strip chapter label are all rendered from
these two arrays — edit the data, not the DOM, to change navigation.

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
scrollbar). It re-fits on window resize, after the fragment's web fonts finish
loading (`document.fonts.ready`), on any later content height change (a
`ResizeObserver` on the iframe body), and after a focus-mode toggle (which
changes the column width — hence the `setTimeout` matching the ~180ms CSS
transition). It also forces `overflow:hidden` on the iframe document so
sub-pixel rounding can never leave a residual inner scrollbar — the only
scrollbar is the shell's `.reading-scroll` region.

Before swapping in the iframe, the shell does a `fetch(path, {method:"HEAD"})`
probe so a missing file shows a themed error instead of the server's raw 404.

Reading width is set per view: `route()` toggles `.reading--wide` for the MCQ
view (wide tables) and `.reading--prose` for the two handnote views.

### Scroll behavior
The header auto-hides on scroll-down and returns on scroll-up, and a reading
progress bar (`#progress-fill`, rAF-throttled) tracks position. **The scrolling
element differs by viewport**: `.reading-scroll` on desktop, the window/document
below the 820px breakpoint. Both handlers are registered and `onScroll` reads
whichever fired — any new scroll-driven feature must do the same.

### Theme and focus mode
Two persisted UI states, both keyed off `<html>`:

| State | Storage key | Applied as |
| --- | --- | --- |
| Theme | `ocp-theme` (`"light"` \| `"dark"`) | `data-theme` attribute |
| Focus mode | `ocp-focus` (`"1"` \| `"0"`) | `.focus-mode` class |

Both are restored **before first paint** by an inline boot script in the `<head>`
of `index.html` to avoid a flash. That script duplicates the key names and
defaults from `script.js` — **change one, change both**. Focus mode collapses the
sidebar to a numbered rail and centers the reading column.

Light is primary. All theme tokens are CSS custom properties on `:root` (light)
and `[data-theme="dark"]` in `style.css` — change colors there, never hard-code
hex values in components.

The look is a warm, paper-like reading surface with a muted green accent:

- **Surfaces (light):** `--bg #faf8f3`, `--bg-sidebar #f3f1e9`,
  `--bg-panel #ffffff`, `--bg-code #f1efe7`, `--bg-active #e7efe7`.
- **Text (light):** `--text #2b2b29`, `--text-soft #57564f`,
  `--text-muted #908e84`.
- **Accent (light):** `--accent #4e7d5b`, `--accent-strong #3f6b4c`,
  `--accent-soft #6f9a7a`. Dark mode lightens these (`--accent #79b08a`).
- **Type:** `--font-serif` Merriweather (headings), `--font-sans` Inter
  (body), `--font-bn` Noto Sans Bengali (Bengali text), `--font-mono`
  JetBrains Mono (code). Loaded from Google Fonts in `index.html`.

Chapter fragments carry their **own independent palette and fonts** inside their
own `<style>`, because they render in isolated iframes. The shell tokens above do
not reach into fragments, and fragment styles do not leak out — a fragment will
not follow the shell's dark mode unless it implements its own.

## Chapters

```
chapters/<nn>-<slug>/                    # lowercase, e.g. 04-core-apis/
├── Ch<n>_<Slug>_Handnote_EN.html        # English handnote
├── Ch<n>_<Slug>_HandNote_Bangla.html    # Bangla handnote
└── Ch<n>_<Slug>_MCQ_Practice.html       # MCQ practice
```

Folders `01`–`14` exist on disk and all three views are wired up for each, so no
chapter currently has a `null` path. The "(soon)" disabled-tab path still exists
in the shell for chapters added later.

Note the **casing is deliberately inconsistent** between the two handnotes: EN
uses `Handnote`, Bangla uses `HandNote`. The `<Slug>` is not mechanically derived
from the folder name either (`11-exceptions` holds `Ch11_ExceptionsLocalization_*`,
`08-lambda-and-functional-interface` holds `Ch8_Lambdas_*`). The `chapters` array
in `script.js` is the **only** authority on paths — read a path from there or list
the directory; never construct one from the convention.

### How to add a chapter

1. Create `chapters/<nn>-<slug>/` and add the fragment HTML file(s). Each
   fragment must be a full standalone HTML document (own `<head>`/`<style>`),
   since it renders inside an isolated iframe.
2. In `script.js`, set the matching chapter entry's `handnoteFile` /
   `banglaFile` / `questionsFile` to the new path(s). Leave any not-yet-written
   view as `null` — its tab will show "(soon)" automatically.
3. No other wiring needed: the sidebar, tabs, routing, and breadcrumb all derive
   from the `chapters` array.

## Conventions & gotchas

- `script.js` is **shell-only**: it does not implement MCQ scoring, content
  generation, or per-view logic. Any interactivity (e.g. quiz behavior) lives
  inside the individual fragment files.
- Keep new code dependency-free and framework-free to preserve the zero-build,
  GitHub-Pages-ready guarantee.
