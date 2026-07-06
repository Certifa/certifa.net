# Certifa — Portfolio & Writeup Hub

## Project Overview

Multi-page portfolio and writeup site for Mike (Certifa), an offensive security student and pentester. Dark, monochrome, professional aesthetic. Shell pages (home, about, projects, contact) carry the visual flair; writeup pages stay clean for reading. Built with Astro static output, deployed to **certifa.net** (custom domain) via GitHub Pages.

## Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| **Framework** | Astro 5 | Static output, markdown-native, zero-JS by default |
| **Styling** | Tailwind (`@astrojs/tailwind`) + scoped CSS | Mostly per-component scoped styles + CSS custom properties in `global.css`; Tailwind available but used lightly |
| **Animations** | CSS + IntersectionObserver | Scroll-reveal fade-ups, hover lifts. No JS animation libraries |
| **Content** | Astro Content Collections | Markdown writeups with frontmatter become pages |
| **Code Highlighting** | Shiki (build-time) | `github-dark` theme, `wrap: true` |
| **Diagrams** | Mermaid (client-side) | Loaded from CDN in `WriteupLayout`, only when a writeup contains a `mermaid` code block |
| **Fonts** | Google Fonts | Geist (sans), JetBrains Mono (mono), Instrument Serif (page-title accent only) |
| **Contact form** | Cloudflare Worker | Home + contact forms POST to `forms.certifa.net` |
| **Deployment** | GitHub Actions → GitHub Pages | Auto-deploy on push to `main`; CNAME → certifa.net |

**No Three.js.** The home hero uses a pure-CSS animated dot-grid background, not WebGL. Do not add Three.js.

## Site Structure

```
/                    → Home (hero + terminal card + recent writeups + projects + about strip + heatmap + contact)
/about               → Bio + fact sidebar + focus-area grid
/projects            → Featured rows + project grid
/writeups            → Writeup listing with difficulty/featured filters
/writeups/[slug]     → Individual writeup (rendered from markdown)
/contact             → Contact channels + availability
```

There is **no** `/skills` page.

## Astro Project Structure

```
certifa.github.io/
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro      ← HTML shell, nav, footer, noise overlay, meta/OG tags, scroll-reveal + copy-to-clipboard scripts
│   │   └── WriteupLayout.astro   ← Clean reading layout: header meta, TOC sidebar, copy buttons, active-heading tracking, Mermaid
│   ├── components/
│   │   ├── Nav.astro             ← Sticky blur nav, active page, mobile hamburger, brand logo (C-with-wink)
│   │   └── Footer.astro
│   ├── content/
│   │   ├── config.ts             ← Content collection schema (writeups)
│   │   └── writeups/             ← Drop .md files here; they become pages
│   ├── pages/
│   │   ├── index.astro           ← Home (all sections + inline styles + client scripts)
│   │   ├── about.astro
│   │   ├── projects.astro
│   │   ├── contact.astro
│   │   └── writeups/
│   │       ├── index.astro       ← Listing with filter chips
│   │       └── [...slug].astro   ← Dynamic route; computes reading time, passes to WriteupLayout
│   └── styles/
│       └── global.css            ← Theme tokens, base styles, shared pills/tags, writeup prose, TOC
├── public/
│   ├── images/writeups/<box>/    ← Writeup screenshots
│   ├── data/heatmap.json         ← Real HTB activity feeding the home heatmap
│   ├── favicon.svg
│   ├── og-v2.png                 ← Social share card
│   └── CNAME                     ← certifa.net
├── astro.config.mjs
├── tailwind.config.cjs
├── tsconfig.json
└── package.json
```

Page styles live in `<style>` blocks inside each `.astro` file (scoped). Only cross-page primitives (pills, tags, buttons, writeup prose, TOC, page-head) live in `global.css`.

## Writeup Content System

### Frontmatter schema:
```yaml
---
title: "Box Name"
date: 2025-12-15
tags: [web, privesc, AD]
difficulty: easy | medium | hard | insane
platform: HTB | THM | CTF | Other
description: "One-line summary"
featured: true | false
---
```

### Content collection config (src/content/config.ts):
```typescript
import { defineCollection, z } from 'astro:content';

const writeups = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    difficulty: z.enum(['easy', 'medium', 'hard', 'insane']),
    platform: z.enum(['HTB', 'THM', 'CTF', 'Other']),
    description: z.string(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { writeups };
```

### Writeup page features (WriteupLayout):
- Table of contents from H2/H3 headings (sticky sidebar on desktop, collapsible drawer on mobile)
- Copy button on every code block
- Reading-time estimate (computed in `[...slug].astro`)
- Difficulty badge + platform + date + tags in the header
- "Back to writeups" links (top and bottom). No prev/next navigation currently
- Active-heading highlight in the TOC via IntersectionObserver
- Wide tables wrapped for horizontal scroll; Mermaid diagrams rendered client-side

### Writeup listing (writeups/index.astro):
- Filter chips: All / Easy / Medium / Hard / Insane / Featured (chips only appear when that count > 0)
- Sorted by date, newest first
- Row list (not cards); numbers renumber when filtered. No free-text search

## Design Direction

### Aesthetic
- **Dark, near-black monochrome** (`#0a0a0a` base) with a **single sky-blue accent**. No cyan/purple, no multi-color neon.
- **Restrained terminal touches**: mono `// section-label` metas, a typing terminal card on the home hero, a blinking cursor. Kept subtle, not edgy.
- **Two modes**: shell pages get flair (animated hero background, hover lifts); writeup pages stay clean for reading.
- **Serif is rationed**: Instrument Serif italic appears only in the accent word of a page title, at most once per page. Do not sprinkle it across section headings or body copy.

### Color Palette (from global.css)
```css
:root {
  --bg:      #0a0a0a;
  --bg-2:    #111111;
  --bg-3:    #161616;
  --line:    #1f1f1f;
  --line-2:  #2a2a2a;
  --fg:      #ededed;
  --fg-2:    #a0a0a0;
  --fg-3:    #6b6b6b;
  --fg-4:    #4a4a4a;
  --accent:   oklch(0.82 0.12 220);  /* sky */
  --accent-2: oklch(0.65 0.12 220);
  --warn:     oklch(0.78 0.13 40);
}
```

### Typography
- **Sans (Geist)**: headings, body, descriptions, buttons.
- **Mono (JetBrains Mono)**: nav-adjacent labels, section metas, code, dates, badges.
- **Serif (Instrument Serif, italic)**: page-title accent word only.
- **Writeup prose**: Geist at 17px, 1.8 line height, max-width 760px.

### Visual Effects
- Subtle SVG noise overlay (fixed, `pointer-events: none`, ~3.5% opacity).
- Scroll-triggered fade-up reveals via IntersectionObserver (`[data-reveal]`).
- Card hover: slight `translateY` lift, border/background shift.
- Home hero: CSS animated dot-grid + a single falling accent line.
- **No** scanlines, **no** cursor glow, **no** pulsing status dots (status dots are static).

### Writeup Page Styling
- Minimal: no noise-heavy chrome, no hero flair.
- Custom prose classes in `global.css` (`.prose-writeup`).
- Code blocks: Shiki `github-dark`, dark bg matching the theme.
- Emphasis (`em`) renders as plain italic in body color, not serif/accent.

## Responsive Design — MANDATORY

- **Mobile-first**: design for 375px, then scale up.
- Breakpoints roughly: 600–640px, 768px, 900–1000px, 1200px.
- Touch targets min 44px; inputs use 16px font on mobile to stop iOS zoom.
- Nav collapses to a hamburger drawer under ~860px.
- Writeup TOC: collapsible drawer on mobile, sticky sidebar on desktop.

## Performance Rules

- Astro zero-JS by default; add client scripts only where needed (home interactions, writeup TOC/copy, Mermaid).
- Mermaid is imported from CDN only when a writeup actually contains a diagram.
- Lazy-load images where practical.
- Shiki highlighting at build time, not client-side.
- Keep only the fonts in use in the Google Fonts request (Geist, JetBrains Mono, Instrument Serif).

## Deployment

`astro.config.mjs` sets `site: 'https://certifa.net'`, `output: 'static'`, the Tailwind integration, and Shiki `github-dark` with `wrap: true`. GitHub Actions auto-deploys on push to `main`; `public/CNAME` maps the Pages site to certifa.net. **Pushing to `main` deploys immediately — only push when asked.**

Local preview: `npm run dev` (serves at localhost:4321). Node/npm are installed on this machine.

## Code Standards

- Astro components with scoped styles; shared primitives in `global.css`.
- Semantic HTML5; CSS custom properties for all theme values.
- TypeScript for the content collection config and inline scripts.
- No jQuery, no heavy animation libraries, no unnecessary dependencies.

## Content Tone

- First person, confident but not arrogant.
- Technical but accessible: recruiters and hackers should both get it.
- Short sentences, active voice. English (Mike is a Dutch speaker).
- **Active Directory, Linux, and web are presented as three equal focus areas.** Do not frame the work as Windows/AD-only.
- **No fabricated liveness** (no fake uptime, "session active", live counters, or response-time promises). Derive any numbers from real data, e.g. writeup count from the content collection.
- **At most one clever/quippy line per page**; everything else plain and specific.
- **No em dashes (—).** They read as AI. Use a colon for label/heading/caption cases, a comma for mid-sentence pauses, a period where a full stop reads better, and → for arrows.

## What NOT to Do

- No Three.js (the hero is CSS).
- No templates or template-looking designs; no AI-slop tells (serif-accent-word on every heading, pulsing "available" dots, decorative 01/02/03 numbering on non-sequences, fake terminal liveness).
- No excessive glow hurting readability.
- No autoplaying sound or video.
- No Lorem ipsum; real or realistic content always.
- No client-side JS where Astro handles it at build time.
- No cookie banners or popups.
