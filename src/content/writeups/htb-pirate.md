---
title: "Pirate"
date: 2026-03-01
tags: [windows, active-directory, pre2k, gmsa, kerberos, ntlm-relay, rbcd, constrained-delegation, spn-jacking, ligolo-ng, privesc]
difficulty: hard
platform: HTB
description: "Active HackTheBox machine. Full writeup published after retirement."
featured: true
---

<div class="locked-screen">
  <div class="locked-glow"></div>

  <svg class="locked-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="28" width="40" height="28" rx="4" stroke="#3d8cff" stroke-width="2.5"/>
    <path d="M20 28V20a12 12 0 0 1 24 0v8" stroke="#3d8cff" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="32" cy="42" r="4" fill="#3d8cff" opacity="0.9"/>
    <line x1="32" y1="46" x2="32" y2="51" stroke="#3d8cff" stroke-width="2.5" stroke-linecap="round"/>
  </svg>

  <span class="locked-label">// access restricted</span>
  <h2 class="locked-heading">Full writeup locked</h2>
  <p class="locked-body">
    Pirate is an active HackTheBox machine. The full walkthrough will be
    published here once the machine retires, in line with
    <a href="https://help.hackthebox.com/en/articles/5188925-streaming-writeups-walkthroughs-policy" target="_blank" rel="noopener">HTB's active machine policy</a>.
  </p>
  <p class="locked-hint">// check back after retirement</p>
</div>

<style>
.locked-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 5rem 2rem;
  margin: 2rem 0;
  position: relative;
  border: 1px solid rgba(0, 229, 255, 0.28);
  border-radius: 0.75rem;
  background: rgba(6, 6, 14, 0.6);
  overflow: hidden;
}
.locked-glow {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(0, 229, 255, 0.07) 0%, transparent 70%);
  pointer-events: none;
}
.locked-svg {
  width: 80px;
  height: 80px;
  margin-bottom: 0.75rem;
  filter: drop-shadow(0 0 12px rgba(0, 229, 255, 0.4));
  animation: lock-pulse 3s ease-in-out infinite;
}
@keyframes lock-pulse {
  0%, 100% { filter: drop-shadow(0 0 10px rgba(0, 229, 255, 0.35)); }
  50%       { filter: drop-shadow(0 0 22px rgba(0, 229, 255, 0.65)); }
}
.locked-label {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: #3d8cff;
  letter-spacing: 0.15em;
  text-transform: lowercase;
  margin-bottom: 0.75rem;
  opacity: 0.8;
}
.locked-heading {
  font-family: 'Space Mono', monospace;
  font-size: 1.25rem;
  color: #eaedf3;
  font-weight: 700;
  margin: 0 0 1rem;
  border: none;
  padding: 0;
  letter-spacing: 0.02em;
}
.locked-body {
  font-size: 0.9rem;
  color: #c8cad0;
  max-width: 420px;
  line-height: 1.75;
  margin: 0 0 1.5rem;
}
.locked-body a {
  color: #3d8cff;
  text-decoration: none;
  border-bottom: 1px solid rgba(0, 229, 255, 0.3);
}
.locked-body a:hover {
  border-bottom-color: #3d8cff;
}
.locked-hint {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  color: #555a6e;
  margin: 0;
}
</style>
