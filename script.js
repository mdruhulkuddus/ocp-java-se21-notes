/* ============================================================
   OCP Java SE 21 — study reader shell
   Pure vanilla JS, no build step, no dependencies.

   Responsibilities (shell only):
     - hold the single `chapters` source of truth
     - render sidebar + view tabs
     - fetch a pre-made HTML fragment and inject it
     - reflect active chapter + view in the URL hash
     - persist the light/dark theme

   It does NOT generate content, MCQ logic, scoring, etc.
   Each view is just a different fragment file loaded into the
   same reading area.
   ============================================================ */

/* ---- Single source of truth ----------------------------------
   Each chapter: id (hash slug), number, title, optional titleBn,
   and three fragment paths. Any file may be null -> that tab is
   disabled with a "(soon)" state and routing falls back to the
   first available view.
   PHASE 2: only Chapter 4 has real fragments; the rest are null
   so you can see both the working tabs and the disabled state.
   PHASE 3 will fill in the remaining file paths.
--------------------------------------------------------------- */
const chapters = [
  {
    id: "building-blocks",
    number: 1,
    title: "Building Blocks",
    titleBn: "",
    handnoteFile: "chapters/01-building-blocks/Ch1_BuildingBlocks_Handnote_EN.html",
    banglaFile: "chapters/01-building-blocks/Ch1_BuildingBlocks_HandNote_Bangla.html",
    questionsFile: "chapters/01-building-blocks/Ch1_BuildingBlocks_MCQ_Practice.html",
  },
  { id: "operators", number: 2, title: "Operators", titleBn: "", handnoteFile: null, banglaFile: null, questionsFile: null },
  { id: "making-decisions", number: 3, title: "Making Decisions", titleBn: "", handnoteFile: null, banglaFile: null, questionsFile: null },
  {
    id: "core-apis",
    number: 4,
    title: "Core APIs",
    titleBn: "",
    handnoteFile: "chapters/04-core-apis/handnote.html",
    banglaFile: "chapters/04-core-apis/bangla.html",
    questionsFile: "chapters/04-core-apis/questions.html",
  },
  {
    id: "methods",
    number: 5,
    title: "Methods",
    titleBn: "",
    handnoteFile: "chapters/05-methods/Ch5_Methods_Handnote_EN.html",
    banglaFile: "chapters/05-methods/Ch5_Methods_HandNote_Bangla.html",
    questionsFile: "chapters/05-methods/Ch5_Methods_MCQ_Practice.html",
  },
  { id: "class-design", number: 6, title: "Class Design", titleBn: "", handnoteFile: null, banglaFile: null, questionsFile: null },
  { id: "beyond-classes", number: 7, title: "Beyond Classes", titleBn: "", handnoteFile: null, banglaFile: null, questionsFile: null },
  { id: "lambdas-functional", number: 8, title: "Lambdas & Functional Interfaces", titleBn: "", handnoteFile: null, banglaFile: null, questionsFile: null },
  { id: "collections-generics", number: 9, title: "Collections & Generics", titleBn: "", handnoteFile: null, banglaFile: null, questionsFile: null },
  { id: "streams", number: 10, title: "Streams", titleBn: "", handnoteFile: null, banglaFile: null, questionsFile: null },
  { id: "exceptions-localization", number: 11, title: "Exceptions & Localization", titleBn: "", handnoteFile: null, banglaFile: null, questionsFile: null },
  { id: "modules", number: 12, title: "Modules", titleBn: "", handnoteFile: null, banglaFile: null, questionsFile: null },
  { id: "concurrency", number: 13, title: "Concurrency", titleBn: "", handnoteFile: null, banglaFile: null, questionsFile: null },
  { id: "io", number: 14, title: "I/O", titleBn: "", handnoteFile: null, banglaFile: null, questionsFile: null },
  { id: "jdbc", number: 15, title: "JDBC", titleBn: "", handnoteFile: null, banglaFile: null, questionsFile: null },
];

/* ---- View definitions ----------------------------------------
   Order here drives the tab order. `file` maps to the chapter
   field that holds the fragment path for that view.
--------------------------------------------------------------- */
const views = [
  { key: "handnote", label: "Handnote", labelBn: "হ্যান্ডনোট", file: "handnoteFile" },
  { key: "bangla", label: "BanglaView", labelBn: "বাংলা", file: "banglaFile" },
  { key: "questions", label: "Practice MCQ", labelBn: "প্রশ্ন", file: "questionsFile" },
];

/* ---- DOM refs ---- */
const els = {
  readingScroll: document.getElementById("reading-scroll"),
  nav: document.getElementById("chapter-nav"),
  tabs: document.getElementById("view-tabs"),
  breadcrumb: document.getElementById("breadcrumb"),
  content: document.getElementById("reading-content"),
  pageIndicator: document.getElementById("page-indicator"),
  themeToggle: document.getElementById("theme-toggle"),
  html: document.documentElement,
};

/* ---- Helpers ------------------------------------------------- */
function pad2(n) {
  return String(n).padStart(2, "0");
}

function getChapter(id) {
  return chapters.find((c) => c.id === id) || null;
}

function viewFileFor(chapter, viewKey) {
  const view = views.find((v) => v.key === viewKey);
  return view ? chapter[view.file] : null;
}

function firstAvailableView(chapter) {
  const v = views.find((view) => chapter[view.file]);
  return v ? v.key : views[0].key;
}

/* Parse "#id/view" -> { id, view } with sane fallbacks. */
function parseHash() {
  const raw = location.hash.replace(/^#/, "");
  const [id, view] = raw.split("/");
  return { id: id || null, view: view || null };
}

function setHash(id, view) {
  const next = `#${id}/${view}`;
  if (location.hash !== next) location.hash = next;
}

/* ---- Rendering ----------------------------------------------- */
function renderSidebar(activeId) {
  els.nav.innerHTML = "";
  chapters.forEach((ch) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chapter-item" + (ch.id === activeId ? " active" : "");
    btn.dataset.id = ch.id;
    btn.innerHTML =
      `<span class="chapter-num">${pad2(ch.number)}</span>` +
      `<span class="chapter-title">${ch.title}</span>`;
    btn.addEventListener("click", () => {
      // Going to a chapter: keep current view if available, else fall back.
      const wanted = parseHash().view || "handnote";
      const view = ch[views.find((v) => v.key === wanted)?.file] ? wanted : firstAvailableView(ch);
      setHash(ch.id, view);
    });
    els.nav.appendChild(btn);
  });
}

function renderTabs(chapter, activeView) {
  els.tabs.innerHTML = "";
  views.forEach((view) => {
    const available = Boolean(chapter[view.file]);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "tab" + (view.key === activeView ? " active" : "") + (available ? "" : " disabled");
    btn.dataset.view = view.key;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", view.key === activeView ? "true" : "false");
    btn.innerHTML =
      `<span class="tab-label">${view.label}${available ? "" : '<span class="soon">(soon)</span>'}</span>`;
    if (available) {
      btn.addEventListener("click", () => setHash(chapter.id, view.key));
    } else {
      btn.disabled = true;
    }
    els.tabs.appendChild(btn);
  });
}

function renderBreadcrumb(chapter, viewKey) {
  const view = views.find((v) => v.key === viewKey);
  els.breadcrumb.textContent =
    `${pad2(chapter.number)} — ${chapter.title.toUpperCase()} / ${(view ? view.label : "").toUpperCase()}`;
}

function renderPageIndicator(chapter) {
  els.pageIndicator.textContent = `${pad2(chapter.number)} / ${pad2(chapters.length)}`;
}

function setStateMessage(text, isError) {
  els.content.innerHTML = `<p class="state-msg${isError ? " error" : ""}">${text}</p>`;
}

/* ---- View loading -------------------------------------------
   Each view file is a COMPLETE, self-contained HTML document with
   its own <head>/<style>. We embed it in an <iframe> so its CSS
   (and any in-page JS) stays isolated from the shell instead of
   leaking out and overriding it. The iframe auto-sizes to its
   content so the page scrolls as one — no nested scrollbar.
--------------------------------------------------------------- */
let currentFrame = null;

function autosizeFrame(frame) {
  try {
    const doc = frame.contentDocument;
    if (!doc) return;
    const h = Math.max(
      doc.documentElement.scrollHeight,
      doc.body ? doc.body.scrollHeight : 0
    );
    frame.style.height = h + "px";
  } catch (e) {
    /* same-site, so this should not throw; ignore defensively */
  }
}

async function showView(path) {
  const token = ++loadToken;
  setStateMessage("Loading…", false);
  try {
    // Probe first so a missing file shows our themed error, not the
    // server's raw 404 page inside the frame.
    const res = await fetch(path, { method: "HEAD" });
    if (token !== loadToken) return; // a newer navigation won
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const frame = document.createElement("iframe");
    frame.className = "view-frame";
    frame.title = "Chapter content";
    frame.addEventListener("load", () => {
      if (token !== loadToken) return;
      autosizeFrame(frame);
    });
    frame.src = path;

    currentFrame = frame;
    els.content.innerHTML = "";
    els.content.appendChild(frame);
    els.readingScroll.scrollTo(0, 0); // reset the scroll region on navigation
  } catch (err) {
    if (token !== loadToken) return;
    currentFrame = null;
    setStateMessage(
      `Could not load this section (${err.message}). ` +
        "If you opened the file directly, serve the site over HTTP — fetch() does not work on file://.",
      true
    );
  }
}

// Re-fit the active frame when the window (and thus content reflow) changes.
window.addEventListener("resize", () => {
  if (currentFrame) autosizeFrame(currentFrame);
});

/* ---- Auto-hide header on scroll-down -------------------------
   Scrolling down collapses the header (so the sticky tab strip
   sits at the very top); scrolling up brings it back. The reading
   region scrolls on desktop, the window scrolls on mobile, so we
   listen to both and read whichever fired.
--------------------------------------------------------------- */
let lastScrollY = 0;
const HIDE_AFTER = 64; // px scrolled before we start hiding

function onScroll(e) {
  const el = e.target === document ? document.documentElement : e.target;
  const y = el.scrollTop;
  if (Math.abs(y - lastScrollY) < 6) return; // ignore jitter
  if (y > lastScrollY && y > HIDE_AFTER) {
    document.body.classList.add("header-hidden");
  } else if (y < lastScrollY) {
    document.body.classList.remove("header-hidden");
  }
  lastScrollY = y;
}

els.readingScroll.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("scroll", onScroll, { passive: true });

/* ---- Main router --------------------------------------------- */
let loadToken = 0; // guards against out-of-order async loads

async function route() {
  let { id, view } = parseHash();

  // Default chapter: first one that has any content, else the first.
  if (!id || !getChapter(id)) {
    id = chapters.find((c) => firstAvailableView(c) && viewFileFor(c, firstAvailableView(c)))?.id || chapters[0].id;
  }
  const chapter = getChapter(id);

  // Default / validate view for this chapter.
  if (!view || !views.some((v) => v.key === view) || !chapter[views.find((v) => v.key === view).file]) {
    view = firstAvailableView(chapter);
  }

  // Normalize the hash so it is always the canonical "#id/view".
  setHash(chapter.id, view);

  renderSidebar(chapter.id);
  renderTabs(chapter, view);
  renderBreadcrumb(chapter, view);
  renderPageIndicator(chapter);

  const path = viewFileFor(chapter, view);
  if (!path) {
    currentFrame = null;
    ++loadToken; // cancel any in-flight load
    setStateMessage("This section is coming soon. (অচিরেই আসছে)", false);
    return;
  }

  showView(path);
}

/* ---- Theme --------------------------------------------------- */
const THEME_KEY = "ocp-theme";

function applyTheme(theme) {
  els.html.setAttribute("data-theme", theme);
  els.themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
  );
}

function initTheme() {
  let theme = localStorage.getItem(THEME_KEY);
  if (theme !== "dark" && theme !== "light") theme = "light"; // light is primary
  applyTheme(theme);
}

els.themeToggle.addEventListener("click", () => {
  const next = els.html.getAttribute("data-theme") === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

/* ---- Boot ---------------------------------------------------- */
initTheme();
window.addEventListener("hashchange", route);
route();
