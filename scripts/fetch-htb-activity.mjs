#!/usr/bin/env node
// Read the "HTB Updates" Discord bot's messages out of a private channel
// dedicated to Certifa's HTB activity, then build a 26-week × 7-day heatmap
// and write it to public/data/heatmap.json.
//
// HTB Updates posts each solve/own as a single rendered PNG (e.g. solve.png,
// root.png) — the "Certifa | Just solved X" line is baked into the image,
// not into message text/embeds/components. We therefore identify events by
// (author = HTB Updates bot) + (image attachment), not by tekst-matching.
//
// Required env:
//   DISCORD_BOT_TOKEN   — token of a reader bot invited to the server
//   DISCORD_CHANNEL_ID  — id of the channel where HTB Updates posts

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT  = resolve(ROOT, 'public/data/heatmap.json');

const TOKEN      = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

const HTB_UPDATES_BOT_ID = '806824180074938419';
const HTB_USER           = 'Certifa';
const HTB_USER_ID        = '444744';

if (!TOKEN || !CHANNEL_ID) {
  console.error('error: DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID must be set');
  process.exit(1);
}

const WEEKS  = 26;
const DAYS   = WEEKS * 7;
const PAGES  = 30;          // safety cap: 30 × 100 = 3000 messages
const PERPG  = 100;

async function fetchMessages(beforeId) {
  const u = new URL(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`);
  u.searchParams.set('limit', String(PERPG));
  if (beforeId) u.searchParams.set('before', beforeId);
  const r = await fetch(u, {
    headers: {
      'Authorization': `Bot ${TOKEN}`,
      'User-Agent': 'certifa-heatmap-fetcher/1.0 (+https://certifa.github.io)',
    },
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`Discord ${r.status}: ${body.slice(0, 300)}`);
  }
  return r.json();
}

function extractEvent(msg) {
  if (msg.author?.id !== HTB_UPDATES_BOT_ID) return null;

  const img = (msg.attachments || []).find(a =>
    typeof a.content_type === 'string' && a.content_type.startsWith('image/'),
  );
  if (!img) return null;

  const fname = String(img.filename || '').toLowerCase();
  let kind = 'other';
  if      (fname.startsWith('root'))        kind = 'root';
  else if (fname.startsWith('user'))        kind = 'user';
  else if (fname.startsWith('solve'))       kind = 'solve';
  else if (fname.startsWith('achievement')) kind = 'achievement';
  else if (fname.startsWith('rank'))        kind = 'rank';

  return { kind, ts: msg.timestamp };
}

function isoDay(d) { return d.toISOString().slice(0, 10); }

function buildHeatmap(events) {
  const counts = new Map();
  for (const ev of events) {
    const d = new Date(ev.ts);
    if (Number.isNaN(d.getTime())) continue;
    const k = isoDay(d);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const days = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const key = isoDay(d);
    days.push({ date: key, count: counts.get(key) || 0 });
  }
  return days;
}

async function main() {
  console.error(`reading discord channel ${CHANNEL_ID}`);
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - DAYS);

  let beforeId = null;
  const events = [];
  let total = 0;

  for (let i = 0; i < PAGES; i++) {
    const batch = await fetchMessages(beforeId);
    total += batch.length;
    if (batch.length === 0) break;

    for (const msg of batch) {
      const ev = extractEvent(msg);
      if (ev) events.push(ev);
    }

    const last = batch[batch.length - 1];
    const lastTs = new Date(last.timestamp);
    if (Number.isNaN(lastTs.getTime()) || lastTs < cutoff) break;
    beforeId = last.id;
  }

  console.error(`scanned ${total} messages, matched ${events.length} HTB Updates events`);

  const days  = buildHeatmap(events);
  const sum   = days.reduce((s, d) => s + d.count, 0);

  const out = {
    generated:  new Date().toISOString(),
    user:       HTB_USER,
    user_id:    HTB_USER_ID,
    weeks:      WEEKS,
    total:      sum,
    source:     'discord:HTB Updates',
    days,
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n');
  console.error(`wrote ${OUT} (${days.length} days · ${sum} events in window)`);
}

main().catch((e) => {
  console.error('fatal:', e.message);
  process.exit(1);
});
