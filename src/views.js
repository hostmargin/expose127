'use strict';

// Server-rendered HTML — no templating engine. index.html/privacy.html/terms.html
// used to be static files; they're now rendered here so all three pages (plus the
// dashboard) share one nav/footer instead of three copy-pasted ones.

const SITE_BASE_STYLE = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #06080d;
    --surface:  #0b0f18;
    --card:     #0f1520;
    --border:   #1a2535;
    --accent:   #00e5ff;
    --accent2:  #8b5cf6;
    --green:    #00ffa3;
    --orange:   #ff6b35;
    --text:     #dde6f0;
    --muted:    #5a6e82;
    --dim:      #2d3f52;
    --font-display: 'Oxanium', sans-serif;
    --font-body:    'Rajdhani', sans-serif;
    --font-mono:    'JetBrains Mono', monospace;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 16px;
    min-height: 100vh;
    overflow-x: hidden;
  }

  body::after {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
    pointer-events: none;
    z-index: 999;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(0,229,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,229,255,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
    z-index: 0;
  }

  .orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
    z-index: 0;
    animation: drift 14s ease-in-out infinite;
  }
  .orb1 { width: 700px; height: 700px; background: rgba(0,229,255,0.05); top: -300px; left: -200px; }
  .orb2 { width: 600px; height: 600px; background: rgba(139,92,246,0.06); bottom: -200px; right: -100px; animation-delay: -7s; }
  .orb3 { width: 300px; height: 300px; background: rgba(255,107,53,0.04); top: 40%; left: 60%; animation-delay: -3s; }

  @keyframes drift {
    0%,100% { transform: translate(0,0) scale(1); }
    33%  { transform: translate(20px,30px) scale(1.02); }
    66%  { transform: translate(-15px,10px) scale(0.98); }
  }

  /* ── NAV ── */
  nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    padding: 1rem 2.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(6,8,13,0.8);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid var(--border);
  }

  .logo { display: flex; align-items: center; }
  .logo img { display: block; }

  .nav-links { display: flex; gap: 2rem; align-items: center; }

  nav a {
    font-family: var(--font-display);
    color: var(--muted);
    text-decoration: none;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    transition: color 0.2s;
  }
  nav a:hover { color: var(--accent); }

  .nav-cta {
    color: var(--accent) !important;
    border: 1px solid rgba(0,229,255,0.4);
    padding: 0.45rem 1.2rem;
    border-radius: 3px;
    transition: all 0.2s !important;
  }
  .nav-cta:hover { background: var(--accent) !important; color: #000 !important; box-shadow: 0 0 20px rgba(0,229,255,0.3); }

  .nav-toggle {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    background: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    width: 38px;
    height: 34px;
    padding: 0;
    cursor: pointer;
  }
  .nav-toggle span {
    display: block;
    width: 18px;
    height: 2px;
    margin: 0 auto;
    background: var(--text);
    transition: transform 0.2s, opacity 0.2s;
  }
  .nav-toggle.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .nav-toggle.open span:nth-child(2) { opacity: 0; }
  .nav-toggle.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  @media (max-width: 900px) {
    nav { flex-wrap: wrap; padding: 0.85rem 1.5rem; }
    .nav-toggle { display: flex; }
    .nav-links {
      display: none;
      flex-direction: column;
      align-items: stretch;
      width: 100%;
      gap: 0;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }
    .nav-links.open { display: flex; }
    .nav-links a { padding: 0.7rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .nav-cta { text-align: center; margin-top: 0.5rem; }
  }

  /* ── FOOTER ── */
  footer {
    position: relative;
    z-index: 1;
    border-top: 1px solid var(--border);
    padding: 2rem;
    text-align: center;
    color: var(--dim);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.06em;
  }
  footer a { color: var(--muted); text-decoration: none; transition: color 0.2s; }
  footer a:hover { color: var(--accent); }

  /* ── REVEAL ── */
  .reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }
`;

const LANDING_STYLE = `
  /* ── HERO ── */
  .hero {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6.5rem 2rem 2.5rem;
  }

  .hero-inner {
    width: 100%;
    max-width: 1220px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 3.5rem;
  }

  .hero-content {
    flex: 1 1 480px;
    max-width: 560px;
    text-align: left;
  }

  @media (max-width: 980px) {
    .hero-inner { flex-direction: column; text-align: center; }
    .hero-content { max-width: 620px; text-align: center; }
    .hero-content .hero-cta { justify-content: center; }
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    background: rgba(0,229,255,0.06);
    border: 1px solid rgba(0,229,255,0.15);
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    padding: 0.45rem 1.1rem;
    border-radius: 3px;
    margin-bottom: 2.5rem;
    letter-spacing: 0.08em;
    animation: fadeUp 0.5s ease both;
  }

  .badge-dot {
    width: 6px; height: 6px;
    background: var(--green);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--green);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,100% { opacity:1; box-shadow: 0 0 8px var(--green); }
    50%      { opacity:.5; box-shadow: 0 0 2px var(--green); }
  }

  h1 {
    font-family: var(--font-display);
    font-size: clamp(2.6rem, 4.6vw, 4.6rem);
    font-weight: 800;
    line-height: 0.98;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    margin-bottom: 1.6rem;
    animation: fadeUp 0.5s 0.1s ease both;
  }

  h1 .line1 { display: block; color: var(--text); }
  h1 .line2 {
    display: block;
    background: linear-gradient(120deg, var(--accent) 0%, var(--accent2) 50%, var(--orange) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 30px rgba(0,229,255,0.25));
  }

  .subtitle {
    font-family: var(--font-body);
    font-size: clamp(1rem, 1.6vw, 1.2rem);
    font-weight: 400;
    color: var(--muted);
    max-width: 480px;
    line-height: 1.65;
    margin-bottom: 2.5rem;
    letter-spacing: 0.02em;
    animation: fadeUp 0.5s 0.2s ease both;
  }

  .hero-cta {
    display: flex;
    gap: 1rem;
    justify-content: flex-start;
    flex-wrap: wrap;
    animation: fadeUp 0.5s 0.3s ease both;
  }

  .btn-primary {
    font-family: var(--font-display);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 0.9rem 2.2rem;
    border-radius: 3px;
    text-decoration: none;
    border: none;
    cursor: pointer;
    background: var(--accent);
    color: #000;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .btn-primary::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%);
    transform: translateX(-100%);
    transition: transform 0.5s;
  }
  .btn-primary:hover::after { transform: translateX(100%); }
  .btn-primary:hover { box-shadow: 0 0 30px rgba(0,229,255,0.4); transform: translateY(-2px); }

  .btn-secondary {
    font-family: var(--font-display);
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 0.9rem 2.2rem;
    border-radius: 3px;
    text-decoration: none;
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
    transition: all 0.2s;
  }
  .btn-secondary:hover { border-color: var(--accent2); color: var(--accent2); transform: translateY(-2px); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── TERMINAL ── */
  .terminal-wrap {
    width: 100%;
    flex: 1 1 460px;
    max-width: 560px;
    animation: fadeUp 0.5s 0.4s ease both;
  }

  .terminal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(0,229,255,0.04), 0 40px 80px rgba(0,0,0,0.7);
    text-align: left;
  }

  .terminal-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.85rem 1.2rem;
    background: var(--card);
    border-bottom: 1px solid var(--border);
  }

  .dot { width: 11px; height: 11px; border-radius: 50%; }
  .dot-r { background: #ff5f57; }
  .dot-y { background: #febc2e; }
  .dot-g { background: #28c840; }

  .terminal-title {
    flex: 1;
    text-align: center;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--dim);
    letter-spacing: 0.06em;
  }

  .terminal-body {
    padding: 1.5rem;
    font-family: var(--font-mono);
    font-size: 0.79rem;
    line-height: 1.9;
    min-height: 300px; /* fallback until JS measures the real content height */
    overflow: hidden;
  }

  .t-line { display: flex; align-items: flex-start; gap: 0.5rem; opacity: 0; }
  .t-line.show { animation: lineIn 0.25s ease forwards; }
  .t-blank { height: 0.5rem; }

  @keyframes lineIn {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .t-prompt { color: var(--green); flex-shrink: 0; }
  .t-cmd    { color: var(--text); }
  .t-out    { color: var(--muted); padding-left: 1rem; }

  .cursor {
    display: inline-block;
    width: 8px; height: 15px;
    background: var(--accent);
    vertical-align: middle;
    animation: blink 1s step-end infinite;
    box-shadow: 0 0 8px var(--accent);
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* ── SHARED SECTION ── */
  .section-label {
    font-family: var(--font-display);
    font-size: 0.68rem;
    color: var(--accent);
    letter-spacing: 0.22em;
    text-transform: uppercase;
    margin-bottom: 1rem;
    text-align: center;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 0.75rem;
    line-height: 1.05;
  }

  .section-sub {
    font-family: var(--font-body);
    color: var(--muted);
    text-align: center;
    margin-bottom: 4rem;
    font-size: 1.1rem;
    font-weight: 400;
    letter-spacing: 0.03em;
  }

  /* ── STEPS ── */
  .steps-section {
    position: relative;
    z-index: 1;
    padding: 7rem 2rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .step-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 2rem;
    position: relative;
    overflow: hidden;
    transition: all 0.3s;
  }

  .step-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s;
  }

  .step-card:hover { border-color: rgba(0,229,255,0.2); transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
  .step-card:hover::after { transform: scaleX(1); }

  .step-num {
    font-family: var(--font-display);
    font-size: 0.62rem;
    color: var(--accent);
    margin-bottom: 1rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  .step-title {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .step-desc {
    font-family: var(--font-body);
    color: var(--muted);
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    font-weight: 400;
  }

  .step-code {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 0.9rem 1.1rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--green);
    line-height: 1.8;
  }
  .step-code .cmd-prefix { color: var(--dim); }
  .step-code .comment { color: var(--dim); }
  .step-code .url { color: var(--accent); }
  .step-code .ok { color: var(--green); }

  /* ── FLOW DIAGRAM ── */
  .flow-section {
    position: relative;
    z-index: 1;
    padding: 4rem 2rem 7rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .flow-diagram {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0;
    margin-top: 3.5rem;
  }

  .flow-node {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem 1.25rem;
    min-width: 150px;
    text-align: center;
    transition: all 0.3s;
  }
  .flow-node:hover { border-color: rgba(0,229,255,0.2); transform: translateY(-4px); }

  .flow-node-accent {
    border-color: rgba(0,229,255,0.3);
    box-shadow: 0 0 30px rgba(0,229,255,0.08);
  }

  .flow-icon { font-size: 1.7rem; margin-bottom: 0.7rem; }

  .flow-title {
    font-family: var(--font-display);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 0.4rem;
  }

  .flow-desc {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--muted);
  }

  .flow-rail {
    position: relative;
    flex: 1 1 70px;
    min-width: 50px;
    max-width: 100px;
    height: 2px;
    background: var(--border);
    margin: 0 0.35rem;
  }

  .flow-packet {
    position: absolute;
    top: 50%;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    transform: translateY(-50%);
    box-shadow: 0 0 8px currentColor;
  }
  .flow-packet.req { background: var(--accent2); color: var(--accent2); animation: packetForward 3s linear infinite; }
  .flow-packet.res { background: var(--accent);  color: var(--accent);  animation: packetBack 3s linear infinite; }

  @keyframes packetForward {
    0%   { left: 0;    opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { left: 100%; opacity: 0; }
  }
  @keyframes packetBack {
    0%   { left: 100%; opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { left: 0;    opacity: 0; }
  }

  .flow-legend {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 2rem;
    margin-top: 3rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--muted);
  }

  .dot-legend {
    display: inline-block;
    width: 7px; height: 7px;
    border-radius: 50%;
    margin-right: 0.5rem;
    vertical-align: middle;
  }
  .dot-legend.req { background: var(--accent2); box-shadow: 0 0 6px var(--accent2); }
  .dot-legend.res { background: var(--accent);  box-shadow: 0 0 6px var(--accent); }

  @media (max-width: 820px) {
    .flow-diagram { flex-direction: column; }
    .flow-rail { width: 2px; height: 44px; max-width: none; flex: none; margin: 0.35rem 0; }
    .flow-packet { left: 50%; transform: translateX(-50%); }
    @keyframes packetForward {
      0%   { top: 0;    opacity: 0; }
      8%   { opacity: 1; }
      92%  { opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }
    @keyframes packetBack {
      0%   { top: 100%; opacity: 0; }
      8%   { opacity: 1; }
      92%  { opacity: 1; }
      100% { top: 0;    opacity: 0; }
    }
  }

  /* ── FEATURES ── */
  .features-section {
    position: relative;
    z-index: 1;
    padding: 4rem 2rem 7rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .features-marquee {
    position: relative;
    z-index: 1;
    width: 100vw;
    margin-left: calc(50% - 50vw);
    overflow: hidden;
    margin-top: 3rem;
    padding: 0.5rem 0 1rem;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
            mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
  }

  .features-track {
    display: flex;
    gap: 1rem;
    width: max-content;
    animation: marquee 32s linear infinite;
  }
  .features-marquee:hover .features-track { animation-play-state: paused; }

  /* Shifts by exactly one full set's period (7 cards + 7 gaps — .feature is
     260px, gap is 1rem) so the duplicated second set lands pixel-perfectly
     where the first set started — a plain -50% is off by half a gap because
     the duplicated content has an odd total gap count, which shows up as a
     visible stutter right as the loop wraps past the last card. */
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(calc(-1820px - 7rem)); }
  }

  @media (prefers-reduced-motion: reduce) {
    .features-track { animation: none; }
  }

  .feature {
    flex: 0 0 260px;
    padding: 1.8rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--card);
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }

  @media (max-width: 640px) {
    .feature { flex-basis: 78vw; }
  }

  .feature::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0,229,255,0.03), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .feature:hover { border-color: rgba(0,229,255,0.2); transform: translateY(-3px); }
  .feature:hover::before { opacity: 1; }

  .feature-icon { font-size: 1.6rem; margin-bottom: 1rem; }

  .feature-title {
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .feature-desc {
    font-family: var(--font-body);
    font-size: 0.95rem;
    color: var(--muted);
    line-height: 1.55;
    font-weight: 400;
  }

  /* ── CTA ── */
  .cta-section {
    position: relative;
    z-index: 1;
    padding: 4rem 2rem 6rem;
    text-align: center;
  }

  .cta-box {
    max-width: 700px;
    margin: 0 auto;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 3.5rem 2rem;
    position: relative;
    overflow: hidden;
  }

  .cta-box::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0,229,255,0.04), rgba(139,92,246,0.04));
  }

  .cta-box::after {
    content: '';
    position: absolute;
    top: 0; left: 10%; right: 10%;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
  }

  .cta-box h2 {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 4vw, 2.5rem);
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
    position: relative;
  }

  .cta-box p {
    font-family: var(--font-body);
    color: var(--muted);
    margin-bottom: 2.5rem;
    position: relative;
    font-size: 1.05rem;
    letter-spacing: 0.03em;
  }

  .install-box {
    display: inline-flex;
    align-items: center;
    gap: 1.2rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 1rem 1.6rem;
    font-family: var(--font-mono);
    font-size: 0.95rem;
    color: var(--green);
    margin-bottom: 2rem;
    position: relative;
    cursor: pointer;
    transition: all 0.2s;
  }
  .install-box:hover { border-color: var(--accent); box-shadow: 0 0 20px rgba(0,229,255,0.1); }

  .copy-btn {
    font-family: var(--font-display);
    font-size: 0.62rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border: 1px solid var(--border);
    padding: 0.25rem 0.7rem;
    border-radius: 3px;
    cursor: pointer;
    background: none;
    color: var(--muted);
    transition: all 0.2s;
  }
  .copy-btn:hover { border-color: var(--accent); color: var(--accent); }

  /* ── PLATFORMS ── */
  .platforms {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 2rem;
  }

  .platform-badge {
    font-family: var(--font-display);
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 0.3rem 0.85rem;
    border-radius: 3px;
    border: 1px solid var(--border);
    color: var(--muted);
  }
`;

const LEGAL_STYLE = `
  .legal-wrap { max-width: 760px; margin: 0 auto; padding: 8rem 2rem 6rem; position: relative; z-index: 1; }
  .legal-label {
    font-family: var(--font-display);
    font-size: .7rem;
    color: var(--accent);
    letter-spacing: .2em;
    text-transform: uppercase;
    margin-bottom: 1rem;
  }
  .legal-wrap h1 {
    font-family: var(--font-display);
    font-size: clamp(2rem, 4vw, 2.8rem);
    font-weight: 800;
    letter-spacing: .03em;
    text-transform: uppercase;
    margin-bottom: .6rem;
  }
  .legal-wrap .updated { color: var(--muted); font-family: var(--font-mono); font-size: .8rem; margin-bottom: 3rem; }
  .legal-wrap h2 {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
    color: var(--text);
    margin: 2.6rem 0 1rem;
  }
  .legal-wrap p { color: var(--muted); line-height: 1.75; font-size: 1rem; margin-bottom: 1rem; }
  .legal-wrap ul { color: var(--muted); line-height: 1.75; font-size: 1rem; margin: 0 0 1rem 1.3rem; }
  .legal-wrap li { margin-bottom: .5rem; }
  .legal-wrap strong { color: var(--text); }
  .legal-wrap a { color: var(--accent); text-decoration: none; }
  .legal-wrap a:hover { text-decoration: underline; }
  .legal-wrap code {
    font-family: var(--font-mono);
    font-size: .9em;
    background: var(--surface);
    padding: .15rem .4rem;
    border-radius: 4px;
    border: 1px solid var(--border);
  }
`;

function siteNav() {
  return `
<nav>
  <div class="logo"><img src="/logo-expose127.png" alt="expose127 logo" width="150"></div>
  <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="nav-links">
    <span></span><span></span><span></span>
  </button>
  <div class="nav-links" id="nav-links">
    <a href="/#architecture">Architecture</a>
    <a href="/#how">How it works</a>
    <a href="/#features">Features</a>
    <a href="https://npmjs.com/package/expose127" target="_blank">npm</a>
    <a href="/dashboard">Dashboard</a>
    <a href="https://npmjs.com/package/expose127" class="nav-cta" target="_blank">Get started →</a>
  </div>
</nav>
<script>
  (function () {
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('nav-links');
    if (!toggle || !links) return;
    function setOpen(open) {
      links.classList.toggle('open', open);
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    toggle.addEventListener('click', function () { setOpen(!links.classList.contains('open')); });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
  })();
</script>`;
}

function siteFooter() {
  return `
<footer>
  expose127 — a Bi Enterprises product · powered by <a href="https://hostmargin.com" target="_blank">hostmargin.com</a> &nbsp;·&nbsp;
  <a href="/privacy">Privacy</a> &nbsp;·&nbsp;
  <a href="/terms">Terms</a> &nbsp;·&nbsp;
  <a href="https://npmjs.com/package/expose127" target="_blank">npm</a> &nbsp;·&nbsp;
  MIT License
</footer>`;
}

function renderLanding() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>expose127 — Instant Localhost Tunnels (ngrok Alternative)</title>
  <meta name="description" content="Free ngrok alternative — turn any localhost port into a public HTTPS URL with one command. No signup, no config, custom subdomains, live request logs.">
  <meta name="keywords" content="localhost tunnel, expose localhost, ngrok alternative, localtunnel alternative, cloudflare tunnel alternative, free tunnel service, public url generator, npx tunnel, laravel tunnel, node tunnel, expose127, hostmargin">
  <meta name="author" content="Hostmargin">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://expose127.hostmargin.com">

  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/logo-expose127.png">

  <meta property="og:type" content="website">
  <meta property="og:url" content="https://expose127.hostmargin.com">
  <meta property="og:title" content="expose127 — Instant Localhost Tunnels (ngrok Alternative)">
  <meta property="og:description" content="Turn your localhost into a public HTTPS URL in one command. Free, no signup, no config — the ngrok alternative for developers.">
  <meta property="og:image" content="https://expose127.hostmargin.com/social/facebook-post.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="expose127 — Instant public URLs for your localhost">
  <meta property="og:site_name" content="expose127">
  <meta property="og:locale" content="en_US">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="https://expose127.hostmargin.com">
  <meta name="twitter:title" content="expose127 — Instant Localhost Tunnels (ngrok Alternative)">
  <meta name="twitter:description" content="Free ngrok alternative. No signup, no config. Just run: npx expose127 8000">
  <meta name="twitter:image" content="https://expose127.hostmargin.com/social/facebook-post.png">
  <meta name="twitter:image:alt" content="expose127 banner">
  <meta name="twitter:creator" content="@hostmargin">
  <meta name="twitter:site" content="@hostmargin">

  <meta name="theme-color" content="#00e5ff">
  <meta name="msapplication-TileColor" content="#06080d">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "expose127",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Windows, macOS, Linux",
    "description": "Expose your localhost to the internet instantly via hmrg.xyz. Get a public HTTPS URL for any local port with one command — a free ngrok alternative.",
    "url": "https://expose127.hostmargin.com",
    "image": "https://expose127.hostmargin.com/social/facebook-post.png",
    "downloadUrl": "https://www.npmjs.com/package/expose127",
    "softwareVersion": "1.0.5",
    "featureList": [
      "Zero-config npx command, no install required",
      "No account needed to start a tunnel",
      "HTTPS by default",
      "Custom subdomains",
      "Automatic reconnect with exponential back-off",
      "Live request log (method, status, path, duration)",
      "Optional dashboard for API tokens and tunnel history"
    ],
    "author": {
      "@type": "Organization",
      "name": "Bi Enterprises",
      "url": "https://hostmargin.com"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Bi Enterprises",
    "url": "https://hostmargin.com",
    "sameAs": [
      "https://twitter.com/hostmargin",
      "https://www.npmjs.com/package/expose127"
    ]
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "expose127",
    "url": "https://expose127.hostmargin.com",
    "publisher": {
      "@type": "Organization",
      "name": "Bi Enterprises",
      "url": "https://hostmargin.com"
    }
  }
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Oxanium:wght@300;400;500;600;700;800&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>${SITE_BASE_STYLE}${LANDING_STYLE}</style>
</head>
<body>

<div class="orb orb1"></div>
<div class="orb orb2"></div>
<div class="orb orb3"></div>
${siteNav()}

<section class="hero">
  <div class="hero-inner">
    <div class="hero-content">
      <div class="badge"><div class="badge-dot"></div>v1.0.5 — live on npm</div>

      <h1>
        <span class="line1">Your localhost,</span>
        <span class="line2">live in seconds.</span>
      </h1>

      <p class="subtitle">
        expose127 creates an instant public HTTPS URL for any port on your machine.
        Share your Laravel, Node, React — no config, no account needed.
      </p>

      <div class="hero-cta">
        <a href="#how" class="btn-primary">See how it works</a>
        <a href="https://npmjs.com/package/expose127" target="_blank" class="btn-secondary">View on npm →</a>
      </div>
    </div>

    <div class="terminal-wrap">
      <div class="terminal">
        <div class="terminal-bar">
          <div class="dot dot-r"></div>
          <div class="dot dot-y"></div>
          <div class="dot dot-g"></div>
          <div class="terminal-title">PowerShell — expose127</div>
        </div>
        <div class="terminal-body" id="terminal"></div>
      </div>
    </div>
  </div>
</section>

<section class="flow-section" id="architecture">
  <div class="section-label reveal">// architecture</div>
  <h2 class="section-title reveal">expose127 + hostmargin, working together</h2>
  <p class="section-sub reveal">One outbound connection from your machine — hostmargin's edge does the rest.</p>

  <div class="flow-diagram reveal">
    <div class="flow-node">
      <div class="flow-icon">🖥️</div>
      <div class="flow-title">Your machine</div>
      <div class="flow-desc">localhost:8000</div>
    </div>

    <div class="flow-rail">
      <div class="flow-packet req"></div>
      <div class="flow-packet res" style="animation-delay: 1.5s"></div>
    </div>

    <div class="flow-node">
      <div class="flow-icon">⚙️</div>
      <div class="flow-title">expose127 CLI</div>
      <div class="flow-desc">persistent tunnel client</div>
    </div>

    <div class="flow-rail">
      <div class="flow-packet req" style="animation-delay: 0.5s"></div>
      <div class="flow-packet res" style="animation-delay: 2s"></div>
    </div>

    <div class="flow-node flow-node-accent">
      <div class="flow-icon">🛰️</div>
      <div class="flow-title">hostmargin edge</div>
      <div class="flow-desc">TLS · routing · hmrg.xyz</div>
    </div>

    <div class="flow-rail">
      <div class="flow-packet req" style="animation-delay: 1s"></div>
      <div class="flow-packet res" style="animation-delay: 2.5s"></div>
    </div>

    <div class="flow-node">
      <div class="flow-icon">🌐</div>
      <div class="flow-title">Public visitor</div>
      <div class="flow-desc">https://myapp.hmrg.xyz</div>
    </div>
  </div>

  <div class="flow-legend reveal">
    <span><span class="dot-legend req"></span>Incoming request</span>
    <span><span class="dot-legend res"></span>Response over the tunnel</span>
  </div>
</section>

<section class="steps-section" id="how">
  <div class="section-label reveal">// how it works</div>
  <h2 class="section-title reveal">Three steps to go public</h2>
  <p class="section-sub reveal">No sign-up. No dashboard. Just one command.</p>

  <div class="steps">
    <div class="step-card reveal">
      <div class="step-num">Step 01</div>
      <div class="step-title">Start your local server</div>
      <div class="step-desc">Run your Laravel, Node.js, React or any app locally as you normally would.</div>
      <div class="step-code">
        <div><span class="cmd-prefix">$ </span>php artisan serve</div>
        <div><span class="cmd-prefix">$ </span>npm run dev</div>
        <div><span class="cmd-prefix">$ </span>python manage.py runserver</div>
      </div>
    </div>
    <div class="step-card reveal">
      <div class="step-num">Step 02</div>
      <div class="step-title">Run expose127</div>
      <div class="step-desc">Point expose127 at your local port. No install needed — npx runs it instantly.</div>
      <div class="step-code">
        <div><span class="cmd-prefix">$ </span>npx expose127 8000</div>
        <div class="comment" style="margin-top:0.4rem"># with a custom subdomain:</div>
        <div><span class="cmd-prefix">$ </span>npx expose127 8000 --subdomain myapp</div>
      </div>
    </div>
    <div class="step-card reveal">
      <div class="step-num">Step 03</div>
      <div class="step-title">Share the URL</div>
      <div class="step-desc">Get an instant public HTTPS URL powered by hostmargin.com. Share it with anyone.</div>
      <div class="step-code">
        <div class="url">https://myapp.hmrg.xyz</div>
        <div class="ok" style="margin-top:0.5rem">✔  Live — share with anyone</div>
      </div>
    </div>
  </div>
</section>

<section class="features-section" id="features">
  <div class="section-label reveal">// features</div>
  <h2 class="section-title reveal">Everything you need</h2>

  <div class="features-marquee reveal">
    <div class="features-track">
      <div class="feature">
        <div class="feature-icon">⚡</div>
        <div class="feature-title">Zero config</div>
        <div class="feature-desc">No account, no dashboard, no YAML. One command and you're live.</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🔒</div>
        <div class="feature-title">HTTPS by default</div>
        <div class="feature-desc">Every tunnel URL is served over HTTPS via Cloudflare. Secure out of the box.</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🌍</div>
        <div class="feature-title">Custom subdomains</div>
        <div class="feature-desc">Use --subdomain to get a fixed, memorable URL every time.</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🔄</div>
        <div class="feature-title">Auto reconnect</div>
        <div class="feature-desc">Lost connection? expose127 reconnects with exponential back-off.</div>
      </div>
      <div class="feature">
        <div class="feature-icon">📊</div>
        <div class="feature-title">Live request log</div>
        <div class="feature-desc">See every request in real time — method, status, path, duration.</div>
      </div>
      <div class="feature">
        <div class="feature-icon">💻</div>
        <div class="feature-title">Cross-platform</div>
        <div class="feature-desc">Works on Windows, macOS and Linux. Node.js 16+ required.</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🗂️</div>
        <div class="feature-title">Optional dashboard</div>
        <div class="feature-desc">Log in with your hostmargin account to manage API tokens, see active tunnels, and browse request history.</div>
      </div>
      <div class="feature" aria-hidden="true">
        <div class="feature-icon">⚡</div>
        <div class="feature-title">Zero config</div>
        <div class="feature-desc">No account, no dashboard, no YAML. One command and you're live.</div>
      </div>
      <div class="feature" aria-hidden="true">
        <div class="feature-icon">🔒</div>
        <div class="feature-title">HTTPS by default</div>
        <div class="feature-desc">Every tunnel URL is served over HTTPS via Cloudflare. Secure out of the box.</div>
      </div>
      <div class="feature" aria-hidden="true">
        <div class="feature-icon">🌍</div>
        <div class="feature-title">Custom subdomains</div>
        <div class="feature-desc">Use --subdomain to get a fixed, memorable URL every time.</div>
      </div>
      <div class="feature" aria-hidden="true">
        <div class="feature-icon">🔄</div>
        <div class="feature-title">Auto reconnect</div>
        <div class="feature-desc">Lost connection? expose127 reconnects with exponential back-off.</div>
      </div>
      <div class="feature" aria-hidden="true">
        <div class="feature-icon">📊</div>
        <div class="feature-title">Live request log</div>
        <div class="feature-desc">See every request in real time — method, status, path, duration.</div>
      </div>
      <div class="feature" aria-hidden="true">
        <div class="feature-icon">💻</div>
        <div class="feature-title">Cross-platform</div>
        <div class="feature-desc">Works on Windows, macOS and Linux. Node.js 16+ required.</div>
      </div>
      <div class="feature" aria-hidden="true">
        <div class="feature-icon">🗂️</div>
        <div class="feature-title">Optional dashboard</div>
        <div class="feature-desc">Log in with your hostmargin account to manage API tokens, see active tunnels, and browse request history.</div>
      </div>
    </div>
  </div>

  <div class="platforms reveal">
    <span class="platform-badge">Windows ✓</span>
    <span class="platform-badge">macOS ✓</span>
    <span class="platform-badge">Linux ✓</span>
    <span class="platform-badge">Node 16+ ✓</span>
    <span class="platform-badge">Laravel ✓</span>
    <span class="platform-badge">Node.js ✓</span>
    <span class="platform-badge">React ✓</span>
    <span class="platform-badge">Django ✓</span>
  </div>
</section>

<section class="cta-section">
  <div class="cta-box reveal">
    <h2>Ready to go public?</h2>
    <p>No sign-up needed. Works right now.</p>
    <div class="install-box" onclick="copyCmd()">
      <span>$ npx expose127 8000</span>
      <button class="copy-btn" id="copy-btn">copy</button>
    </div>
    <br>
    <a href="https://npmjs.com/package/expose127" target="_blank" class="btn-primary">View on npm →</a>
  </div>
</section>
${siteFooter()}

<script>
  var lines = [
    { type:'cmd',  text:'npx expose127 8000 --subdomain myapp' },
    { type:'blank' },
    { type:'out',  text:'  +--------------------------------------------------+' },
    { type:'out',  text:'  |   EXPOSE127  --  instant public tunnel URLs      |' },
    { type:'out',  text:'  +--------------------------------------------------+' },
    { type:'out',  text:'  Instant public URLs  |  v1.0.5  |  hmrg.xyz' },
    { type:'blank' },
    { type:'ok',   text:'  ✔  Tunnel established!' },
    { type:'blank' },
    { type:'kv',   key:'  Public URL ', val:'https://myapp.hmrg.xyz', vc:'#00e5ff' },
    { type:'kv',   key:'  Forwarding ', val:'https://myapp.hmrg.xyz → localhost:8000', vc:'#5a6e82' },
    { type:'kv',   key:'  Status     ', val:'online', vc:'#00ffa3' },
    { type:'blank' },
    { type:'out',  text:'  ──────────────────────────────────────────────────' },
    { type:'out',  text:'  Time       Method    Status   Path' },
    { type:'out',  text:'  ──────────────────────────────────────────────────' },
    { type:'req',  time:'14:23:01', method:'GET',  status:'200', path:'/' },
    { type:'req',  time:'14:23:01', method:'GET',  status:'200', path:'/assets/app.css' },
    { type:'req',  time:'14:23:03', method:'GET',  status:'200', path:'/assets/app.js' },
    { type:'req',  time:'14:23:06', method:'POST', status:'201', path:'/api/login' },
    { type:'req',  time:'14:23:09', method:'GET',  status:'200', path:'/dashboard' },
  ];

  var terminal = document.getElementById('terminal');
  var idx = 0;

  var sc = function (s) { return s.startsWith('2') ? '#00ffa3' : s.startsWith('3') ? '#00e5ff' : s.startsWith('4') ? '#febc2e' : '#ff5f57'; };
  var mc = function (m) { return ({GET:'#00e5ff',POST:'#8b5cf6',PUT:'#febc2e',DELETE:'#ff5f57',PATCH:'#febc2e'})[m] || '#dde6f0'; };

  var cursor = document.createElement('div');
  cursor.className = 't-line show';
  cursor.innerHTML = '<span class="t-prompt">$</span><span class="t-cmd"> </span><span class="cursor"></span>';

  function buildLine(line) {
    var d = document.createElement('div');
    d.className = 't-line';
    if (line.type === 'blank') { d.className = 't-blank'; }
    else if (line.type === 'cmd')  { d.innerHTML = '<span class="t-prompt">$</span><span class="t-cmd"> ' + line.text + '</span>'; }
    else if (line.type === 'out')  { d.innerHTML = '<span class="t-out">' + line.text + '</span>'; }
    else if (line.type === 'ok')   { d.innerHTML = '<span style="color:#00ffa3;padding-left:1rem">' + line.text + '</span>'; }
    else if (line.type === 'kv')   { d.innerHTML = '<span style="padding-left:1rem"><span style="color:#2d3f52">' + line.key + '  </span><span style="color:' + line.vc + '">' + line.val + '</span></span>'; }
    else if (line.type === 'req')  { d.innerHTML = '<span class="t-out"><span style="color:#2d3f52">' + line.time + '  </span><span style="color:' + mc(line.method) + '">' + line.method.padEnd(8) + '</span><span style="color:' + sc(line.status) + '">' + line.status + '      </span><span style="color:#5a6e82">' + line.path + '</span></span>'; }
    return d;
  }

  function render(line) {
    var d = buildLine(line);
    terminal.appendChild(d);
    requestAnimationFrame(function () { d.classList.add('show'); });
  }

  // Measure the fully typed-out content once (off-screen clone, same width)
  // and lock the terminal to that exact height — otherwise it grows while
  // typing and snaps back to the CSS fallback height on every reset cycle.
  function lockTerminalHeight() {
    var probe = terminal.cloneNode(false);
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.height = 'auto';
    probe.style.width = terminal.getBoundingClientRect().width + 'px';
    lines.forEach(function (line) {
      var el = buildLine(line);
      el.classList.add('show');
      probe.appendChild(el);
    });
    document.body.appendChild(probe);
    var h = probe.scrollHeight;
    document.body.removeChild(probe);
    if (h > 0) terminal.style.height = h + 'px';
  }

  lockTerminalHeight();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(lockTerminalHeight);
  }
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(lockTerminalHeight, 150);
  });

  terminal.appendChild(cursor);
  setTimeout(run, 1000);

  function run() {
    if (idx < lines.length) {
      if (terminal.contains(cursor)) terminal.removeChild(cursor);
      render(lines[idx]);
      var delay = lines[idx].type === 'cmd' ? 900 : lines[idx].type === 'blank' ? 80 : 100;
      idx++;
      setTimeout(function () { terminal.appendChild(cursor); setTimeout(run, delay); }, 20);
    } else {
      setTimeout(function () { terminal.innerHTML = ''; idx = 0; terminal.appendChild(cursor); setTimeout(run, 800); }, 5000);
    }
  }

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e, i) {
      if (e.isIntersecting) { setTimeout(function () { e.target.classList.add('visible'); }, i * 70); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });

  function copyCmd() {
    navigator.clipboard.writeText('npx expose127 8000').then(function () {
      var btn = document.getElementById('copy-btn');
      btn.textContent = 'copied!';
      btn.style.color = '#00ffa3';
      btn.style.borderColor = '#00ffa3';
      setTimeout(function () { btn.textContent = 'copy'; btn.style.color = ''; btn.style.borderColor = ''; }, 2000);
    });
  }
</script>
</body>
</html>`;
}

function renderPrivacy() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy — expose127</title>
  <meta name="description" content="How expose127 and hostmargin.com collect, use, and protect your information.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://expose127.hostmargin.com/privacy">
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/logo-expose127.png">

  <meta property="og:type" content="website">
  <meta property="og:url" content="https://expose127.hostmargin.com/privacy">
  <meta property="og:title" content="Privacy Policy — expose127">
  <meta property="og:description" content="How expose127 and hostmargin.com collect, use, and protect your information.">
  <meta property="og:image" content="https://expose127.hostmargin.com/social/facebook-post.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="expose127">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Privacy Policy — expose127">
  <meta name="twitter:description" content="How expose127 and hostmargin.com collect, use, and protect your information.">
  <meta name="twitter:image" content="https://expose127.hostmargin.com/social/facebook-post.png">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://expose127.hostmargin.com" },
      { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://expose127.hostmargin.com/privacy" }
    ]
  }
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Oxanium:wght@600;700;800&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${SITE_BASE_STYLE}${LEGAL_STYLE}</style>
</head>
<body>

<div class="orb orb1"></div>
<div class="orb orb2"></div>
<div class="orb orb3"></div>
${siteNav()}

<div class="legal-wrap">
  <div class="legal-label">// legal</div>
  <h1>Privacy Policy</h1>
  <p class="updated">Last updated: August 16, 2026</p>

  <p>This Privacy Policy explains how <strong>expose127</strong>, a Bi Enterprises product operated via <a href="https://hostmargin.com" target="_blank">hostmargin.com</a>, collects, uses, and protects information when you use the expose127 CLI, the customer dashboard at expose127.hostmargin.com, and related services (together, the "Service").</p>

  <h2>1. Information we collect</h2>
  <p><strong>Account information.</strong> When you sign in to the dashboard, hostmargin's login system hands off your account ID and email address to expose127 so we can identify your account. We do not operate a separate sign-up form — your account lives with hostmargin.</p>
  <p><strong>API tokens.</strong> Tokens you generate in the dashboard to link the CLI to your account. Tokens are stored so we can recognize your tunnels; treat them like a password.</p>
  <p><strong>Tunnel metadata.</strong> The subdomain you request and the times your tunnel connects and disconnects.</p>
  <p><strong>Request logs.</strong> For tunnels running under your account, we record the HTTP method, path, status code, duration, and timestamp of each request so you can review them in your dashboard. This is metadata about traffic through your own tunnel — it is visible only to your account and is not shared with other customers.</p>
  <p><strong>Cookies.</strong> A single session cookie (<code>exp127_session</code>) keeps you signed in to the dashboard. It is HTTP-only, marked secure, and expires automatically after 12 hours.</p>

  <h2>2. How we use information</h2>
  <ul>
    <li>To authenticate you and keep your dashboard session secure</li>
    <li>To operate, maintain, and display your active tunnels, tokens, and request history</li>
    <li>To detect abuse and keep the Service reliable for all customers</li>
    <li>To respond to support requests</li>
  </ul>
  <p>We do not use your data for advertising, and we do not sell or rent your information to third parties.</p>

  <h2>3. How we share information</h2>
  <p>Information is processed on hostmargin's infrastructure to operate the Service. We disclose information to third parties only where required by law, to protect our rights or the security of the Service, or with your consent.</p>

  <h2>4. Data retention</h2>
  <p>Account, token, and tunnel records are kept for as long as your account remains active. Request logs are retained only as long as necessary to support the dashboard's debugging features and may be purged periodically. You can ask us to delete your data at any time using the contact details below.</p>

  <h2>5. Security</h2>
  <p>Tunnel traffic and the dashboard are served over HTTPS. Session cookies and account handoff tokens are signed with HMAC-SHA256 and cannot be forged or read by the browser. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>

  <h2>6. Your rights</h2>
  <p>You may request access to, correction of, or deletion of your account data by contacting us. Because your account is managed through hostmargin, some changes (such as updating your email) may need to be made from your hostmargin account.</p>

  <h2>7. Children's privacy</h2>
  <p>The Service is intended for developers and businesses and is not directed to children. We do not knowingly collect information from children.</p>

  <h2>8. International users</h2>
  <p>The Service is operated from India, and information is processed and stored there. By using the Service, you consent to this transfer and processing.</p>

  <h2>9. Changes to this policy</h2>
  <p>We may update this Privacy Policy from time to time. Material changes will be reflected by updating the "Last updated" date above.</p>

  <h2>10. Contact us</h2>
  <p>Questions about this policy? Email <a href="mailto:mail@hostmargin.com">mail@hostmargin.com</a> or <a href="https://client.hostmargin.com/submitticket.php?step=2&deptid=1" target="_blank">submit a support ticket</a>.</p>
</div>
${siteFooter()}

</body>
</html>`;
}

function renderTerms() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms &amp; Conditions — expose127</title>
  <meta name="description" content="The terms that govern your use of expose127 and hostmargin.com.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://expose127.hostmargin.com/terms">
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/logo-expose127.png">

  <meta property="og:type" content="website">
  <meta property="og:url" content="https://expose127.hostmargin.com/terms">
  <meta property="og:title" content="Terms &amp; Conditions — expose127">
  <meta property="og:description" content="The terms that govern your use of expose127 and hostmargin.com.">
  <meta property="og:image" content="https://expose127.hostmargin.com/social/facebook-post.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="expose127">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Terms &amp; Conditions — expose127">
  <meta name="twitter:description" content="The terms that govern your use of expose127 and hostmargin.com.">
  <meta name="twitter:image" content="https://expose127.hostmargin.com/social/facebook-post.png">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://expose127.hostmargin.com" },
      { "@type": "ListItem", "position": 2, "name": "Terms & Conditions", "item": "https://expose127.hostmargin.com/terms" }
    ]
  }
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Oxanium:wght@600;700;800&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${SITE_BASE_STYLE}${LEGAL_STYLE}</style>
</head>
<body>

<div class="orb orb1"></div>
<div class="orb orb2"></div>
<div class="orb orb3"></div>
${siteNav()}

<div class="legal-wrap">
  <div class="legal-label">// legal</div>
  <h1>Terms &amp; Conditions</h1>
  <p class="updated">Last updated: August 16, 2026</p>

  <p>These Terms &amp; Conditions ("Terms") govern your use of <strong>expose127</strong>, a Bi Enterprises product operated via <a href="https://hostmargin.com" target="_blank">hostmargin.com</a>, including the CLI, the customer dashboard at expose127.hostmargin.com, and the underlying tunnel infrastructure (together, the "Service"). By running the CLI or signing in to the dashboard, you agree to these Terms.</p>

  <h2>1. Description of service</h2>
  <p>expose127 creates a public HTTPS URL for a port on your local machine by opening an outbound connection from the CLI to hostmargin's edge network, which routes incoming requests back down that connection. The dashboard lets you manage API tokens, view active tunnels, and review recent request logs for tunnels you own.</p>

  <h2>2. Accounts and access</h2>
  <p>The dashboard is accessed through your existing hostmargin account via single sign-on. You are responsible for maintaining the security of your hostmargin account and any API tokens you generate. Tokens link the CLI to your account — do not share them, and contact us immediately if you believe a token has been compromised.</p>

  <h2>3. Acceptable use</h2>
  <p>You agree not to use the Service to:</p>
  <ul>
    <li>Host or transmit unlawful, infringing, or fraudulent content</li>
    <li>Distribute malware, run phishing pages, or facilitate any form of attack against third parties</li>
    <li>Attempt to circumvent rate limits, authentication, or other security controls of the Service</li>
    <li>Overload, disrupt, or degrade the Service for other customers</li>
  </ul>
  <p>We may suspend or terminate a tunnel, token, or account that violates this section without prior notice.</p>

  <h2>4. Service availability</h2>
  <p>The Service is provided on an "as is" and "as available" basis. We do not guarantee uninterrupted or error-free operation, and features (including subdomains, log retention limits, and rate limits) may change as the Service evolves.</p>

  <h2>5. Intellectual property</h2>
  <p>The expose127 CLI is distributed under the MIT License via npm — see the package for full license terms. The expose127 name, logo, and the hostmargin name and branding remain the property of Bi Enterprises / hostmargin.com. Traffic and content you route through your own tunnel remain yours; we claim no ownership over it.</p>

  <h2>6. Termination</h2>
  <p>You may stop using the Service at any time. We may suspend or terminate your access to the Service for breach of these Terms, suspected abuse, or as required by law.</p>

  <h2>7. Disclaimer of warranties</h2>
  <p>To the maximum extent permitted by law, the Service is provided without warranties of any kind, express or implied, including fitness for a particular purpose, merchantability, and non-infringement.</p>

  <h2>8. Limitation of liability</h2>
  <p>To the maximum extent permitted by law, Bi Enterprises and hostmargin.com shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including loss of data, revenue, or business arising from tunnel downtime or interruption.</p>

  <h2>9. Governing law</h2>
  <p>These Terms are governed by the laws of India, without regard to conflict-of-law principles, and any disputes shall be subject to the exclusive jurisdiction of the courts of India.</p>

  <h2>10. Changes to these terms</h2>
  <p>We may update these Terms from time to time. Continued use of the Service after a change constitutes acceptance of the revised Terms. Material changes will be reflected by updating the "Last updated" date above.</p>

  <h2>11. Contact us</h2>
  <p>Questions about these Terms? Email <a href="mailto:mail@hostmargin.com">mail@hostmargin.com</a> or <a href="https://client.hostmargin.com/submitticket.php?step=2&deptid=1" target="_blank">submit a support ticket</a>.</p>
</div>
${siteFooter()}

</body>
</html>`;
}

const SHELL_STYLE = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#06080d;--surface:#0b0f18;--card:#0f1520;--border:#1a2535;
    --accent:#00e5ff;--accent2:#8b5cf6;--green:#00ffa3;--red:#ff5f57;--amber:#febc2e;
    --text:#dde6f0;--muted:#5a6e82;--dim:#2d3f52;
    --font-display:'Oxanium',sans-serif;--font-body:'Rajdhani',sans-serif;--font-mono:'JetBrains Mono',monospace;
  }
  html{scroll-behavior:smooth}
  body{background:var(--bg);color:var(--text);font-family:var(--font-body);font-size:16px;min-height:100vh}
  .bg-grid{position:fixed;inset:0;pointer-events:none;z-index:0;
    background-image:linear-gradient(rgba(0,229,255,.025) 1px,transparent 1px),
                      linear-gradient(90deg,rgba(0,229,255,.025) 1px,transparent 1px);
    background-size:48px 48px}

  nav{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;
      padding:1rem 2rem;background:rgba(6,8,13,.8);backdrop-filter:blur(24px);border-bottom:1px solid var(--border)}
  .logo{display:flex;align-items:center;gap:.6rem;text-decoration:none;font-family:var(--font-display);
        font-weight:800;color:var(--accent);letter-spacing:.08em;text-transform:uppercase;font-size:1.05rem}
  .logo img{display:block;height:26px;width:auto}
  .nav-links{display:flex;gap:1.75rem;align-items:center}
  nav a{font-family:var(--font-display);color:var(--muted);text-decoration:none;font-size:.75rem;
        font-weight:600;letter-spacing:.1em;text-transform:uppercase;transition:color .2s}
  nav a:hover{color:var(--accent)}
  .nav-cta{color:var(--accent) !important;border:1px solid rgba(0,229,255,.4);padding:.4rem 1rem;border-radius:3px}
  .nav-cta:hover{background:var(--accent) !important;color:#000 !important}

  .wrap{max-width:1000px;margin:0 auto;padding:3rem 2rem 5rem;position:relative;z-index:1}
  h1{font-family:var(--font-display);font-size:2rem;font-weight:800;letter-spacing:.03em;
     text-transform:uppercase;margin-bottom:.4rem;overflow-wrap:break-word}
  .sub{color:var(--muted);margin-bottom:2rem;font-size:.95rem;letter-spacing:.01em}
  .sub a{color:var(--accent);text-decoration:none}
  .sub a:hover{text-decoration:underline}

  .stat-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:2rem}
  .stat{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:1.25rem}
  .stat .n{font-family:var(--font-display);font-size:1.9rem;font-weight:800;color:var(--accent);line-height:1}
  .stat .l{color:var(--muted);font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;margin-top:.5rem}

  .card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:1.75rem;margin-bottom:1.5rem}
  .card h2{font-family:var(--font-display);font-size:.95rem;font-weight:700;letter-spacing:.09em;
           text-transform:uppercase;margin-bottom:1.25rem;color:var(--text)}

  .table-scroll{overflow-x:auto}
  table{width:100%;min-width:480px;border-collapse:collapse;font-size:.88rem}
  th,td{text-align:left;padding:.75rem .8rem;border-bottom:1px solid var(--border)}
  th{color:var(--muted);font-family:var(--font-display);font-weight:700;font-size:.65rem;
     letter-spacing:.1em;text-transform:uppercase}
  tbody tr:last-child td{border-bottom:none}
  tbody tr:hover{background:rgba(0,229,255,.03)}

  code{font-family:var(--font-mono);font-size:.85em;background:var(--surface);padding:.2rem .5rem;
       border-radius:4px;border:1px solid var(--border)}

  .empty{color:var(--muted);font-size:.9rem;text-align:center;padding:2rem 0 !important}
  .empty code{white-space:nowrap}

  .badge{display:inline-flex;align-items:center;padding:.15rem .6rem;border-radius:1rem;
         font-size:.7rem;font-weight:700;font-family:var(--font-mono)}
  .b-2xx{background:rgba(0,255,163,.1);color:var(--green)}
  .b-3xx{background:rgba(0,229,255,.1);color:var(--accent)}
  .b-4xx{background:rgba(254,188,46,.1);color:var(--amber)}
  .b-5xx{background:rgba(255,95,87,.1);color:var(--red)}
  .b-other{background:rgba(90,110,130,.15);color:var(--muted)}

  .method{font-family:var(--font-mono);font-weight:700;font-size:.78rem;letter-spacing:.02em}
  .m-GET{color:var(--accent)} .m-POST{color:var(--accent2)}
  .m-PUT,.m-PATCH{color:var(--amber)} .m-DELETE{color:var(--red)}

  .dot{width:7px;height:7px;border-radius:50%;display:inline-block;background:var(--green);
       box-shadow:0 0 8px var(--green);animation:pulse 2s ease-in-out infinite;flex-shrink:0}
  .dot.err{background:var(--amber);box-shadow:0 0 8px var(--amber)}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
  .live{display:inline-flex;align-items:center;gap:.5rem;font-family:var(--font-mono);
        font-size:.78rem;color:var(--muted)}
  .tunnel-name{display:flex;align-items:center;gap:.6rem}

  button,.btn{font-family:var(--font-display);font-size:.75rem;font-weight:700;letter-spacing:.09em;
      text-transform:uppercase;padding:.7rem 1.4rem;border-radius:4px;border:none;cursor:pointer;
      background:var(--accent);color:#000;transition:all .2s}
  button:hover,.btn:hover{box-shadow:0 0 24px rgba(0,229,255,.35);transform:translateY(-1px)}
  .btn-ghost{background:transparent;border:1px solid var(--border);color:var(--text);
             padding:.4rem .9rem;font-size:.68rem}
  .btn-ghost:hover{border-color:var(--accent2);color:var(--accent2);box-shadow:none;transform:none}

  .token-cell{display:flex;align-items:center;gap:.7rem}
  .token-copy{background:transparent;border:1px solid var(--border);color:var(--muted);
              padding:.25rem .65rem;font-size:.62rem}
  .token-copy:hover{border-color:var(--accent);color:var(--accent);box-shadow:none;transform:none}

  .filters{display:flex;gap:1.5rem;flex-wrap:wrap;align-items:center;margin-bottom:1.25rem}
  .filter-field{display:flex;align-items:center;gap:.6rem}
  .filter-field label{font-family:var(--font-display);font-size:.65rem;color:var(--muted);
                       letter-spacing:.1em;text-transform:uppercase}
  .filter-field select{background:var(--surface);border:1px solid var(--border);color:var(--text);
      font-family:var(--font-mono);font-size:.78rem;padding:.4rem .7rem;border-radius:4px;cursor:pointer}
  .filter-field select:focus{outline:none;border-color:var(--accent)}
  .log-link{color:var(--text);text-decoration:none}
  .log-link:hover{color:var(--accent);text-decoration:underline}

  footer{position:relative;z-index:1;border-top:1px solid var(--border);padding:2rem;text-align:center;
         color:var(--dim);font-family:var(--font-mono);font-size:.7rem;letter-spacing:.06em}
  footer a{color:var(--muted);text-decoration:none;transition:color .2s}
  footer a:hover{color:var(--accent)}
`;

function shell(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — expose127</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Oxanium:wght@600;700;800&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${SHELL_STYLE}</style>
</head>
<body>
  <div class="bg-grid"></div>
  <nav>
    <a href="/" class="logo"><img src="/logo-expose127.png" alt="expose127"></a>
    <div class="nav-links">
      <a href="/">← Site</a>
      <a href="/logout" class="nav-cta">Sign out</a>
    </div>
  </nav>
  <div class="wrap">${body}</div>
  <footer>
    expose127 — a Bi Enterprises product · powered by <a href="https://hostmargin.com" target="_blank">hostmargin.com</a> &nbsp;·&nbsp;
    <a href="/privacy">Privacy</a> &nbsp;·&nbsp;
    <a href="/terms">Terms</a> &nbsp;·&nbsp;
    <a href="https://npmjs.com/package/expose127" target="_blank">npm</a> &nbsp;·&nbsp;
    MIT License
  </footer>
</body>
</html>`;
}

function statusBucket(code) {
  return code >= 500 ? '5xx' : code >= 400 ? '4xx' : code >= 300 ? '3xx' : code >= 200 ? '2xx' : 'other';
}

function statusBadge(code) {
  return `<span class="badge b-${statusBucket(code)}">${code}</span>`;
}

function methodLabel(method) {
  const cls = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? `m-${method}` : '';
  return `<span class="method ${cls}">${method}</span>`;
}

function maskToken(token) {
  if (token.length <= 16) return token;
  return `${token.slice(0, 8)}••••••••••••${token.slice(-4)}`;
}

function renderDashboard({ user, tunnels, tokens, totalRequests }) {
  const tunnelRows = tunnels.length
    ? tunnels.map(t => `
      <tr>
        <td><span class="tunnel-name"><span class="dot"></span><code>${t.subdomain}</code></span></td>
        <td>${new Date(t.connected_at).toLocaleString()}</td>
        <td><a class="btn-ghost" href="/dashboard/tunnels/${encodeURIComponent(t.subdomain)}/logs">View requests →</a></td>
      </tr>`).join('')
    : `<tr><td colspan="3" class="empty">No active tunnels right now. Start one with <code>npx expose127 8000 --token &lt;your-token&gt;</code></td></tr>`;

  const tokenRows = tokens.length
    ? tokens.map(t => `
      <tr>
        <td><span class="token-cell"><code>${maskToken(t.token)}</code><button class="token-copy" data-token="${t.token}">copy</button></span></td>
        <td>${new Date(t.created_at).toLocaleString()}</td>
      </tr>`).join('')
    : `<tr><td colspan="2" class="empty">No tokens yet — generate one below to link the CLI to your account.</td></tr>`;

  return shell('Dashboard', `
    <h1>Hi ${user.email || 'there'}</h1>
    <p class="sub">Your expose127 tunnels, tokens and request history</p>

    <div class="stat-row">
      <div class="stat"><div class="n">${tunnels.length}</div><div class="l">Active tunnels</div></div>
      <div class="stat"><div class="n">${tokens.length}</div><div class="l">API tokens</div></div>
      <div class="stat"><div class="n">${totalRequests.toLocaleString()}</div><div class="l">Total requests</div></div>
    </div>

    <div class="card">
      <h2>Active tunnels</h2>
      <div class="table-scroll">
      <table><thead><tr><th>Subdomain</th><th>Connected</th><th></th></tr></thead>
      <tbody>${tunnelRows}</tbody></table>
      </div>
    </div>

    <div class="card">
      <h2>API tokens</h2>
      <div class="table-scroll">
      <table><thead><tr><th>Token</th><th>Created</th></tr></thead>
      <tbody>${tokenRows}</tbody></table>
      </div>
      <form method="post" action="/dashboard/token" style="margin-top:1.25rem">
        <button type="submit">Generate new token</button>
      </form>
    </div>

    <script>
      document.querySelectorAll('.token-copy').forEach(function (btn) {
        btn.addEventListener('click', function () {
          navigator.clipboard.writeText(btn.dataset.token).then(function () {
            var original = btn.textContent;
            btn.textContent = 'copied!';
            setTimeout(function () { btn.textContent = original; }, 1500);
          });
        });
      });
    </script>
  `);
}

function renderLogs({ subdomain, rows, tunnelDomain }) {
  const body = rows.length
    ? rows.map(r => {
        const bucket = statusBucket(r.status_code);
        const url = `https://${subdomain}.${tunnelDomain}${r.path}`;
        return `
      <tr data-method="${r.method}" data-status="${bucket}">
        <td>${new Date(r.ts).toLocaleTimeString()}</td>
        <td>${methodLabel(r.method)}</td>
        <td><a class="log-link" href="${url}" target="_blank" rel="noopener"><code>${r.path}</code></a></td>
        <td>${statusBadge(r.status_code)}</td>
        <td>${r.duration_ms}ms</td>
      </tr>`;
      }).join('')
    : `<tr><td colspan="5" class="empty">No requests logged yet for this tunnel.</td></tr>`;

  return shell(`${subdomain} — logs`, `
    <p class="sub"><a href="/dashboard">← back to dashboard</a></p>
    <h1><code>${subdomain}</code></h1>
    <p class="sub">Last ${rows.length} requests · <span class="live"><span class="dot" id="live-dot"></span><span id="live-status">live</span></span></p>

    <div class="filters">
      <div class="filter-field">
        <label for="filter-method">Method</label>
        <select id="filter-method">
          <option value="">All</option>
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>PATCH</option>
          <option>DELETE</option>
          <option>OPTIONS</option>
          <option>HEAD</option>
        </select>
      </div>
      <div class="filter-field">
        <label for="filter-status">Status</label>
        <select id="filter-status">
          <option value="">All</option>
          <option value="2xx">2xx Success</option>
          <option value="3xx">3xx Redirect</option>
          <option value="4xx">4xx Client error</option>
          <option value="5xx">5xx Server error</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="table-scroll">
      <table><thead><tr><th>Time</th><th>Method</th><th>Path</th><th>Status</th><th>Duration</th></tr></thead>
      <tbody id="log-rows">${body}</tbody></table>
      </div>
    </div>
    <script>
      (function () {
        var statusEl = document.getElementById('live-status');
        var dotEl = document.getElementById('live-dot');
        var tbody = document.getElementById('log-rows');
        var methodSelect = document.getElementById('filter-method');
        var statusSelect = document.getElementById('filter-status');
        var timer = setInterval(refresh, 4000);

        function applyFilters() {
          var m = methodSelect.value;
          var s = statusSelect.value;
          var rows = tbody.querySelectorAll('tr[data-method]');
          var visible = 0;
          rows.forEach(function (row) {
            var show = (!m || row.dataset.method === m) && (!s || row.dataset.status === s);
            row.style.display = show ? '' : 'none';
            if (show) visible++;
          });
          var noMatch = tbody.querySelector('tr.no-match');
          if (noMatch) noMatch.remove();
          if (visible === 0 && rows.length > 0) {
            var tr = document.createElement('tr');
            tr.className = 'no-match';
            tr.innerHTML = '<td colspan="5" class="empty">No requests match the selected filters.</td>';
            tbody.appendChild(tr);
          }
        }
        methodSelect.addEventListener('change', applyFilters);
        statusSelect.addEventListener('change', applyFilters);

        async function refresh() {
          try {
            var res = await fetch(location.pathname, { headers: { 'X-Requested-With': 'fetch' } });
            if (!res.ok || res.redirected) throw new Error('session expired');
            var doc = new DOMParser().parseFromString(await res.text(), 'text/html');
            var freshRows = doc.getElementById('log-rows');
            if (!freshRows) throw new Error('unexpected response');
            tbody.innerHTML = freshRows.innerHTML;
            applyFilters();
            statusEl.textContent = 'live';
            dotEl.classList.remove('err');
          } catch (err) {
            statusEl.textContent = 'reconnecting…';
            dotEl.classList.add('err');
            clearInterval(timer);
            setTimeout(function () { location.reload(); }, 2000);
          }
        }
      })();
    </script>
  `);
}

module.exports = { renderLanding, renderPrivacy, renderTerms, renderDashboard, renderLogs };
