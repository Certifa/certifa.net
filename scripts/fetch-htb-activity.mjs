#!/usr/bin/env node
// Read the "HTB Updates" Discord bot's messages out of a private channel,
// filter to events for the configured username (default: Certifa), then build
// a 26-week × 7-day heatmap and write it to public/data/heatmap.json.
//
// Required env:
//   DISCORD_BOT_TOKEN   — token of a reader bot invited to the server
//   DISCORD_CHANNEL_ID  — id of the channel where HTB Updates posts
//
// Optional env:
//   HTB_USER            — username to filter on (default 'Certifa')
//   HTB_USER_ID         — informational; written into the json output

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT  = resolve(ROOT, 'public/data/heatmap.json');

const TOKEN      = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const HTB_USER   = (process.env.HTB_USER || 'Certifa').toLowerCase();
const USER_ID    = process.env.HTB_USER_ID || '444744';

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
  // Look across all embed fields plus plain content. Bot may use embed.title,
  // embed.author.name, or embed.description; we don't assume which.
  const haystacks = [];
  for (const e of (msg.embeds || [])) {
    if (e.title)            haystacks.push(String(e.title));
    if (e.description)      haystacks.push(String(e.description));
    if (e.author?.name)     haystacks.push(String(e.author.name));
    if (e.footer?.text)     haystacks.push(String(e.footer.text));
    for (const f of (e.fields || [])) {
      if (f.name)  haystacks.push(String(f.name));
      if (f.value) haystacks.push(String(f.value));
    }
  }
  if (msg.content) haystacks.push(String(msg.content));

  const blob = haystacks.join(' \n ').toLowerCase();
  if (!blob.includes(HTB_USER)) return null;

  // Count every bot-message that mentions the user as one event. This catches
  // user/root flags, achievements, rank-ups, fortress/prolab/sherlock events
  // — anything HTB Updates posts for you.
  let kind = 'other';
  if (/\broot\b/.test(blob))         kind = 'root';
  else if (/\buser\b/.test(blob))    kind = 'user';
  else if (/\bachievement\b/.test(blob)) kind = 'achievement';
  else if (/\brank\b/.test(blob))    kind = 'rank';

  const m = / on ([A-Za-z0-9][A-Za-z0-9 _.-]{0,40})/.exec(blob);
  const machine = m?.[1]?.trim() ?? null;

  return { kind, machine, ts: msg.timestamp };
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
  console.error(`reading discord channel ${CHANNEL_ID} for user "${HTB_USER}"`);

  if (process.env.HTB_DEBUG === '1') {
    const meRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { 'Authorization': `Bot ${TOKEN}` },
    });
    if (meRes.ok) {
      const me = await meRes.json();
      console.error(`DEBUG_BOT identity: ${me.username}#${me.discriminator || '0'} id=${me.id}`);
    } else {
      console.error(`DEBUG_BOT identity fetch failed: ${meRes.status}`);
    }
  }

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
      if (process.env.HTB_DEBUG === '1') {
        const dump = {
          id: msg.id,
          ts: msg.timestamp,
          flags: msg.flags,
          content: msg.content,
          embeds: msg.embeds,
          components: msg.components,
        };
        console.error('DEBUG_MSG', JSON.stringify(dump));
      }
      const ev = extractEvent(msg);
      if (ev) events.push(ev);
    }

    const last = batch[batch.length - 1];
    const lastTs = new Date(last.timestamp);
    if (Number.isNaN(lastTs.getTime()) || lastTs < cutoff) break;
    beforeId = last.id;
  }

  console.error(`scanned ${total} messages, matched ${events.length} events for "${HTB_USER}"`);

  const days  = buildHeatmap(events);
  const sum   = days.reduce((s, d) => s + d.count, 0);

  const out = {
    generated:  new Date().toISOString(),
    user:       HTB_USER,
    user_id:    USER_ID,
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
