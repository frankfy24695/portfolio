# Yuan Fang — Portfolio

A dark, premium single-page portfolio site. Pure static HTML/CSS/JS — no build
step, no frameworks. All asset paths are relative, so it works as-is from a
GitHub Pages repo root.

## Files

| File        | What it does                                                     |
|-------------|------------------------------------------------------------------|
| `index.html`| Page structure: sidebar, project grid, footer                     |
| `styles.css`| Dark theme, layout, responsive rules, grain, custom scrollbar    |
| `script.js` | Canvas animations, live Beijing clock, 😮 cursor follower         |

## Customizing

**Name / bio / email** — in `index.html`:
- Sidebar heading: the `<h1 class="name">` block
- Page title: the `<title>` tag, plus the `<meta name="description">`
- Bio paragraph: `<p class="bio">`
- Footer lines: `.side-footer` and `.work-foot-note`
- Contact email: both `mailto:hello@yuanfang.design` links (the sidebar
  "Let's talk" pill and the wide footer button)

**Projects** — each project is an `<article class="card">` in `index.html`.
Edit the `<h3>` title, the `.tag` category, and the `.year`. To reorder or
change the modular rhythm, swap the `span-tall` / `span-mid` / `span-short`
classes (they control how many grid rows a card spans on desktop).

**Canvas animations** — each card's `<canvas data-anim="…">` maps to a
function in `script.js` (`aurora`, `marquee`, `wireframe`, `particles`,
`blob`, `waves`). Rename the `data-anim` value to swap animations between
cards.

**Replacing a canvas with a video** — drop your `.mp4` next to `index.html`
and swap the canvas for:

```html
<video autoplay muted loop playsinline src="your-project.mp4"></video>
```

It fills `.card-media` the same way. (No `script.js` changes needed — the
animation registry only touches `<canvas data-anim>` elements.)

**Recognition / Services / Socials** — plain `<li>` lists in the sidebar
sections of `index.html`. Social links currently point to `#`; replace each
`href` with the real profile URL.

**Accent color** — one variable in `styles.css`: `--accent: #d4ff3f`.
The canvas animations reference `#d4ff3f` directly in `script.js`; keep the
two in sync if you change it.

## The 😮 cursor effect

Any element with class `talk-btn` triggers it: on hover the native cursor is
hidden (`body.face-on * { cursor: none }`) and a large 😮 in a fixed div
follows the mouse with lerped lag plus a slight velocity tilt. Tune the
follow speed in `script.js` (the `0.18` lerp factors) and the emoji size in
the `.cursor-face` rule in `styles.css`.

## Deploying to GitHub Pages

1. Create a repo and push these files to its root (`main` branch).
2. In the repo: **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.
3. Your site goes live at `https://<username>.github.io/<repo>/`.
