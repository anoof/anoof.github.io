# Light/Dark Theme Switcher — Design

## Context

The portfolio was recently retheme'd to a light "sage-lime" palette (see `2026-08-03` lime retheme work): a soft lime-tinted background (`#ecfccb`) with a lime-green accent (`#65a30d`), replacing the original dark navy/teal theme. The user now wants a theme switcher so visitors can toggle between that light theme and a new dark counterpart, with a control in the top-right of the page.

## Goals

- Add a dark-mode variant of the site that feels like the same brand as the light theme (lime accent throughout), not an unrelated palette.
- Add a toggle control (icon button, sun/moon) that switches between light and dark.
- Default to light on first visit; remember the user's explicit choice on return visits.
- No flash of the wrong theme on load.

## Non-goals

- No "system preference" auto-detection on first visit (explicitly declined — light is always the default until the user toggles).
- No animated icon morph — a simple swap between two static inline SVGs (sun/moon) is sufficient.

## Design

### 1. Toggle placement & control

Two `.theme-toggle` button instances exist in the DOM, following the codebase's existing pattern of duplicating nav elements for desktop vs. mobile layouts (see `#navLinks` vs `.mobile-menu` links):

- **Desktop** (viewport ≥ 900px): a `position: fixed` icon button pinned to the top-right of the viewport (`top: 24px; right: 24px;` or similar), floating above page content. There's no existing top bar in the desktop sidebar layout, so this is a new floating element.
- **Mobile** (< 900px): a button placed inside the existing `.mobile-nav` bar (which already uses `justify-content: space-between`), between `.mobile-nav-name` and `#menuBtn`.

Both buttons share class `.theme-toggle` and are wired to the same click handler via `document.querySelectorAll('.theme-toggle')`. Each button contains two inline `<svg>` icons (moon and sun); only one is visible at a time, controlled purely by CSS keyed off `[data-theme="dark"]` (no JS DOM swapping of icons):

```html
<button class="theme-toggle" aria-label="Toggle dark mode">
  <svg class="icon-moon" ...>...</svg>
  <svg class="icon-sun" ...>...</svg>
</button>
```

```css
.theme-toggle .icon-sun { display: none; }
[data-theme="dark"] .theme-toggle .icon-moon { display: none; }
[data-theme="dark"] .theme-toggle .icon-sun { display: block; }
```

The icon shown is the *target* theme (moon visible in light mode = "click to go dark"; sun visible in dark mode = "click to go light").

### 2. Theme state & persistence

- State lives as `data-theme="dark"` on `<html>`. Absence of the attribute (or any other value) means light.
- Clicking any `.theme-toggle` flips the attribute and writes the choice to `localStorage.theme` (`'light'` or `'dark'`).
- To avoid a flash of light-theme-then-dark on repeat visits, a small inline `<script>` is placed in `<head>`, before `styles.css` loads:

```html
<script>
  (function () {
    var t = localStorage.getItem('theme');
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  })();
</script>
```

- `main.js` (loaded later, at the end of `<body>`) owns the click-handling logic:

```js
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

### 3. Token rename + dark palette

The existing CSS custom properties in `styles.css` (`:root`) are still named after the *original* navy/teal theme even though they now hold lime values (e.g. `--navy: #ecfccb`). Since this change formalizes a real two-theme system, the tokens are renamed to theme-agnostic names as part of this work:

| Old name | New name |
|---|---|
| `--navy` | `--bg` |
| `--navy-light` | `--bg-elevated` |
| `--navy-mid` | `--bg-border` |
| `--teal` | `--accent` |
| `--teal-dim` | `--accent-dim` |
| `--slate` | `--text-muted` |
| `--slate-light` | `--text-muted-strong` |
| `--white` | `--text` |
| `--white-pure` | `--text-strong` |

All `var(--old-name)` references throughout `styles.css` are updated to the new names (mechanical rename, no behavior change for light mode).

```css
:root {                          /* light (default) */
  --bg: #ecfccb;
  --bg-elevated: #f7fee7;
  --bg-border: #d9f99d;
  --accent: #65a30d;
  --accent-dim: rgba(101, 163, 13, 0.10);
  --text-muted: #56683a;
  --text-muted-strong: #46551f;
  --text: #2f3b1a;
  --text-strong: #22330f;
}

:root[data-theme="dark"] {
  --bg: #0f1a0a;
  --bg-elevated: #16240f;
  --bg-border: #22381a;
  --accent: #a6ff00;
  --accent-dim: rgba(166, 255, 0, 0.10);
  --text-muted: #9db08a;
  --text-muted-strong: #b9cf9f;
  --text: #d9f2c4;
  --text-strong: #eefbdc;
}
```

Hardcoded rgba values elsewhere in `styles.css` that reference the light palette directly (not through a variable) get dark-mode counterparts gated by `[data-theme="dark"]`:

- `.mobile-nav` background (`rgba(247, 254, 231, 0.95)` light) → dark: `rgba(22, 36, 15, 0.95)`
- `.project-visual::before` glow (`rgba(101, 163, 13, 0.06)` light) → dark: `rgba(166, 255, 0, 0.05)`
- `.cursor-glow` gradient (`rgba(101, 163, 13, 0.08)` light) → dark: `rgba(166, 255, 0, 0.06)`
- `.mobile-menu` box-shadow (`rgba(0,0,0,0.12)` light) → dark: `rgba(0,0,0,0.4)` (a light shadow disappears against a dark panel; dark mode needs a stronger shadow to read as elevated)

### 4. Icon handling refactor

Currently `sidebar-social`, `project-links`, and `other-project-card-links` icons are `<img src="icons/x.svg">`, where the SVG file has a hardcoded `fill="#56683a"` baked in (set during the earlier lime retheme), plus a CSS `filter: saturate(2) brightness(1.4)` hack on `:hover` to shift toward the accent color. This only handles 2 states and doesn't extend to a second theme (4 states: light-default, light-hover, dark-default, dark-hover) without another round of filter guessing.

Since `currentColor` doesn't resolve through an `<img>` (the SVG is fetched as an isolated document), the fix is to inline the SVG markup directly wherever these icons are used, with `fill="currentColor"`:

- `index.html`: the three sidebar-social `<img>` tags (LinkedIn, GitHub, Email) become inline `<svg fill="currentColor">...</svg>` using the existing path data from `icons/linkedin.svg`, `icons/github.svg`, `icons/email.svg`.
- `main.js` `projectLinks()`: the GitHub/external-link `<img>` tags become inline SVG strings (same path data, from `icons/github.svg` and `icons/external.svg`).
- `build.js` `projectLinks()`: mirrored identically (it currently duplicates `main.js`'s function; same edit applies).

The parent `<a>` elements already set `color: var(--text-muted)` and `:hover { color: var(--accent) }` (previously `--slate`/`--teal`) — with `fill="currentColor"`, the icon color now follows those rules automatically in both themes and both states, with zero filters. The now-unused `filter` rules on `.sidebar-social img`, `.project-links img`, `.other-project-card-links img` (and their `:hover` variants) are removed. Since nothing will reference the `icons/` directory after this change, the standalone `icons/*.svg` files (`linkedin.svg`, `github.svg`, `email.svg`, `external.svg`) are deleted, along with `build.js`'s `copyDir('icons', 'dist/icons')` call — no reason to ship dead assets.

### 5. Transition

Add to `body`:

```css
transition: background-color 0.3s ease, color 0.3s ease;
```

so the theme flip fades rather than snapping. Most interactive elements (buttons, cards, nav links) already carry `transition: var(--transition)` (`all 0.25s cubic-bezier(...)`), which will pick up their own background/color/border swaps automatically since `--bg-elevated`, `--accent`, etc. change value under the new `[data-theme="dark"]` block.

## Files touched

- `styles.css` — token rename, dark-mode `:root[data-theme="dark"]` block, dark rgba counterparts, remove icon `filter` rules, add toggle button styles (desktop fixed position + mobile inline), body transition.
- `index.html` — inline `<script>` in `<head>` for pre-paint theme restore; toggle button markup (desktop + mobile); inline SVG icons replacing sidebar-social `<img>` tags.
- `main.js` — `projectLinks()` returns inline SVG instead of `<img>`; theme toggle click-handling logic.
- `build.js` — mirror the `projectLinks()` inline-SVG change (keeps dev/prod output identical, per its existing "mirror main.js logic" comment).
- `icons/*.svg` — deleted (linkedin.svg, github.svg, email.svg, external.svg), along with the `copyDir('icons', 'dist/icons')` line in `build.js`.

## Verification

- Load the site fresh (cleared localStorage): confirm light theme, moon icon showing.
- Click toggle (desktop and, separately, resize to mobile and click the mobile toggle): confirm dark theme applies — background, cards, borders, accent, text all switch; icon flips to sun; hover states on nav/buttons/icons still read correctly against the dark background.
- Reload the page after toggling to dark: confirm it stays dark (localStorage persisted) with no flash of light theme before dark applies.
- Toggle back to light, reload: confirm it stays light.
- Check icon hover color shift (muted → accent) still works correctly in both themes now that it's driven by `currentColor` instead of filters.
- Resize across the 900px breakpoint to confirm both toggle instances (desktop floating button, mobile bar button) are present/hidden correctly and both work.
