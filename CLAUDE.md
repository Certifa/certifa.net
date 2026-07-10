# CLAUDE.md — Certifa (certifa.net)

## Project

Multi-page portfolio and writeup hub for Mike (**Certifa**), an offensive-security student and pentester. Dark, monochrome, professional. Shell pages (home, about, projects, contact) carry the visual flair; writeup pages stay clean for reading.

This site is a signal to recruiters, hiring managers, and CTF teams, so polish is load-bearing, not cosmetic. Built with Astro (static output), deployed to **certifa.net** via GitHub Pages.

No database, no auth, no server-side code in this repo. The only backend touchpoint is a Cloudflare Worker for the contact form (see below). If a change seems to need a database, auth, or a server, stop and ask: it belongs elsewhere.

## Working style

This is a living project, improved continuously. The standing goal is "more beautiful, more technical, more polished." Every change should raise the bar, not just satisfy the letter of the request.

- Read the existing design tokens, CSS, and components before touching anything. Build on the established aesthetic, sharpen it, don't replace it. Cohesion beats novelty.
- Taste bar: intentional typography and spacing, real visual hierarchy, and one high-impact motion moment per view (a staggered reveal, a scroll trigger, a surprising hover) over scattered micro-animations. Restraint where it counts.
- Never regress performance, accessibility, or mobile layout to chase an effect. Keyboard nav and clean mobile layouts are part of the quality bar.
- If you spot a bad assumption in a request or a better approach, say so before building. Flag it rather than silently obey.

## Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| **Framework** | Astro 5 | Static output, markdown-native, zero-JS by default |
| **Styling** | Tailwind (`@astrojs/tailwind`) + scoped CSS | Mostly per-component scoped styles + CSS custom properties in `global.css`; Tailwind available but used lightly |
| **Animations** | CSS + IntersectionObserver | Scroll-reveal fade-ups, hover lifts. No JS animation libraries |
| **Content** | Astro Content Collections | Markdown writeups with frontmatter become pages |
| **Code Highlighting** | Shiki (build-time) | `github-dark` theme, `wrap: true` |
| **Diagrams** | Mermaid (client-side) | Loaded from CDN in `WriteupLayout`, only when a writeup contains a `mermaid` code block |
| **Fonts** | Google Fonts | Bricolage Grotesque (display headings), Geist (body/UI), JetBrains Mono (mono), Instrument Serif (page-title accent only) |
| **Contact form** | Cloudflare Worker | Home + contact forms POST to `forms.certifa.net` (`localhost:8787` in dev) |
| **Deployment** | GitHub Actions → GitHub Pages | Auto-deploy on push to `main`; `public/CNAME` → certifa.net |

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
│       └── global.css            ← Theme tokens, base styles, shared pills/tags, writeup prose, TOC, locked-writeup notice
├── scripts/
│   └── fetch-htb-activity.mjs    ← Pulls HTB activity → public/data/heatmap.json (run by the heatmap workflow, not by hand)
├── .github/workflows/
│   ├── deploy.yml                ← Build with Astro + deploy to GitHub Pages (on push to main)
│   └── heatmap-update.yml        ← Cron 4×/day: refresh heatmap.json, which re-triggers deploy
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

Page styles live in `<style>` blocks inside each `.astro` file (scoped). Only cross-page primitives (pills, tags, buttons, writeup prose, TOC, page-head, locked notice) live in `global.css`.

## Commands

Treat `package.json` scripts as the source of truth.
- `npm run dev` — local dev server at `localhost:4321`
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the build locally

Node/npm are installed on this machine; `npm run dev` works. There is no `gh` CLI.

**Deployment is push-to-deploy via GitHub Actions.** The Pages source is set to "GitHub Actions" (not "deploy from a branch"), so `.github/workflows/deploy.yml` builds the site with Astro and publishes it to GitHub Pages (`actions/deploy-pages`) on every push to `main`. `public/CNAME` maps Pages to certifa.net. GitHub Actions is the pipeline; GitHub Pages is the host. **Pushing to `main` deploys the live site immediately, so only push when explicitly asked.**

A second workflow, `.github/workflows/heatmap-update.yml`, runs on a cron (4× per day) and via `workflow_dispatch`. It executes `scripts/fetch-htb-activity.mjs` (using Discord bot secrets) and commits `public/data/heatmap.json` when it changes. That commit re-triggers the deploy workflow, so the home heatmap refreshes on its own. Don't hand-edit `heatmap.json`.

## Writeup Content System

### Frontmatter schema
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

### Content collection config (src/content/config.ts)
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

### Writeup page features (WriteupLayout)
- Table of contents from H2/H3 headings (sticky sidebar on desktop, collapsible drawer on mobile)
- Copy button on every code block
- Reading-time estimate (computed in `[...slug].astro`; strips HTML/`<style>` so markup doesn't inflate the count)
- Difficulty badge + platform + date + tags in the header
- "Back to writeups" links (top and bottom). No prev/next navigation currently
- Active-heading highlight in the TOC via IntersectionObserver
- Wide tables wrapped for horizontal scroll; Mermaid diagrams rendered client-side

### Writeup listing (writeups/index.astro)
- Filter chips: All / Easy / Medium / Hard / Insane / Featured (chips only appear when that count > 0)
- Sorted by date, newest first
- Row list (not cards); numbers renumber when filtered. No free-text search

### Active-machine (locked) writeups
HTB's streaming policy forbids publishing walkthroughs for machines that are still active. Boxes that aren't retired yet ship as a **locked notice** instead of a full writeup:
- The markdown body is a single `<div class="wu-locked">…</div>` (kicker + heading + copy + a link to HTB's policy). No inline `<style>`, no per-file CSS.
- All styling lives in one `.wu-locked` block in `global.css`, built from theme tokens. Do not reintroduce hardcoded colors or a separate font.
- Frontmatter still uses a real title/date/tags; `description` is the placeholder "Active HackTheBox machine. Full writeup published after retirement."
- When a box retires, replace the locked `<div>` with the real writeup. Any writeup whose Overview table says `Status: Active` is one to double-check against this policy.

## Design Direction

### Aesthetic
- **Dark, near-black monochrome** (`#0a0a0a` base) with a **single electric-azure accent**. No cyan/purple, no multi-color neon.
- **Restrained terminal touches**: mono `// section-label` metas, a typing terminal card on the home hero, a blinking cursor. Subtle, not edgy.
- **Two modes**: shell pages get flair (animated hero background, hover lifts); writeup pages stay clean for reading.
- **Serif is rationed**: Instrument Serif italic appears only in the accent word of a page title, at most once per page. Do not sprinkle it across section headings or body copy.

### Color Palette (from global.css — keep this doc in sync when tokens change)
```css
:root {
  --bg:        #0a0a0a;
  --bg-2:      #111111;
  --bg-3:      #161616;
  --line:      #1f1f1f;
  --line-2:    #2a2a2a;
  --fg:        #ededed;
  --fg-2:      #a0a0a0;
  --fg-3:      #6b6b6b;
  --fg-4:      #4a4a4a;
  --accent:    oklch(0.74 0.15 248);   /* electric azure */
  --accent-2:  oklch(0.62 0.15 248);
  --warn:      oklch(0.78 0.13 40);
  --font-display: 'Bricolage Grotesque', 'Geist', sans-serif;
}
```

### Typography
- **Display (Bricolage Grotesque)** via `--font-display`: hero name, section titles, page titles, writeup titles, card names.
- **Sans (Geist)**: body, descriptions, buttons, UI.
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
- Keep only the fonts in use in the Google Fonts request (Bricolage Grotesque, Geist, JetBrains Mono, Instrument Serif).

## Content Tone

- First person, confident but not arrogant. Mike is presented as an offensive-security **student** (this is deliberate positioning across the site, e.g. "a student who breaks things for a grade"). Keep that framing.
- Technical but accessible: recruiters and hackers should both get it.
- Short sentences, active voice. English (Mike is a Dutch speaker).
- **Active Directory, Linux, and web are presented as three equal focus areas.** Do not frame the work as Windows/AD-only.
- **No fabricated liveness**: no fake uptime, "session active," live counters, or response-time promises. Derive any numbers from real data (e.g. writeup count from the content collection).
- **At most one clever/quippy line per page**; everything else plain and specific.
- **No em dashes (—).** They read as AI. Use a colon for label/heading/caption cases, a comma for mid-sentence pauses, a period where a full stop reads better, and → for arrows.

## Code Conventions

- Astro components: logic in frontmatter, markup lean, styles scoped. Prefer native Astro/HTML/CSS over framework islands unless interactivity genuinely needs it.
- Semantic HTML5; CSS custom properties for all theme values (never hardcode a hex that a token already covers).
- TypeScript for the content collection config and inline scripts.
- Match existing file structure and naming. No jQuery, no heavy animation libraries, no unnecessary dependencies.
- Write clean, self-contained components a future reader can grasp at a glance.

## Guardrails

- Small, focused changes over sweeping rewrites. If a task balloons in scope, pause and re-scope.
- **Confirm before anything hard to reverse or outward-facing**: deploying/pushing to `main`, deleting files, or adding a dependency. A static site's assets are easy to misjudge as unused, so never delete without confirmation.
- Routine, in-scope edits (styling, copy, a component tweak) don't need pre-approval, but keep me oriented: say what you're about to do, and surface anything surprising you find along the way.
- If you spot a better approach than what was asked, propose it first.

## What NOT to Do

- No Three.js (the hero is CSS).
- No templates or template-looking designs; no AI-slop tells (serif-accent-word on every heading, pulsing "available" dots, decorative 01/02/03 numbering on non-sequences, fake terminal liveness).
- No excessive glow hurting readability.
- No autoplaying sound or video.
- No Lorem ipsum; real or realistic content always.
- No client-side JS where Astro handles it at build time.
- No cookie banners or popups.
