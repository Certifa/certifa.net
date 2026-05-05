# certifa.github.io

Source for [certifa.net](https://certifa.net) — my offensive security portfolio and writeup hub.

## Stack

- [Astro](https://astro.build) static site, [Tailwind CSS](https://tailwindcss.com), Three.js for the home hero
- Writeups as Markdown in `src/content/writeups/`, rendered via Astro Content Collections
- [Shiki](https://shiki.style) for syntax highlighting at build time
- Deployed to GitHub Pages via [`actions/deploy-pages`](https://github.com/actions/deploy-pages)

## Local development

```bash
npm install
npm run dev    # http://localhost:4321
npm run build  # static output to dist/
```

## Adding a writeup

Drop a Markdown file into `src/content/writeups/` with frontmatter:

```yaml
---
title: "Box Name"
date: 2026-05-05
tags: [web, privesc, AD]
difficulty: medium       # easy | medium | hard | insane
platform: HTB            # HTB | THM | CTF | Other
description: "One-line summary"
featured: false
---
```

Astro auto-generates the page at `/writeups/<slug>`. Schema lives in `src/content/config.ts`.

## Heatmap

The "Boxes pwned · last 26 weeks" widget on the home page reads HTB activity from `public/data/heatmap.json`. A scheduled GitHub Action (`.github/workflows/heatmap-update.yml`) pulls fresh events from a Discord channel that mirrors HTB Updates.

---

Reach me at `mike@certifa.net`.
