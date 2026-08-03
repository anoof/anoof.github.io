# Light/Dark Theme Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a light/dark theme toggle to the portfolio, with a dark counterpart of the current lime palette, defaulting to light and persisting the user's choice.

**Architecture:** Pure CSS custom-property theming — a `data-theme="dark"` attribute on `<html>` gates a second block of variable values in `styles.css`; a tiny inline head script restores the saved theme before first paint; `main.js` wires click handlers on two duplicate `.theme-toggle` buttons (desktop floating, mobile in-bar) that flip the attribute and persist to `localStorage`. No frameworks, no build step changes beyond mirroring one function in `build.js`.

**Tech Stack:** Static HTML/CSS/JS (no framework, no bundler). Existing `build.js` (plain Node, no deps) pre-renders `index.html` into `dist/` for production and copies `styles.css`/`main.js`/`data.json`/`icons`/`images` alongside it.

## Global Constraints

- No new external dependencies (no icon library, no JS framework) — icons are hand-written inline SVG, consistent with the rest of the site.
- `build.js`'s `projectLinks()` function must be kept byte-for-byte identical to `main.js`'s (per the existing `// ── Renderers (mirror main.js logic) ──` comment in `build.js`) — any edit to one is mirrored in the other.
- Default theme on first visit is light, with no system-preference (`prefers-color-scheme`) detection — this was explicitly decided against.
- The site has no test framework or build-time linting; verification for every task is done by grepping the source for exact strings/absences and by loading the page in a browser (Playwright MCP tools) to confirm visual/behavioral results.

---

### Task 1: Rename CSS custom properties to theme-agnostic names

**Files:**
- Modify: `styles.css` (the `:root` block at lines 3-17, and every `var(--old-name)` reference throughout the file — these two are the same string, so a global text substitution handles both)

**Interfaces:**
- Produces: the new custom-property names used by every later task and by Task 3's dark-mode block: `--bg`, `--bg-elevated`, `--bg-border`, `--accent`, `--accent-dim`, `--text-muted`, `--text-muted-strong`, `--text`, `--text-strong` (font/transition/nav-width tokens are unchanged: `--font-mono`, `--font-sans`, `--transition`, `--nav-width`).

This is a pure rename — no color values change, so light mode must look pixel-identical before and after this task.

- [ ] **Step 1: Replace each old token name with its new name, longest names first**

  Apply as sequential global find-and-replace passes over `styles.css` (order matters — `--navy-light` must be replaced before `--navy`, otherwise the shorter pattern would corrupt the longer one):

  | Old | New |
  |---|---|
  | `--navy-light` | `--bg-elevated` |
  | `--navy-mid` | `--bg-border` |
  | `--navy` | `--bg` |
  | `--teal-dim` | `--accent-dim` |
  | `--teal` | `--accent` |
  | `--slate-light` | `--text-muted-strong` |
  | `--slate` | `--text-muted` |
  | `--white-pure` | `--text-strong` |
  | `--white` | `--text` |

  Each pair is a literal substring replace across the whole file (covers both the `:root` declaration and every `var(--old-name)` usage, since both contain the identical substring).

- [ ] **Step 2: Verify no old token names remain**

  Run: `grep -nE -- '--navy|--teal|--slate|--white' styles.css`
  Expected: no output (zero matches).

- [ ] **Step 3: Verify the new tokens are declared**

  Run: `grep -n -- '--bg:\|--bg-elevated:\|--bg-border:\|--accent:\|--accent-dim:\|--text-muted:\|--text-muted-strong:\|--text:\|--text-strong:' styles.css`
  Expected: 9 lines, one per token, inside the `:root { ... }` block, with the same hex/rgba values as before the rename (`--bg: #ecfccb;`, `--accent: #65a30d;`, etc.).

- [ ] **Step 4: Visual regression check (light mode must be unchanged)**

  Start a local static server and load the page:
  ```bash
  cd "c:/Users/anoof/Downloads/dev/portfolio" && python -m http.server 8791 &
  ```
  Use the Playwright MCP tool (`browser_navigate` to `http://localhost:8791/index.html`, then `browser_take_screenshot` with `fullPage: true`). Compare against the current live site by eye — background, text, accent colors, cards, icons must look identical to before this task (only variable *names* changed).

- [ ] **Step 5: Commit**

  ```bash
  git add styles.css
  git commit -m "Rename theme CSS variables to theme-agnostic names"
  ```

---

### Task 2: Replace icon `<img>` tags with inline `currentColor` SVGs

**Files:**
- Modify: `index.html` (the three `sidebar-social` `<img>` tags, lines 64-74)
- Modify: `main.js` (`projectLinks()` function, lines 12-20)
- Modify: `build.js` (`projectLinks()` function, lines 9-17 — must be kept identical to `main.js`'s version)
- Modify: `styles.css` (remove now-dead `filter` rules and rename `img` selectors to `svg`: `.sidebar-social img`/`:hover img` at lines 130-139, `.project-links img`/`:hover img` at lines 518-526, `.other-project-card-links img`/`:hover img` at lines 814-822)
- Delete: `icons/linkedin.svg`, `icons/github.svg`, `icons/email.svg`, `icons/external.svg`
- Modify: `build.js` (remove the `copyDir('icons', 'dist/icons');` line, ~line 147)

**Interfaces:**
- Consumes: `--text-muted` / `--accent` from Task 1 (the parent `<a>` elements already set `color: var(--text-muted)` and `:hover { color: var(--accent) }` — inline SVGs with `fill="currentColor"` pick this up automatically).
- Produces: `projectLinks(p)` in both `main.js` and `build.js` keeps its existing signature (`p` = a project object with optional `.github`/`.demo` URLs) and return type (an HTML string) — only its internal markup changes from `<img src=...>` to inline `<svg>`.

- [ ] **Step 1: Replace the sidebar-social `<img>` tags in `index.html`**

  Replace:
  ```html
    <div class="sidebar-social">
      <a href="https://www.linkedin.com/in/anoofs" target="_blank" rel="noopener" aria-label="LinkedIn">
        <img src="icons/linkedin.svg" alt="LinkedIn" />
      </a>
      <a href="https://github.com/anoofs" target="_blank" rel="noopener" aria-label="GitHub">
        <img src="icons/github.svg" alt="GitHub" />
      </a>
      <a href="mailto:anoofs@gmail.com" aria-label="Email">
        <img src="icons/email.svg" alt="Email" />
      </a>
    </div>
  ```
  with:
  ```html
    <div class="sidebar-social">
      <a href="https://www.linkedin.com/in/anoofs" target="_blank" rel="noopener" aria-label="LinkedIn">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </a>
      <a href="https://github.com/anoofs" target="_blank" rel="noopener" aria-label="GitHub">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
      </a>
      <a href="mailto:anoofs@gmail.com" aria-label="Email">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.910 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
      </a>
    </div>
  ```

- [ ] **Step 2: Update `projectLinks()` in `main.js`**

  Replace:
  ```js
  function projectLinks(p) {
    const github = p.github
      ? `<a href="${p.github}" target="_blank" rel="noopener"><img src="icons/github.svg" alt="GitHub"> GitHub</a>`
      : '';
    const demo = p.demo
      ? `<a href="${p.demo}" target="_blank" rel="noopener"><img src="icons/external.svg" alt="Live Demo"> Live Demo</a>`
      : '';
    return github + demo;
  }
  ```
  with:
  ```js
  function projectLinks(p) {
    const github = p.github
      ? `<a href="${p.github}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg> GitHub</a>`
      : '';
    const demo = p.demo
      ? `<a href="${p.demo}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M14 3v2H7v14h10v-3h2v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h9l5 5v4h-2V6h-4V3h-5zm2 10h-4v-2h4V9l4 4-4 4v-4z"/></svg> Live Demo</a>`
      : '';
    return github + demo;
  }
  ```

- [ ] **Step 3: Apply the identical edit to `projectLinks()` in `build.js`**

  `build.js` (lines 9-17) has its own copy of `projectLinks()`, identical to the pre-edit version in `main.js`. Replace it the same way:
  ```js
  function projectLinks(p) {
    const github = p.github
      ? `<a href="${p.github}" target="_blank" rel="noopener"><img src="icons/github.svg" alt="GitHub"> GitHub</a>`
      : '';
    const demo = p.demo
      ? `<a href="${p.demo}" target="_blank" rel="noopener"><img src="icons/external.svg" alt="Live Demo"> Live Demo</a>`
      : '';
    return github + demo;
  }
  ```
  with:
  ```js
  function projectLinks(p) {
    const github = p.github
      ? `<a href="${p.github}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg> GitHub</a>`
      : '';
    const demo = p.demo
      ? `<a href="${p.demo}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M14 3v2H7v14h10v-3h2v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h9l5 5v4h-2V6h-4V3h-5zm2 10h-4v-2h4V9l4 4-4 4v-4z"/></svg> Live Demo</a>`
      : '';
    return github + demo;
  }
  ```
  The two files' `projectLinks()` functions must remain byte-for-byte identical.

- [ ] **Step 4: Update `styles.css` selectors and drop the now-dead `filter` rules**

  Replace:
  ```css
  .sidebar-social img {
    width: 20px;
    height: 20px;
    transition: var(--transition);
  }

  .sidebar-social a:hover img {
    /* shifts icon fill from --slate toward --teal (same hue, higher saturation/brightness) */
    filter: saturate(2) brightness(1.4);
  }
  ```
  with:
  ```css
  .sidebar-social svg {
    width: 20px;
    height: 20px;
    transition: var(--transition);
  }
  ```
  (the `<a>`'s existing `color: var(--text-muted)` / `:hover { color: var(--accent) }` now drive the icon color directly via `fill="currentColor"` — no filter needed).

  Replace:
  ```css
  .project-links img {
    width: 18px;
    height: 18px;
    transition: var(--transition);
  }

  .project-links a:hover img {
    filter: saturate(2) brightness(1.4);
  }
  ```
  with:
  ```css
  .project-links svg {
    width: 18px;
    height: 18px;
    transition: var(--transition);
  }
  ```

  Replace:
  ```css
  .other-project-card-links img {
    width: 18px;
    height: 18px;
    transition: var(--transition);
  }

  .other-project-card-links a:hover img {
    filter: saturate(2) brightness(1.4);
  }
  ```
  with:
  ```css
  .other-project-card-links svg {
    width: 18px;
    height: 18px;
    transition: var(--transition);
  }
  ```

- [ ] **Step 5: Delete the now-unused icon files and their copy step**

  ```bash
  cd "c:/Users/anoof/Downloads/dev/portfolio"
  rm icons/linkedin.svg icons/github.svg icons/email.svg icons/external.svg
  ```
  In `build.js`, remove the line `copyDir('icons',  'dist/icons');`.

- [ ] **Step 6: Verify no remaining references to the deleted icon files**

  Run: `grep -rn 'icons/' index.html main.js build.js`
  Expected: no output (zero matches).

  Run: `ls icons 2>/dev/null` (or on Windows, check the directory is empty/gone) — expected: empty or "No such file or directory" once the four files are removed (the `icons/` folder itself can remain empty or be removed, either is fine).

- [ ] **Step 7: Visual check — icons render and hover color-shift still works**

  Serve the site and load it (reuse the `python -m http.server 8791` from Task 1 if still running). Use Playwright: `browser_navigate`, then `browser_hover` on the GitHub link in `.sidebar-social`, then screenshot that element. Confirm the icon is visible in the muted color by default and shifts to the accent lime color on hover — same visual result as before, now driven by `currentColor` instead of a `filter`.

- [ ] **Step 8: Commit**

  ```bash
  git add index.html main.js build.js styles.css icons
  git commit -m "Inline icon SVGs with currentColor, remove filter-based recoloring"
  ```

---

### Task 3: Add the dark palette and dark-mode overrides for hardcoded colors

**Files:**
- Modify: `styles.css` (insert a `:root[data-theme="dark"]` block immediately after the existing `:root { ... }` block; add dark counterparts for the hardcoded rgba values in `.mobile-nav`, `.project-visual::before`, `.cursor-glow`, `.mobile-menu`; add a transition to `body`)

**Interfaces:**
- Consumes: the token names from Task 1 (`--bg`, `--bg-elevated`, `--bg-border`, `--accent`, `--accent-dim`, `--text-muted`, `--text-muted-strong`, `--text`, `--text-strong`).
- Produces: the `[data-theme="dark"]` attribute selector contract that Task 4's toggle button relies on — setting `data-theme="dark"` on `<html>` must be sufficient, on its own (no JS DOM changes needed beyond the attribute), to flip every themed color on the page.

- [ ] **Step 1: Insert the dark-mode variable block right after `:root { ... }`**

  After the closing `}` of the existing `:root { ... }` block (following Task 1's rename, this ends at line 17), insert:
  ```css
  :root[data-theme="dark"] {
    --bg:                 #0f1a0a;
    --bg-elevated:        #16240f;
    --bg-border:          #22381a;
    --accent:             #a6ff00;
    --accent-dim:         rgba(166, 255, 0, 0.10);
    --text-muted:         #9db08a;
    --text-muted-strong:  #b9cf9f;
    --text:               #d9f2c4;
    --text-strong:        #eefbdc;
  }
  ```

- [ ] **Step 2: Add dark-mode overrides for the hardcoded (non-variable) rgba values**

  Directly below the block from Step 1, add:
  ```css
  /* ── DARK MODE: non-variable overrides ──────── */
  [data-theme="dark"] .mobile-nav {
    background: rgba(22, 36, 15, 0.95);
  }

  [data-theme="dark"] .project-visual::before {
    background: rgba(166, 255, 0, 0.05);
  }

  [data-theme="dark"] .cursor-glow {
    background: radial-gradient(circle, rgba(166,255,0,0.06) 0%, transparent 70%);
  }

  [data-theme="dark"] .mobile-menu {
    box-shadow: -10px 0 30px rgba(0,0,0,0.4);
  }
  ```

- [ ] **Step 3: Add a smooth transition for the theme flip**

  In the existing `body { ... }` rule (currently: `background-color: var(--bg); color: var(--text-muted); font-family: var(--font-sans); font-size: 16px; line-height: 1.6; overflow-x: hidden;`), add:
  ```css
  transition: background-color 0.3s ease, color 0.3s ease;
  ```

- [ ] **Step 4: Verify the dark block exists and light mode is still the default**

  Run: `grep -n 'data-theme="dark"' styles.css`
  Expected: 5 matches (the `:root[data-theme="dark"]` block plus the 4 override selectors from Step 2).

- [ ] **Step 5: Manually verify the dark palette renders correctly (attribute set directly, no button yet)**

  Serve the site, navigate with Playwright, then run:
  ```js
  document.documentElement.setAttribute('data-theme', 'dark');
  ```
  via the Playwright "evaluate" tool, then screenshot the full page. Confirm: background is near-black green, cards are a slightly lighter green-black, text is light/readable, accent (links, buttons, active states) is bright lime, icons (from Task 2, using `currentColor`) recolor automatically with no further changes needed. Then remove the attribute and confirm it reverts cleanly to the light theme.

- [ ] **Step 6: Commit**

  ```bash
  git add styles.css
  git commit -m "Add dark-mode palette and non-variable color overrides"
  ```

---

### Task 4: Add the toggle button, FOUC-prevention script, and click-handling logic

**Files:**
- Modify: `index.html` (add a pre-paint theme-restore script in `<head>`; add the desktop floating toggle button as a body-level element; restructure `.mobile-nav` to wrap the menu button and a new mobile toggle button together)
- Modify: `styles.css` (add `.theme-toggle` button styles, icon show/hide rules, desktop positioning, `.mobile-nav-actions` wrapper, and hide the desktop toggle in the existing mobile media query)
- Modify: `main.js` (add `setTheme()` and the click-handler wiring)

**Interfaces:**
- Consumes: `data-theme="dark"` attribute contract from Task 3.
- Produces: `setTheme(theme)` in `main.js` — takes `'light'` or `'dark'`, sets/removes the attribute on `document.documentElement`, and writes `localStorage.theme`. Any future code needing to change theme programmatically calls this function.

- [ ] **Step 1: Add the pre-paint theme-restore script to `index.html`**

  In `<head>`, immediately before the line `<link rel="stylesheet" href="styles.css" />`, insert:
  ```html
  <script>
    (function () {
      var t = localStorage.getItem('theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    })();
  </script>
  ```

- [ ] **Step 2: Add the desktop toggle button to `index.html`**

  Immediately after `<div class="cursor-glow" id="cursorGlow"></div>` (line 31) and before the `<!-- Mobile Nav -->` comment, insert:
  ```html
  <button class="theme-toggle theme-toggle-desktop" id="themeToggleDesktop" aria-label="Toggle dark mode">
    <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
  </button>
  ```

- [ ] **Step 3: Add the mobile toggle button inside `.mobile-nav`**

  Replace:
  ```html
  <nav class="mobile-nav">
    <span class="mobile-nav-name">Anoof Shaikh</span>
    <button class="mobile-menu-btn" id="menuBtn">Menu</button>
  </nav>
  ```
  with:
  ```html
  <nav class="mobile-nav">
    <span class="mobile-nav-name">Anoof Shaikh</span>
    <div class="mobile-nav-actions">
      <button class="theme-toggle theme-toggle-mobile" id="themeToggleMobile" aria-label="Toggle dark mode">
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      </button>
      <button class="mobile-menu-btn" id="menuBtn">Menu</button>
    </div>
  </nav>
  ```

- [ ] **Step 4: Add `.theme-toggle` styles to `styles.css`**

  Add near the end of the file (before the `@media (max-width: 900px)` block):
  ```css
  /* ── THEME TOGGLE ────────────────────────────── */
  .theme-toggle {
    background: none;
    border: 1px solid var(--bg-border);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    transition: var(--transition);
  }

  .theme-toggle:hover {
    color: var(--accent);
    border-color: var(--accent);
  }

  .theme-toggle .icon-sun { display: none; }
  [data-theme="dark"] .theme-toggle .icon-moon { display: none; }
  [data-theme="dark"] .theme-toggle .icon-sun { display: block; }

  .theme-toggle-desktop {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 150;
  }

  .mobile-nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  ```

- [ ] **Step 5: Hide the desktop toggle on mobile widths**

  In the existing `@media (max-width: 900px) { ... }` block, add:
  ```css
  .theme-toggle-desktop { display: none; }
  ```
  (`.theme-toggle-mobile` needs no explicit hiding rule at desktop widths — it's already inside `.mobile-nav`, which is `display: none` by default and only becomes visible inside this same media query.)

- [ ] **Step 6: Add the toggle logic to `main.js`**

  At the end of `main.js` (after the existing `window.closeMobileMenu = ...` block), add:
  ```js
  // Theme toggle
  function setTheme(theme) {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', theme);
  }

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'light' : 'dark');
    });
  });
  ```

- [ ] **Step 7: Verify the markup and script wiring are in place**

  Run: `grep -n 'theme-toggle\|setTheme\|localStorage' index.html main.js`
  Expected: matches for both toggle button blocks in `index.html`, and for `setTheme`/`localStorage.setItem`/`localStorage.getItem` in `main.js`.

- [ ] **Step 8: End-to-end browser verification (desktop)**

  Serve the site and use Playwright:
  1. `browser_navigate` to the page fresh (clear localStorage first via `browser_evaluate`: `() => localStorage.clear()`, then reload).
  2. Screenshot: confirm light theme, moon icon visible on the desktop toggle (top-right).
  3. `browser_click` the desktop toggle.
  4. Screenshot: confirm dark theme applied (background, cards, text, accent all switched), sun icon now visible.
  5. `browser_evaluate`: `() => localStorage.getItem('theme')` — expect `'dark'`.
  6. `browser_navigate` to the same URL again (fresh navigation, simulating reload).
  7. Screenshot immediately: confirm it loads directly into dark mode with no flash of light theme first.
  8. Click the toggle again, confirm it returns to light and `localStorage.getItem('theme')` returns `'light'`.

- [ ] **Step 9: End-to-end browser verification (mobile)**

  1. `browser_resize` to `{ width: 390, height: 700 }`.
  2. Screenshot: confirm the mobile nav bar shows the site name, the theme toggle, and the Menu button, all readable and not overlapping.
  3. `browser_click` the mobile theme toggle (`#themeToggleMobile`).
  4. Screenshot: confirm dark theme applies same as desktop, sun icon now visible on the mobile toggle.
  5. Open the mobile menu (`#menuBtn`) and screenshot: confirm the mobile menu panel also reflects dark colors correctly.

- [ ] **Step 10: Clean up any local screenshots/server started for verification**

  Stop the local static server and remove any temporary screenshot files created during manual verification steps (do not commit them).

- [ ] **Step 11: Commit**

  ```bash
  git add index.html styles.css main.js
  git commit -m "Add light/dark theme toggle with persisted preference"
  ```

---

## Post-implementation

After Task 4, the feature is complete: light theme unchanged from before, dark theme available via either toggle button, choice persisted across reloads with no flash. No further tasks are needed — `build.js` was already kept in sync during Task 2 (the only file it duplicates logic from), and Tasks 1/3/4 only touch `styles.css`/`index.html`/`main.js`, which `build.js` copies or reads as a template verbatim.
