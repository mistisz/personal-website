# Personal website

Static site — no build step, no dependencies.

## Customize
- **Content** (name, email, socials, projects, skills, interests): edit `content.js`.
- **Bio, stats, headline**: edit `index.html` (`#about`, `.hero`).
- **Colors**: CSS variables at the top of `styles.css` (`--accent`, `--bg`, `--text`, plus the `[data-theme="dark"]` block).
- **Page title/meta**: `<head>` in `index.html`.

## Motion
- `motion.css` + `motion.js` hold all animation (intro curtain, split-text headings, spring physics for cards/buttons, parallax, particles, nav indicator, theme transition). Plain JS, no library.
- Everything respects `prefers-reduced-motion`; to disable a feature, delete its block in `motion.js`.
- Tweak feel via the `step(spring, target, dt, stiffness, damping)` calls in `motion.js` (higher damping = calmer).

## Preview
```
python -m http.server 4173
```

## Deploy
Upload the folder to any static host:
- **GitHub Pages**: push to a repo → Settings → Pages → deploy from branch `main` / root.
- **Netlify / Vercel / Cloudflare Pages**: drag-and-drop the folder, no build command, publish directory `/`.
