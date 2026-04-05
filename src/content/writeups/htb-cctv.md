---
title: "CCTV"
date: 2026-03-07
tags: [linux, ZoneMinder, SQLi, CVE-2024-51482, CVE-2025-60787, SSH-tunneling, command-injection]
difficulty: easy
platform: HTB
description: "Default creds → SQLi → motionEye RCE → root via Motion command injection"
featured: false
---

<div class="writeup-locked">
  <div class="locked-icon">&#x1F512;</div>
  <div class="locked-content">
    <h2 class="locked-title">Full writeup locked</h2>
    <p class="locked-body">
      CCTV is an active HackTheBox machine. The detailed walkthrough will be published
      here once the machine retires, in line with
      <a href="https://help.hackthebox.com/en/articles/5188925-streaming-writeups-walkthroughs-policy" target="_blank" rel="noopener">HTB's active machine policy</a>.
    </p>
    <p class="locked-hint">Check back after the machine retires.</p>
  </div>
</div>

<style>
.writeup-locked {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  margin: 2rem 0;
  padding: 1.5rem 1.75rem;
  background: rgba(14, 14, 28, 0.7);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-left: 3px solid #00e5ff;
  border-radius: 0.5rem;
}
.locked-icon {
  font-size: 1.75rem;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 0.1rem;
}
.locked-title {
  font-family: 'Space Mono', monospace;
  font-size: 1rem;
  color: #eaedf3;
  margin: 0 0 0.5rem;
  font-weight: 600;
  border: none;
  padding: 0;
}
.locked-body {
  font-size: 0.95rem;
  color: #c8cad0;
  margin: 0 0 0.5rem;
  line-height: 1.7;
}
.locked-body a {
  color: #00e5ff;
  text-decoration: none;
}
.locked-body a:hover {
  text-decoration: underline;
}
.locked-hint {
  font-size: 0.85rem;
  color: #555a6e;
  font-family: 'Space Mono', monospace;
  margin: 0;
}
</style>
