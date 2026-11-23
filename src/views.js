'use strict';

// Server-rendered HTML — no templating engine. index.html/privacy.html/terms.html
// used to be static files; they're now rendered here so all three pages (plus the
// dashboard) share one nav/footer instead of three copy-pasted ones.

// ── Design tokens shared by every page (minimalist, light/dark aware) ─────────
const FONT_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`;

const TOKENS = `
  :root{
    --bg:#fafafa; --fg:#0a0a0a; --text:#0a0a0a; --muted:#737373; --faint:#a3a3a3; --dim:#d4d4d4;
    --line:#e5e5e5; --border:#e5e5e5; --card:#ffffff; --surface:#f5f5f5;
    --term:#0a0a0a; --term-line:#1f1f1f;
    --accent:#16a34a; --accent2:#2563eb; --green:#16a34a; --red:#dc2626; --amber:#d97706;
    --font-display:Inter,system-ui,-apple-system,sans-serif;
    --font-body:Inter,system-ui,-apple-system,sans-serif;
    --font-mono:'JetBrains Mono',ui-monospace,Menlo,monospace;
  }
  @media (prefers-color-scheme: dark){
    :root{
      --bg:#0a0a0a; --fg:#fafafa; --text:#fafafa; --muted:#a3a3a3; --faint:#525252; --dim:#3f3f3f;
      --line:#1f1f1f; --border:#1f1f1f; --card:#111111; --surface:#161616;
      --term:#111111; --term-line:#1f1f1f;
      --accent:#4ade80; --accent2:#60a5fa; --green:#4ade80; --red:#f87171; --amber:#fbbf24;
    }
  }
`;

// Wordmark used in every nav — replaces the old neon PNG logo in the header
// (the PNG is still used for apple-touch-icon / social previews).
function logoMark(href, extra) {
  return `<a href="${href}" class="logo"><i><svg viewBox="0 0 16 16" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5l3 3-3 3M9 11h3"/></svg></i><span>expose127</span>${extra || ''}</a>`;
}

const SITE_BASE_STYLE = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ${TOKENS}
  html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
  body { background: var(--bg); color: var(--fg); font-family: var(--font-body); line-height: 1.6;
         min-height: 100vh; overflow-x: hidden; }
  a { color: inherit; text-decoration: none; }
  .mono { font-family: var(--font-mono); }
  .wrap { width: 100%; max-width: 1040px; margin: 0 auto; padding: 0 24px; }

  /* ── NAV ── */
  nav { position: sticky; top: 0; z-index: 100; background: color-mix(in srgb, var(--bg) 82%, transparent);
        backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
  .nav-inner { max-width: 1040px; margin: 0 auto; padding: 20px 24px; display: flex; align-items: center;
               justify-content: space-between; gap: 16px; }
  .logo { display: flex; align-items: center; gap: 10px; font-weight: 600; letter-spacing: -.01em; font-size: 15px; }
  .logo i { width: 22px; height: 22px; border-radius: 6px; background: var(--fg); display: grid; place-items: center; }
  .logo i svg { width: 14px; height: 14px; stroke: var(--bg); }
  .nav-links { display: flex; gap: 28px; align-items: center; font-size: 14px; color: var(--muted); }
  .nav-links a:hover { color: var(--fg); }
  .nav-cta { color: var(--bg) !important; background: var(--fg); padding: 7px 14px; border-radius: 8px; font-weight: 500; }
  .nav-cta:hover { opacity: .85; }
  .nav-toggle { display: none; flex-direction: column; justify-content: center; gap: 4px; background: none;
                border: 1px solid var(--line); border-radius: 8px; width: 36px; height: 32px; cursor: pointer; }
  .nav-toggle span { display: block; width: 14px; height: 1.5px; margin: 0 auto; background: var(--fg); transition: transform .2s, opacity .2s; }
  .nav-toggle.open span:nth-child(1) { transform: translateY(5.5px) rotate(45deg); }
  .nav-toggle.open span:nth-child(2) { opacity: 0; }
  .nav-toggle.open span:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); }
  @media (max-width: 860px) {
    .nav-inner { flex-wrap: wrap; }
    .nav-toggle { display: flex; }
    .nav-links { display: none; flex-direction: column; align-items: stretch; width: 100%; gap: 0; }
    .nav-links.open { display: flex; }
    .nav-links a { padding: 12px 0; border-top: 1px solid var(--line); }
    .nav-cta { text-align: center; margin-top: 8px; padding: 10px 14px; }
  }

  /* ── FOOTER ── */
  footer { border-top: 1px solid var(--line); margin-top: 40px; }
  .footer-inner { max-width: 1040px; margin: 0 auto; padding: 28px 24px; display: flex; justify-content: space-between;
                  gap: 12px 24px; flex-wrap: wrap; font-size: 13px; color: var(--faint); }
  .footer-inner a:hover { color: var(--fg); }
  .footer-links { display: flex; gap: 20px; flex-wrap: wrap; }

  /* ── REVEAL ── */
  .reveal { opacity: 0; transform: translateY(14px); transition: opacity .6s ease, transform .6s ease; }
  .reveal.visible { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) { *{ animation: none !important; transition: none !important; } .reveal{ opacity:1; transform:none; } }
`;

const LANDING_STYLE = `
  /* ── HERO ── */
  .hero { padding: 96px 0 40px; text-align: center; }
  .pill { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted);
          border: 1px solid var(--line); border-radius: 999px; padding: 5px 14px 5px 10px; margin-bottom: 36px; }
  .pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); position: relative; }
  .pulse::after { content: ""; position: absolute; inset: -4px; border-radius: 50%; background: var(--accent);
                  opacity: .35; animation: ping 2s ease-out infinite; }
  @keyframes ping { 0%{ transform: scale(.5); opacity: .5 } 100%{ transform: scale(1.6); opacity: 0 } }
  h1 { font-size: clamp(40px, 7.5vw, 76px); font-weight: 600; letter-spacing: -.045em; line-height: 1.02; }
  h1 .line2 { display: block; color: var(--faint); }
  .subtitle { margin: 24px auto 0; max-width: 560px; font-size: 18px; color: var(--muted); }
  .hero-cta { margin-top: 40px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .btn-primary, .btn-secondary { display: inline-flex; align-items: center; font-size: 14px; font-weight: 500;
          padding: 11px 20px; border-radius: 10px; transition: .15s; }
  .btn-primary { background: var(--fg); color: var(--bg); }
  .btn-primary:hover { opacity: .85; }
  .btn-secondary { border: 1px solid var(--line); color: var(--fg); background: var(--card); }
  .btn-secondary:hover { border-color: var(--muted); }

  /* ── TERMINAL ── */
  .terminal { margin: 72px auto 0; max-width: 760px; background: var(--term); color: #e5e5e5; border-radius: 14px;
              border: 1px solid var(--line); text-align: left; overflow: hidden;
              box-shadow: 0 30px 80px -30px rgba(0,0,0,.35); }
  .terminal-bar { display: flex; align-items: center; gap: 7px; padding: 13px 16px; border-bottom: 1px solid var(--term-line); }
  .terminal-bar b { width: 11px; height: 11px; border-radius: 50%; background: #2a2a2a; }
  .terminal-title { flex: 1; text-align: center; font-size: 12px; color: #737373; margin-right: 47px; }
  .terminal-body { padding: 20px 24px 24px; font-family: var(--font-mono); font-size: 13px; line-height: 1.85;
                   white-space: pre; overflow-x: auto; min-height: 420px; }
  .t-dim{ color:#737373 } .t-faint{ color:#525252 } .t-ok{ color:#4ade80 } .t-url{ color:#fff }
  .t-get{ color:#60a5fa } .t-post{ color:#f472b6 } .t-put{ color:#fbbf24 } .t-del{ color:#f87171 }
  .caret { display: inline-block; width: 8px; height: 15px; background: #e5e5e5; vertical-align: -3px;
           animation: blink 1s steps(1) infinite; }
  @keyframes blink { 50%{ opacity: 0 } }

  /* ── SECTIONS ── */
  section.block { border-top: 1px solid var(--line); padding: 96px 0; margin-top: 96px; }
  section.block + section.block { margin-top: 0; }
  .section-label { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--faint);
                   margin-bottom: 16px; text-align: center; }
  .section-title { font-size: clamp(28px, 4vw, 40px); font-weight: 600; letter-spacing: -.035em; line-height: 1.1;
                   text-align: center; }
  .section-sub { color: var(--muted); text-align: center; margin: 14px auto 56px; max-width: 560px; font-size: 16px; }

  /* ── ARCHITECTURE ── */
  .flow { display: flex; align-items: stretch; justify-content: center; flex-wrap: nowrap; }
  .flow-node { flex: 1 1 0; max-width: 210px; border: 1px solid var(--line); background: var(--card);
               border-radius: 12px; padding: 20px 18px; text-align: center; }
  .flow-node.accent { border-color: var(--fg); }
  .flow-title { font-size: 14px; font-weight: 600; letter-spacing: -.01em; margin-bottom: 4px; }
  .flow-desc { font-family: var(--font-mono); font-size: 12px; color: var(--muted); }
  .wire { flex: 0 0 48px; align-self: center; height: 1px; background: var(--line); position: relative; overflow: hidden; }
  .wire::after { content: ""; position: absolute; top: 0; left: -30%; width: 30%; height: 100%; background: var(--fg);
                 animation: flow 2.2s linear infinite; }
  .wire.back::after { background: var(--accent); animation-direction: reverse; animation-delay: -1.1s; }
  @keyframes flow { to { left: 100%; } }
  .flow-legend { display: flex; justify-content: center; gap: 28px; flex-wrap: wrap; margin-top: 36px;
                 font-size: 13px; color: var(--muted); }
  .flow-legend i { display: inline-block; width: 14px; height: 2px; vertical-align: middle; margin-right: 8px; }

  /* ── STEPS ── */
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--line); border-radius: 14px;
           overflow: hidden; background: var(--card); }
  .step { padding: 32px 28px; display: flex; flex-direction: column; }
  .step + .step { border-left: 1px solid var(--line); }
  .step-num { font-family: var(--font-mono); font-size: 12px; color: var(--faint); margin-bottom: 18px; }
  .step-title { font-size: 16px; font-weight: 600; letter-spacing: -.01em; margin-bottom: 8px; }
  .step-desc { font-size: 14.5px; color: var(--muted); margin-bottom: 22px; flex: 1; }
  .step-code { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px;
               font-family: var(--font-mono); font-size: 12.5px; line-height: 1.85; overflow-x: auto; white-space: nowrap; }
  .step-code .p { color: var(--faint); user-select: none; }
  .step-code .comment { color: var(--faint); }
  .step-code .ok { color: var(--accent); }

  /* ── FEATURES ── */
  .features { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
  .feature { padding: 28px 24px 32px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); }
  .feature-n { font-family: var(--font-mono); font-size: 12px; color: var(--faint); margin-bottom: 16px; }
  .feature-title { font-size: 15px; font-weight: 600; letter-spacing: -.01em; margin-bottom: 6px; }
  .feature-desc { font-size: 14px; color: var(--muted); }
  .platforms { display: flex; flex-wrap: wrap; gap: 6px; }
  .platform-badge { font-size: 12px; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 3px 10px; }

  /* ── CTA ── */
  .cta { text-align: center; }
  .cta h2 { font-size: clamp(32px, 5vw, 52px); font-weight: 600; letter-spacing: -.04em; line-height: 1.05; }
  .cta p { color: var(--muted); margin: 14px 0 36px; font-size: 17px; }
  .install { display: inline-flex; align-items: center; gap: 14px; background: var(--card); border: 1px solid var(--line);
             border-radius: 12px; padding: 12px 12px 12px 20px; font-family: var(--font-mono); font-size: 15px; cursor: pointer; }
  .install .p { color: var(--faint); user-select: none; }
  .copy-btn { border: 1px solid var(--line); background: transparent; color: var(--muted); cursor: pointer; border-radius: 8px;
              padding: 6px 12px; font: 500 13px var(--font-body); transition: .15s; }
  .copy-btn:hover { color: var(--fg); border-color: var(--muted); }
  .copy-btn.ok { color: var(--accent); border-color: var(--accent); }
  .cta .btn-primary { margin-top: 28px; }

  @media (max-width: 900px) {
    .features { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 760px) {
    .hero { padding: 56px 0 24px; }
    .subtitle { font-size: 16px; }
    .terminal { margin-top: 48px; }
    .terminal-body { font-size: 11.5px; padding: 16px; min-height: 380px; }
    section.block { padding: 64px 0; margin-top: 64px; }
    .flow { flex-direction: column; align-items: center; }
    .flow-node { max-width: 280px; width: 100%; }
    .wire { flex: 0 0 28px; width: 1px; height: 28px; }
    .wire::after { left: 0; top: -30%; width: 100%; height: 30%; animation-name: flowv; }
    @keyframes flowv { to { top: 100%; } }
    .steps { grid-template-columns: 1fr; }
    .step + .step { border-left: 0; border-top: 1px solid var(--line); }
    .features { grid-template-columns: 1fr; }
    .install { font-size: 14px; }
  }
`;

const LEGAL_STYLE = `
  .legal-wrap { max-width: 720px; margin: 0 auto; padding: 72px 24px 64px; }
  .legal-label { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--faint); margin-bottom: 16px; }
  .legal-wrap h1 { font-size: clamp(32px, 5vw, 48px); font-weight: 600; letter-spacing: -.04em; line-height: 1.05; margin-bottom: 12px; }
  .legal-wrap .updated { color: var(--faint); font-family: var(--font-mono); font-size: 13px; margin-bottom: 48px; }
  .legal-wrap h2 { font-size: 18px; font-weight: 600; letter-spacing: -.015em; margin: 44px 0 12px; }
  .legal-wrap p { color: var(--muted); line-height: 1.75; font-size: 15.5px; margin-bottom: 14px; }
  .legal-wrap ul { color: var(--muted); line-height: 1.75; font-size: 15.5px; margin: 0 0 14px 20px; }
  .legal-wrap li { margin-bottom: 6px; }
  .legal-wrap strong { color: var(--fg); font-weight: 600; }
  .legal-wrap a { color: var(--fg); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: var(--dim); }
  .legal-wrap a:hover { text-decoration-color: var(--fg); }
  .legal-wrap code { font-family: var(--font-mono); font-size: .88em; background: var(--surface); padding: 2px 6px;
                     border-radius: 5px; border: 1px solid var(--line); }
`;

function siteNav() {
  return `
<nav>
  <div class="nav-inner">
  ${logoMark('/')}
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
  <div class="footer-inner">
    <span>expose127 — a Bi Enterprises product · powered by <a href="https://hostmargin.com" target="_blank">hostmargin.com</a></span>
    <span class="footer-links">
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="https://npmjs.com/package/expose127" target="_blank">npm</a>
      <span>MIT License</span>
    </span>
  </div>
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
  ${FONT_LINK}
  <style>${SITE_BASE_STYLE}${LANDING_STYLE}</style>
</head>
<body>
${siteNav()}

<div class="wrap">
<section class="hero">
  <div class="pill"><span class="pulse"></span>v1.0.5 — live on npm</div>

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

  <div class="terminal" aria-hidden="true">
    <div class="terminal-bar"><b></b><b></b><b></b><div class="terminal-title">PowerShell — expose127</div></div>
    <div class="terminal-body" id="terminal"></div>
  </div>
</section>

<section class="block" id="architecture">
  <div class="section-label reveal">Architecture</div>
  <h2 class="section-title reveal">expose127 + hostmargin, working together</h2>
  <p class="section-sub reveal">One outbound connection from your machine — hostmargin's edge does the rest.</p>

  <div class="flow reveal">
    <div class="flow-node"><div class="flow-title">Your machine</div><div class="flow-desc">localhost:8000</div></div>
    <div class="wire"></div>
    <div class="flow-node"><div class="flow-title">expose127 CLI</div><div class="flow-desc">persistent tunnel client</div></div>
    <div class="wire"></div>
    <div class="flow-node accent"><div class="flow-title">hostmargin edge</div><div class="flow-desc">TLS · routing · hmrg.xyz</div></div>
    <div class="wire back"></div>
    <div class="flow-node"><div class="flow-title">Public visitor</div><div class="flow-desc">https://myapp.hmrg.xyz</div></div>
  </div>

  <div class="flow-legend reveal">
    <span><i style="background:var(--fg)"></i>Incoming request</span>
    <span><i style="background:var(--accent)"></i>Response over the tunnel</span>
  </div>
</section>

<section class="block" id="how">
  <div class="section-label reveal">How it works</div>
  <h2 class="section-title reveal">Three steps to go public</h2>
  <p class="section-sub reveal">No sign-up. No dashboard. Just one command.</p>

  <div class="steps reveal">
    <div class="step">
      <div class="step-num">Step 01</div>
      <div class="step-title">Start your local server</div>
      <div class="step-desc">Run your Laravel, Node.js, React or any app locally as you normally would.</div>
      <div class="step-code">
        <div><span class="p">$ </span>php artisan serve</div>
        <div><span class="p">$ </span>npm run dev</div>
        <div><span class="p">$ </span>python manage.py runserver</div>
      </div>
    </div>
    <div class="step">
      <div class="step-num">Step 02</div>
      <div class="step-title">Run expose127</div>
      <div class="step-desc">Point expose127 at your local port. No install needed — npx runs it instantly.</div>
      <div class="step-code">
        <div><span class="p">$ </span>npx expose127 8000</div>
        <div class="comment"># with a custom subdomain:</div>
        <div><span class="p">$ </span>npx expose127 8000 --subdomain myapp</div>
      </div>
    </div>
    <div class="step">
      <div class="step-num">Step 03</div>
      <div class="step-title">Share the URL</div>
      <div class="step-desc">Get an instant public HTTPS URL powered by hostmargin.com. Share it with anyone.</div>
      <div class="step-code">
        <div>https://myapp.hmrg.xyz</div>
        <div class="ok">✔  Live — share with anyone</div>
      </div>
    </div>
  </div>
</section>

<section class="block" id="features">
  <div class="section-label reveal">Features</div>
  <h2 class="section-title reveal" style="margin-bottom:56px">Everything you need</h2>

  <div class="features reveal">
    <div class="feature"><div class="feature-n">01</div><div class="feature-title">Zero config</div><div class="feature-desc">No account, no dashboard, no YAML. One command and you're live.</div></div>
    <div class="feature"><div class="feature-n">02</div><div class="feature-title">HTTPS by default</div><div class="feature-desc">Every tunnel URL is served over HTTPS via Cloudflare. Secure out of the box.</div></div>
    <div class="feature"><div class="feature-n">03</div><div class="feature-title">Custom subdomains</div><div class="feature-desc">Use --subdomain to get a fixed, memorable URL every time.</div></div>
    <div class="feature"><div class="feature-n">04</div><div class="feature-title">Auto reconnect</div><div class="feature-desc">Lost connection? expose127 reconnects with exponential back-off.</div></div>
    <div class="feature"><div class="feature-n">05</div><div class="feature-title">Live request log</div><div class="feature-desc">See every request in real time — method, status, path, duration.</div></div>
    <div class="feature"><div class="feature-n">06</div><div class="feature-title">Cross-platform</div><div class="feature-desc">Works on Windows, macOS and Linux. Node.js 16+ required.</div></div>
    <div class="feature"><div class="feature-n">07</div><div class="feature-title">Optional dashboard</div><div class="feature-desc">Log in with your hostmargin account to manage API tokens, see active tunnels, and browse request history.</div></div>
    <div class="feature">
      <div class="feature-n">08</div><div class="feature-title">Works with</div>
      <div class="platforms">
        <span class="platform-badge">Windows ✓</span>
        <span class="platform-badge">macOS ✓</span>
        <span class="platform-badge">Linux ✓</span>
        <span class="platform-badge">Node 16+ ✓</span>
        <span class="platform-badge">Laravel ✓</span>
        <span class="platform-badge">Node.js ✓</span>
        <span class="platform-badge">React ✓</span>
        <span class="platform-badge">Django ✓</span>
      </div>
    </div>
  </div>
</section>

<section class="block cta">
  <div class="reveal">
    <h2>Ready to go public?</h2>
    <p>No sign-up needed. Works right now.</p>
    <div class="install" onclick="copyCmd()">
      <span class="p">$</span><span>npx expose127 8000</span>
      <button class="copy-btn" id="copy-btn" type="button">Copy</button>
    </div>
    <br>
    <a href="https://npmjs.com/package/expose127" target="_blank" class="btn-primary">View on npm →</a>
  </div>
</section>
</div>

${siteFooter()}

<script>
  (function () {
    var term = document.getElementById('terminal');
    var MC = { GET:'t-get', POST:'t-post', PUT:'t-put', PATCH:'t-put', DELETE:'t-del' };
    function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }

    // Same session as before: banner, tunnel details, then the live request log.
    var lines = [
      { type:'cmd', text:'npx expose127 8000 --subdomain myapp' },
      { html:'' },
      { html:'<span class="t-faint">  +--------------------------------------------------+</span>' },
      { html:'<span class="t-dim">  |   EXPOSE127  --  instant public tunnel URLs      |</span>' },
      { html:'<span class="t-faint">  +--------------------------------------------------+</span>' },
      { html:'<span class="t-dim">  Instant public URLs  |  v1.0.5  |  hmrg.xyz</span>' },
      { html:'' },
      { html:'<span class="t-ok">  ✔  Tunnel established!</span>' },
      { html:'' },
      { html:'<span class="t-dim">  Public URL   </span><span class="t-url">https://myapp.hmrg.xyz</span>' },
      { html:'<span class="t-dim">  Forwarding   </span>https://myapp.hmrg.xyz → localhost:8000' },
      { html:'<span class="t-dim">  Status       </span><span class="t-ok">online</span>' },
      { html:'' },
      { html:'<span class="t-faint">  ──────────────────────────────────────────────────</span>' },
      { html:'<span class="t-dim">  Time       Method    Status   Path</span>' },
      { html:'<span class="t-faint">  ──────────────────────────────────────────────────</span>' },
      { req:['14:23:01','GET','200','/'] },
      { req:['14:23:01','GET','200','/assets/app.css'] },
      { req:['14:23:03','GET','200','/assets/app.js'] },
      { req:['14:23:06','POST','201','/api/login'] },
      { req:['14:23:09','GET','200','/dashboard'] }
    ];
    lines.forEach(function (l) {
      if (l.req) l.html = '<span class="t-dim">  ' + l.req[0] + '   </span><span class="' + MC[l.req[1]] + '">' +
        pad(l.req[1], 10) + '</span><span class="t-ok">' + pad(l.req[2], 9) + '</span>' + l.req[3];
    });

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var out = [];
    function draw(extra) { term.innerHTML = out.join('<br>') + (out.length ? '<br>' : '') + (extra || '') + '<span class="caret"></span>'; }

    if (reduce) {
      out = lines.map(function (l) { return l.type === 'cmd' ? '<span class="t-dim">$</span> ' + l.text : l.html; });
      draw(); return;
    }

    var i = 0;
    function next() {
      if (i >= lines.length) { setTimeout(function () { out = []; i = 0; draw(); setTimeout(next, 800); }, 5000); return; }
      var l = lines[i++];
      if (l.type === 'cmd') {
        var c = 0;
        (function typeChar() {
          draw('<span class="t-dim">$</span> ' + l.text.slice(0, c));
          if (c++ < l.text.length) setTimeout(typeChar, 45);
          else { out.push('<span class="t-dim">$</span> ' + l.text); setTimeout(next, 500); }
        })();
      } else {
        out.push(l.html); draw();
        setTimeout(next, l.req ? 550 : 90);
      }
    }
    draw();
    setTimeout(next, 700);

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, k) {
        if (e.isIntersecting) { setTimeout(function () { e.target.classList.add('visible'); }, k * 70); obs.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
  })();

  function copyCmd() {
    var btn = document.getElementById('copy-btn');
    var done = function () {
      btn.textContent = 'Copied'; btn.classList.add('ok');
      setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('ok'); }, 1600);
    };
    if (navigator.clipboard) navigator.clipboard.writeText('npx expose127 8000').then(done, done); else done();
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

  ${FONT_LINK}
  <style>${SITE_BASE_STYLE}${LEGAL_STYLE}</style>
</head>
<body>

${siteNav()}

<div class="legal-wrap">
  <div class="legal-label">// legal</div>
  <h1>Privacy Policy</h1>
  <p class="updated">Last updated: August 16, 2026</p>

  <p>This Privacy Policy explains how <strong>expose127</strong>, a Bi Enterprises product operated via <a href="https://hostmargin.com" target="_blank">hostmargin.com</a>, collects, uses, and protects information when you use the expose127 CLI, the customer dashboard at expose127.hostmargin.com, and related services (together, the "Service").</p>

  <h2>1. Information we collect</h2>
  <p><strong>Account information.</strong> When you sign in to the dashboard, hostmargin's login system hands off your account ID and email address to expose127 so we can identify your account. We do not operate a separate sign-up form — your account lives with hostmargin.</p>
  <p><strong>API tokens.</strong> Tokens you generate in the dashboard to link the CLI to your account. Tokens are stored so we can recognize your tunnels; treat them like a password.</p>
  <p><strong>Tunnel metadata.</strong> The subdomain you request and the times your tunnel connects and disconnects — recorded for every tunnel, whether or not it's linked to an account.</p>
  <p><strong>Request logs.</strong> We record the HTTP method, path, status code, duration, and timestamp of every request that passes through any expose127 tunnel, whether or not it's linked to an account. If your tunnel is linked to your account (via an API token), this is metadata about traffic through your own tunnel — visible only to your account in your dashboard, never to other customers. If you run expose127 without a token, your tunnel is anonymous: this data isn't linked to any identifiable account and isn't shown in any customer-facing dashboard.</p>
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
  <p>Account, token, and tunnel records tied to your account are kept for as long as your account remains active. Anonymous tunnel and request data (not linked to any account) is retained only as long as necessary to operate and secure the Service. Request logs are retained only as long as necessary to support the dashboard's debugging features and may be purged periodically. You can ask us to delete your account-linked data at any time using the contact details below.</p>

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

  ${FONT_LINK}
  <style>${SITE_BASE_STYLE}${LEGAL_STYLE}</style>
</head>
<body>

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
  ${TOKENS}
  html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased}
  body{background:var(--bg);color:var(--fg);font-family:var(--font-body);font-size:15px;line-height:1.55;
       min-height:100vh;display:flex;flex-direction:column}

  nav{position:sticky;top:0;z-index:100;background:color-mix(in srgb,var(--bg) 82%,transparent);
      backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
  .nav-inner{max-width:1040px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  nav.wide .nav-inner{max-width:1500px}
  .logo{display:flex;align-items:center;gap:10px;font-weight:600;letter-spacing:-.01em;font-size:15px;color:var(--fg);text-decoration:none}
  .logo i{width:22px;height:22px;border-radius:6px;background:var(--fg);display:grid;place-items:center}
  .logo i svg{width:14px;height:14px;stroke:var(--bg)}
  .admin-badge{font-family:var(--font-mono);font-size:10px;font-weight:500;letter-spacing:.08em;
      color:var(--red);border:1px solid currentColor;border-radius:999px;padding:1px 8px;text-transform:uppercase}
  .nav-links{display:flex;gap:24px;align-items:center}
  nav a{color:var(--muted);text-decoration:none;font-size:14px;transition:color .15s}
  nav a.logo{color:var(--fg)}
  nav a:hover{color:var(--fg)}
  .nav-cta{color:var(--fg) !important;border:1px solid var(--line);padding:6px 12px;border-radius:8px}
  .nav-cta:hover{border-color:var(--muted)}

  .wrap{width:100%;max-width:1040px;margin:0 auto;padding:48px 24px 64px;flex:1}
  h1{font-size:32px;font-weight:600;letter-spacing:-.035em;line-height:1.15;margin-bottom:6px;overflow-wrap:break-word}
  h1 code{font-size:.85em;font-weight:500;background:none;border:0;padding:0}
  .sub{color:var(--muted);margin-bottom:28px;font-size:14.5px}
  .sub a{color:var(--fg);text-decoration:none}
  .sub a:hover{text-decoration:underline;text-underline-offset:3px}

  .stat-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px}
  .stat .n{font-size:30px;font-weight:600;letter-spacing:-.03em;color:var(--fg);line-height:1}
  .stat .l{color:var(--muted);font-size:13px;margin-top:8px}

  .card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:24px;margin-bottom:20px}
  .card h2{font-size:15px;font-weight:600;letter-spacing:-.01em;margin-bottom:16px;color:var(--fg);
           display:flex;align-items:center;gap:8px}
  .card h2 .count{font-family:var(--font-mono);color:var(--faint);font-weight:400;font-size:13px}

  .table-scroll{overflow-x:auto}
  table{width:100%;min-width:480px;border-collapse:collapse;font-size:14px}
  th,td{text-align:left;padding:11px 12px;border-bottom:1px solid var(--line)}
  th{color:var(--faint);font-weight:500;font-size:12px}
  tbody tr:last-child td{border-bottom:none}
  tbody tr:hover{background:var(--surface)}

  code{font-family:var(--font-mono);font-size:.86em;background:var(--surface);padding:2px 7px;
       border-radius:6px;border:1px solid var(--line)}

  .empty{color:var(--muted);font-size:14px;text-align:center;padding:32px 0 !important}
  .empty code{white-space:nowrap}

  .badge{display:inline-flex;align-items:center;padding:1px 9px;border-radius:999px;
         font-size:12px;font-weight:500;font-family:var(--font-mono);border:1px solid currentColor}
  .b-2xx{color:var(--green)}
  .b-3xx{color:var(--accent2)}
  .b-4xx{color:var(--amber)}
  .b-5xx{color:var(--red)}
  .b-other{color:var(--muted)}

  .method{font-family:var(--font-mono);font-weight:500;font-size:12.5px}
  .m-GET{color:var(--accent2)} .m-POST{color:#db2777}
  .m-PUT,.m-PATCH{color:var(--amber)} .m-DELETE{color:var(--red)}

  .dot{width:7px;height:7px;border-radius:50%;display:inline-block;background:var(--green);
       animation:pulse 2s ease-in-out infinite;flex-shrink:0}
  .dot.err{background:var(--amber)}
  .dot.inactive{background:var(--dim);animation:none}

  .pager{align-items:center;justify-content:center;gap:16px;margin-top:16px}
  .pager button:disabled{opacity:.35;cursor:not-allowed}

  .admin-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;
      gap:16px 24px;margin-bottom:28px}
  .admin-live{gap:10px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 14px}
  .admin-live .sep{color:var(--dim)}
  .admin-live button{padding:5px 10px;font-size:12.5px}

  .table-toolbar{display:flex;justify-content:flex-end;margin-bottom:14px}
  .table-search{background:var(--surface);border:1px solid var(--line);color:var(--fg);
      font-family:var(--font-body);font-size:13.5px;padding:8px 12px;border-radius:8px;width:100%;max-width:280px}
  .table-search:focus{outline:none;border-color:var(--muted)}
  .table-search::placeholder{color:var(--faint)}

  .wrap.wide{max-width:1500px}

  .admin-charts{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:20px;margin-bottom:20px}
  .admin-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(560px,1fr));gap:20px}
  .admin-grid .card{margin-bottom:0}
  @media (max-width:980px){ .admin-charts{grid-template-columns:1fr} }
  @media (max-width:640px){ .admin-grid{grid-template-columns:1fr} .wrap{padding:32px 16px 48px} .nav-inner{padding:14px 16px} }

  .chart-svg{width:100%;height:auto;display:block}
  .chart-axis{stroke:var(--line);stroke-width:1}
  .chart-line{stroke:#3987e5;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
  .chart-area{fill:#3987e5;fill-opacity:.12;stroke:none}
  .chart-dot{fill:#3987e5;stroke:var(--card);stroke-width:2}
  .chart-hit{cursor:default}
  .chart-caption{margin-top:12px;text-align:center;font-size:12px}

  .bar-chart{display:flex;flex-direction:column;gap:12px}
  .bar-row{display:grid;grid-template-columns:76px 1fr 2.75rem;align-items:center;gap:12px}
  .bar-label{font-family:var(--font-mono);font-size:11.5px;color:var(--muted);text-align:right;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .bar-track{background:var(--surface);border:1px solid var(--line);border-radius:6px;height:20px;position:relative;overflow:hidden}
  .bar-fill{height:100%;border-radius:5px;transition:width .3s ease;min-width:3px}
  .bar-value{font-family:var(--font-mono);font-size:12px;color:var(--fg);text-align:right}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
  .live{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:12.5px;color:var(--muted)}
  .tunnel-name{display:flex;align-items:center;gap:10px}

  button,.btn{font-family:var(--font-body);font-size:13.5px;font-weight:500;padding:9px 16px;border-radius:8px;
      border:1px solid var(--fg);cursor:pointer;background:var(--fg);color:var(--bg);transition:opacity .15s,border-color .15s;
      text-decoration:none;display:inline-block}
  button:hover,.btn:hover{opacity:.85}
  .btn-ghost{background:transparent;border:1px solid var(--line);color:var(--fg);padding:5px 11px;font-size:13px;border-radius:8px;text-decoration:none;display:inline-block;white-space:nowrap}
  .btn-ghost:hover{border-color:var(--muted);opacity:1}

  .token-cell{display:flex;align-items:center;gap:10px}
  .token-copy{background:transparent;border:1px solid var(--line);color:var(--muted);padding:3px 9px;font-size:12px}
  .token-copy:hover{color:var(--fg);border-color:var(--muted);opacity:1}

  .filters{display:flex;gap:20px;flex-wrap:wrap;align-items:center;margin-bottom:16px}
  .filter-field{display:flex;align-items:center;gap:8px}
  .filter-field label{font-size:13px;color:var(--muted)}
  .filter-field select{background:var(--card);border:1px solid var(--line);color:var(--fg);
      font-family:var(--font-body);font-size:13.5px;padding:6px 10px;border-radius:8px;cursor:pointer}
  .filter-field select:focus{outline:none;border-color:var(--muted)}
  .log-link{color:var(--fg);text-decoration:none}
  .log-link:hover{text-decoration:underline;text-underline-offset:3px}

  input[type=email],input[type=password]{font-family:var(--font-body) !important;border-radius:8px !important}
  input:focus{outline:none;border-color:var(--muted) !important}

  footer{border-top:1px solid var(--line)}
  .footer-inner{max-width:1040px;margin:0 auto;padding:24px;display:flex;justify-content:space-between;gap:12px 24px;
      flex-wrap:wrap;font-size:13px;color:var(--faint)}
  footer a{color:var(--faint);text-decoration:none}
  footer a:hover{color:var(--fg)}
  .footer-links{display:flex;gap:20px;flex-wrap:wrap}
`;

function shell(title, body, navOverride, wrapClass) {
  const nav = navOverride || `
    ${logoMark('/')}
    <div class="nav-links">
      <a href="/">← Site</a>
      <a href="/logout" class="nav-cta">Sign out</a>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — expose127</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  ${FONT_LINK}
  <style>${SHELL_STYLE}</style>
</head>
<body>
  <nav${wrapClass ? ' class="' + wrapClass + '"' : ''}><div class="nav-inner">${nav}</div></nav>
  <div class="wrap${wrapClass ? ' ' + wrapClass : ''}">${body}</div>
  <footer>
    <div class="footer-inner">
      <span>expose127 — a Bi Enterprises product · powered by <a href="https://hostmargin.com" target="_blank">hostmargin.com</a></span>
      <span class="footer-links">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="https://npmjs.com/package/expose127" target="_blank">npm</a>
        <span>MIT License</span>
      </span>
    </div>
  </footer>
</body>
</html>`;
}

function adminNav(showSignOut) {
  return `
    ${logoMark('/admin', '<span class="admin-badge">Admin</span>')}
    <div class="nav-links">
      <a href="/">← Site</a>
      ${showSignOut ? '<a href="/admin/logout" class="nav-cta">Sign out</a>' : ''}
    </div>`;
}

function statusBucket(code) {
  return code >= 500 ? '5xx' : code >= 400 ? '4xx' : code >= 300 ? '3xx' : code >= 200 ? '2xx' : 'other';
}

// request paths, emails, and (defense-in-depth) subdomains all flow into
// these templates from data an attacker can influence — a request path is
// literally whatever an anonymous visitor sends to a public tunnel URL, and
// it gets stored and replayed here later. Escape before every interpolation
// below that isn't a value we generated ourselves (tokens, counts, dates).
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function statusBadge(code) {
  return `<span class="badge b-${statusBucket(code)}">${code}</span>`;
}

function methodLabel(method) {
  const cls = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? `m-${method}` : '';
  return `<span class="method ${cls}">${method}</span>`;
}

function clientLabel(clientId) {
  return clientId === null || clientId === undefined
    ? '<span class="sub" style="margin:0;font-style:italic">anonymous</span>'
    : clientId;
}

function maskToken(token) {
  if (token.length <= 16) return token;
  return `${token.slice(0, 8)}••••••••••••${token.slice(-4)}`;
}

function renderDashboard({ user, tunnels, pastTunnels, tokens, totalRequests }) {
  const tunnelRows = tunnels.length
    ? tunnels.map(t => `
      <tr>
        <td><span class="tunnel-name"><span class="dot"></span><code>${escapeHtml(t.subdomain)}</code></span></td>
        <td>${new Date(t.connected_at).toLocaleString()}</td>
        <td><a class="btn-ghost" href="/dashboard/tunnels/${encodeURIComponent(t.subdomain)}/logs">View requests →</a></td>
      </tr>`).join('')
    : `<tr><td colspan="3" class="empty">No active tunnels right now. Start one with <code>npx expose127 8000 --token &lt;your-token&gt;</code></td></tr>`;

  const pastTunnelRows = pastTunnels.length
    ? pastTunnels.map(t => `
      <tr>
        <td><span class="tunnel-name"><span class="dot inactive"></span><code>${escapeHtml(t.subdomain)}</code></span></td>
        <td>${new Date(t.connected_at).toLocaleString()}</td>
        <td>${new Date(t.closed_at).toLocaleString()}</td>
        <td><a class="btn-ghost" href="/dashboard/tunnels/${encodeURIComponent(t.subdomain)}/logs">View requests →</a></td>
      </tr>`).join('')
    : `<tr><td colspan="4" class="empty">No past tunnels yet — closed tunnels will show up here.</td></tr>`;

  const tokenRows = tokens.length
    ? tokens.map(t => `
      <tr>
        <td><span class="token-cell"><code>${maskToken(t.token)}</code><button class="token-copy" data-token="${t.token}">copy</button></span></td>
        <td>${new Date(t.created_at).toLocaleString()}</td>
        <td>
          <form method="post" action="/dashboard/token/${encodeURIComponent(t.token)}/revoke" onsubmit="return confirm('Revoke this token? Any CLI using it will stop being able to connect.')">
            <button type="submit" class="btn-ghost">Revoke</button>
          </form>
        </td>
      </tr>`).join('')
    : `<tr><td colspan="3" class="empty">No tokens yet — generate one below to link the CLI to your account.</td></tr>`;

  return shell('Dashboard', `
    <h1>Hi ${escapeHtml(user.email || 'there')}</h1>
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
      <h2>Tunnel history</h2>
      <div class="table-scroll">
      <table><thead><tr><th>Subdomain</th><th>Connected</th><th>Disconnected</th><th></th></tr></thead>
      <tbody>${pastTunnelRows}</tbody></table>
      </div>
    </div>

    <div class="card">
      <h2>API tokens</h2>
      <div class="table-scroll">
      <table><thead><tr><th>Token</th><th>Created</th><th></th></tr></thead>
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

function renderLogs({ subdomain, rows, tunnelDomain, backHref, backLabel }) {
  const body = rows.length
    ? rows.map(r => {
        const bucket = statusBucket(r.status_code);
        const url = `https://${subdomain}.${tunnelDomain}${r.path}`;
        return `
      <tr data-method="${r.method}" data-status="${bucket}">
        <td>${new Date(r.ts).toLocaleTimeString()}</td>
        <td>${methodLabel(r.method)}</td>
        <td><a class="log-link" href="${escapeHtml(url)}" target="_blank" rel="noopener"><code>${escapeHtml(r.path)}</code></a></td>
        <td>${statusBadge(r.status_code)}</td>
        <td>${r.duration_ms}ms</td>
      </tr>`;
      }).join('')
    : `<tr><td colspan="5" class="empty">No requests logged yet for this tunnel.</td></tr>`;

  return shell(`${subdomain} — logs`, `
    <p class="sub"><a href="${backHref || '/dashboard'}">← ${backLabel || 'back to dashboard'}</a></p>
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

function renderAdminLogin({ error }) {
  return shell('Admin login', `
    <div class="card" style="max-width:420px;margin:2rem auto 0">
      <h2>Admin login</h2>
      ${error ? `<p class="sub" style="color:var(--red)">${error}</p>` : ''}
      <form method="post" action="/admin/login">
        <div style="margin-bottom:1rem">
          <label class="sub" style="display:block;margin-bottom:.4rem">Email</label>
          <input type="email" name="email" required autofocus
            style="width:100%;background:var(--surface);border:1px solid var(--border);color:var(--text);
                   font-family:var(--font-mono);font-size:.9rem;padding:.6rem .8rem;border-radius:4px">
        </div>
        <div style="margin-bottom:1.5rem">
          <label class="sub" style="display:block;margin-bottom:.4rem">Password</label>
          <input type="password" name="password" required
            style="width:100%;background:var(--surface);border:1px solid var(--border);color:var(--text);
                   font-family:var(--font-mono);font-size:.9rem;padding:.6rem .8rem;border-radius:4px">
        </div>
        <button type="submit" style="width:100%">Sign in</button>
      </form>
    </div>
  `, adminNav(false));
}

function pagerControls(id) {
  return `
    <div class="pager" id="${id}" style="display:none">
      <button type="button" class="btn-ghost prev">← Prev</button>
      <span class="sub page-info" style="margin:0"></span>
      <button type="button" class="btn-ghost next">Next →</button>
    </div>`;
}

function searchToolbar(id, placeholder) {
  return `
    <div class="table-toolbar">
      <input type="search" class="table-search" id="${id}" placeholder="${placeholder}">
    </div>`;
}

function adminTunnelRows(activeTunnels) {
  return activeTunnels.length
    ? activeTunnels.map(t => `
      <tr class="data-row">
        <td><span class="tunnel-name"><span class="dot"></span><code>${escapeHtml(t.subdomain)}</code></span></td>
        <td>${clientLabel(t.client_id)}</td>
        <td>${new Date(t.connected_at).toLocaleString()}</td>
        <td><a class="btn-ghost" href="/admin/tunnels/${encodeURIComponent(t.subdomain)}/logs">View requests →</a></td>
      </tr>`).join('')
    : `<tr><td colspan="4" class="empty">No active tunnels right now.</td></tr>`;
}

function adminPastTunnelRows(pastTunnels) {
  return pastTunnels.length
    ? pastTunnels.map(t => `
      <tr class="data-row">
        <td><span class="tunnel-name"><span class="dot inactive"></span><code>${escapeHtml(t.subdomain)}</code></span></td>
        <td>${clientLabel(t.client_id)}</td>
        <td>${new Date(t.connected_at).toLocaleString()}</td>
        <td>${new Date(t.closed_at).toLocaleString()}</td>
        <td><a class="btn-ghost" href="/admin/tunnels/${encodeURIComponent(t.subdomain)}/logs">View requests →</a></td>
      </tr>`).join('')
    : `<tr><td colspan="5" class="empty">No past tunnels yet.</td></tr>`;
}

function adminTokenRows(tokens) {
  return tokens.length
    ? tokens.map(t => `
      <tr class="data-row">
        <td><code>${maskToken(t.token)}</code></td>
        <td>${t.client_id}</td>
        <td>${escapeHtml(t.email || '')}</td>
        <td>${new Date(t.created_at).toLocaleString()}</td>
        <td>${t.revoked_at ? `<span class="badge b-4xx">revoked</span>` : `<span class="badge b-2xx">active</span>`}</td>
      </tr>`).join('')
    : `<tr><td colspan="5" class="empty">No tokens yet.</td></tr>`;
}

function adminRequestRows(requests) {
  return requests.length
    ? requests.map(r => `
      <tr class="data-row">
        <td>${new Date(r.ts).toLocaleString()}</td>
        <td>${clientLabel(r.client_id)}</td>
        <td><code>${escapeHtml(r.subdomain)}</code></td>
        <td>${methodLabel(r.method)}</td>
        <td><code>${escapeHtml(r.path)}</code></td>
        <td>${statusBadge(r.status_code)}</td>
        <td>${r.duration_ms}ms</td>
      </tr>`).join('')
    : `<tr><td colspan="7" class="empty">No requests logged yet.</td></tr>`;
}

// Colors below are a validated categorical sequence (dataviz skill's default
// palette, dark-mode steps 1-5 in original order) — chosen because the site's
// own brand hues (cyan/violet/amber/red) fail the adjacent-pair CVD check at
// this lightness. Fixed order, never reassigned by frequency, so a method's
// color stays stable across live refreshes.
const METHOD_CHART_ORDER = [
  { key: 'GET',    color: '#3987e5' },
  { key: 'POST',   color: '#d95926' },
  { key: 'PUT',    color: '#199e70' },
  { key: 'PATCH',  color: '#c98500' },
  { key: 'DELETE', color: '#d55181' },
];
const METHOD_OTHER_COLOR = '#5a6e82';

// Status colors are the dataviz skill's fixed status scale (good/warning/
// critical) — reserved meaning, contrast-checked against this app's actual
// card surface (#0f1520) rather than eyeballed.
const STATUS_CHART_ORDER = [
  { key: '2xx', color: '#0ca30c' },
  { key: '3xx', color: '#5a6e82' },
  { key: '4xx', color: '#fab219' },
  { key: '5xx', color: '#d03b3b' },
];

function buildBarChartHtml(entries, emptyText) {
  const total = entries.reduce((sum, e) => sum + e.count, 0);
  if (total === 0) {
    return `<div class="empty" style="padding:2rem 0">${emptyText}</div>`;
  }
  const maxCount = Math.max(...entries.map(e => e.count), 1);
  const rows = entries
    .filter(e => e.count > 0)
    .map(e => {
      const pct = Math.max((e.count / maxCount) * 100, 2);
      return `
      <div class="bar-row" title="${e.label}: ${e.count} request${e.count === 1 ? '' : 's'}">
        <div class="bar-label">${e.label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct.toFixed(1)}%;background:${e.color}"></div></div>
        <div class="bar-value">${e.count}</div>
      </div>`;
    }).join('');
  return `<div class="bar-chart">${rows}</div>`;
}

function buildMethodBarChart(requests) {
  const counts = {};
  requests.forEach(r => { counts[r.method] = (counts[r.method] || 0) + 1; });

  const knownKeys = new Set(METHOD_CHART_ORDER.map(m => m.key));
  const entries = METHOD_CHART_ORDER.map(m => ({ label: m.key, count: counts[m.key] || 0, color: m.color }));
  const otherCount = Object.entries(counts).reduce((sum, [k, v]) => (knownKeys.has(k) ? sum : sum + v), 0);
  if (otherCount > 0) entries.push({ label: 'Other', count: otherCount, color: METHOD_OTHER_COLOR });

  return buildBarChartHtml(entries, 'No requests logged yet.');
}

function buildStatusBarChart(requests) {
  const counts = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
  requests.forEach(r => {
    const bucket = statusBucket(r.status_code);
    if (counts[bucket] !== undefined) counts[bucket]++;
  });
  const entries = STATUS_CHART_ORDER.map(s => ({ label: s.key, count: counts[s.key], color: s.color }));
  return buildBarChartHtml(entries, 'No requests logged yet.');
}

function buildTimeSeriesChart(requests) {
  if (!requests.length) {
    return `<div class="empty" style="padding:2.5rem 0">No request activity yet.</div>`;
  }

  const W = 600, H = 200, padL = 8, padR = 8, padT = 10, padB = 10;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const BUCKETS = 24;

  const timestamps = requests.map(r => r.ts);
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const span = Math.max(maxTs - minTs, 1);

  const counts = new Array(BUCKETS).fill(0);
  requests.forEach(r => {
    let idx = Math.floor(((r.ts - minTs) / span) * BUCKETS);
    if (idx >= BUCKETS) idx = BUCKETS - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  });

  const maxCount = Math.max(...counts, 1);
  const bucketW = plotW / BUCKETS;
  const points = counts.map((c, i) => {
    const x = padL + i * bucketW + bucketW / 2;
    const y = padT + plotH - (c / maxCount) * plotH;
    return [x, y];
  });

  const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const baseline = (padT + plotH).toFixed(1);
  const areaPath = `${linePath} L${points[points.length - 1][0].toFixed(1)},${baseline} L${points[0][0].toFixed(1)},${baseline} Z`;

  const bucketSpan = span / BUCKETS;
  const hoverRects = counts.map((c, i) => {
    const x = padL + i * bucketW;
    const bucketStart = minTs + bucketSpan * i;
    const label = new Date(bucketStart).toLocaleTimeString();
    return `<rect x="${x.toFixed(1)}" y="${padT}" width="${bucketW.toFixed(1)}" height="${plotH}" class="chart-hit" fill="transparent"><title>${label} — ${c} request${c === 1 ? '' : 's'}</title></rect>`;
  }).join('');

  const dots = points.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" class="chart-dot"/>`).join('');

  return `
    <svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Requests over time">
      <line x1="${padL}" y1="${baseline}" x2="${(padL + plotW).toFixed(1)}" y2="${baseline}" class="chart-axis"/>
      <path d="${areaPath}" class="chart-area"/>
      <path d="${linePath}" fill="none" class="chart-line"/>
      ${dots}
      ${hoverRects}
    </svg>
    <div class="chart-caption sub">Last ${requests.length} requests · ${new Date(minTs).toLocaleTimeString()} – ${new Date(maxTs).toLocaleTimeString()}</div>
  `;
}

function renderAdminDashboard({ stats, activeTunnels, pastTunnels, tokens, requests, tunnelDomain, pageSize }) {
  const tunnelRows = adminTunnelRows(activeTunnels);
  const pastTunnelRows = adminPastTunnelRows(pastTunnels);
  const tokenRows = adminTokenRows(tokens);
  const requestRows = adminRequestRows(requests);
  const timeSeriesChart = buildTimeSeriesChart(requests);
  const statusChart = buildStatusBarChart(requests);
  const methodChart = buildMethodBarChart(requests);

  return shell('Admin panel', `
    <div class="admin-header">
      <div>
        <h1>Admin panel</h1>
        <p class="sub" style="margin:0">Every client's tunnels, tokens, and requests — most recent ${pageSize} per list.</p>
      </div>
      <div class="live admin-live">
        <span class="dot" id="admin-live-dot"></span>
        <span id="admin-live-status">Live</span>
        <span class="sep">·</span>
        <span id="admin-last-updated">updated just now</span>
        <button type="button" class="btn-ghost" id="admin-refresh-now">Refresh now</button>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat"><div class="n" id="stat-active_tunnels">${stats.active_tunnels}</div><div class="l">Active tunnels</div></div>
      <div class="stat"><div class="n" id="stat-total_tunnels">${stats.total_tunnels}</div><div class="l">Tunnels ever</div></div>
      <div class="stat"><div class="n" id="stat-active_tokens">${stats.active_tokens}</div><div class="l">Active tokens</div></div>
      <div class="stat"><div class="n" id="stat-total_tokens">${stats.total_tokens}</div><div class="l">Tokens ever</div></div>
      <div class="stat"><div class="n" id="stat-total_requests">${stats.total_requests.toLocaleString()}</div><div class="l">Total requests</div></div>
      <div class="stat"><div class="n" id="stat-distinct_clients">${stats.distinct_clients}</div><div class="l">Distinct clients</div></div>
    </div>

    <div class="admin-charts">
      <div class="card">
        <h2>Requests over time</h2>
        <div id="chart-timeseries">${timeSeriesChart}</div>
      </div>
      <div class="card">
        <h2>Status codes</h2>
        <div id="chart-status">${statusChart}</div>
      </div>
      <div class="card">
        <h2>Methods</h2>
        <div id="chart-method">${methodChart}</div>
      </div>
    </div>

    <div class="admin-grid">
    <div class="card">
      <h2>Active tunnels (all clients)</h2>
      ${searchToolbar('admin-tunnels-search', 'Search subdomain, client…')}
      <div class="table-scroll">
      <table><thead><tr><th>Subdomain</th><th>Client</th><th>Connected</th><th></th></tr></thead>
      <tbody id="admin-tunnels-rows">${tunnelRows}</tbody></table>
      </div>
      ${pagerControls('admin-tunnels-pager')}
    </div>

    <div class="card">
      <h2>Tunnel history (all clients)</h2>
      ${searchToolbar('admin-history-search', 'Search subdomain, client…')}
      <div class="table-scroll">
      <table><thead><tr><th>Subdomain</th><th>Client</th><th>Connected</th><th>Disconnected</th><th></th></tr></thead>
      <tbody id="admin-history-rows">${pastTunnelRows}</tbody></table>
      </div>
      ${pagerControls('admin-history-pager')}
    </div>

    <div class="card">
      <h2>API tokens (all clients)</h2>
      ${searchToolbar('admin-tokens-search', 'Search token, client, email…')}
      <div class="table-scroll">
      <table><thead><tr><th>Token</th><th>Client</th><th>Email</th><th>Created</th><th>Status</th></tr></thead>
      <tbody id="admin-tokens-rows">${tokenRows}</tbody></table>
      </div>
      ${pagerControls('admin-tokens-pager')}
    </div>

    <div class="card">
      <h2>Recent requests (all clients, all tunnels)</h2>
      ${searchToolbar('admin-requests-search', 'Search subdomain, path, client…')}
      <div class="table-scroll">
      <table><thead><tr><th>Time</th><th>Client</th><th>Subdomain</th><th>Method</th><th>Path</th><th>Status</th><th>Duration</th></tr></thead>
      <tbody id="admin-requests-rows">${requestRows}</tbody></table>
      </div>
      ${pagerControls('admin-requests-pager')}
    </div>
    </div>

    <script>
      (function () {
        var pageSize = 10;

        function setupTable(tbodyId, pagerId, searchId) {
          var tbody = document.getElementById(tbodyId);
          var pager = document.getElementById(pagerId);
          var searchInput = document.getElementById(searchId);
          var page = 0;

          function render() {
            var all = Array.prototype.slice.call(tbody.querySelectorAll('tr.data-row'));
            var visible = all.filter(function (row) { return row.dataset.searchHidden !== '1'; });
            var totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
            if (page >= totalPages) page = totalPages - 1;
            if (page < 0) page = 0;

            all.forEach(function (row) {
              if (row.dataset.searchHidden === '1') { row.style.display = 'none'; return; }
              var idx = visible.indexOf(row);
              row.style.display = (idx >= page * pageSize && idx < (page + 1) * pageSize) ? '' : 'none';
            });

            if (visible.length <= pageSize) {
              pager.style.display = 'none';
            } else {
              pager.style.display = 'flex';
              pager.querySelector('.page-info').textContent =
                'Page ' + (page + 1) + ' of ' + totalPages + ' (' + visible.length + ' rows)';
              pager.querySelector('.prev').disabled = page === 0;
              pager.querySelector('.next').disabled = page === totalPages - 1;
            }
          }

          pager.querySelector('.prev').addEventListener('click', function () { page--; render(); });
          pager.querySelector('.next').addEventListener('click', function () { page++; render(); });

          searchInput.addEventListener('input', function () {
            var q = searchInput.value.trim().toLowerCase();
            tbody.querySelectorAll('tr.data-row').forEach(function (row) {
              row.dataset.searchHidden = (q && row.textContent.toLowerCase().indexOf(q) === -1) ? '1' : '';
            });
            page = 0;
            render();
          });

          render();
          return { render: render, reapplySearch: function () { searchInput.dispatchEvent(new Event('input')); } };
        }

        var tables = {
          tunnels:  setupTable('admin-tunnels-rows',  'admin-tunnels-pager',  'admin-tunnels-search'),
          history:  setupTable('admin-history-rows',  'admin-history-pager',  'admin-history-search'),
          tokens:   setupTable('admin-tokens-rows',   'admin-tokens-pager',   'admin-tokens-search'),
          requests: setupTable('admin-requests-rows', 'admin-requests-pager', 'admin-requests-search'),
        };

        // ── Live auto-refresh ──────────────────────────────────────────────────
        var liveDot    = document.getElementById('admin-live-dot');
        var liveStatus = document.getElementById('admin-live-status');
        var lastUpdated = document.getElementById('admin-last-updated');
        var refreshBtn  = document.getElementById('admin-refresh-now');
        var statKeys = ['active_tunnels', 'total_tunnels', 'active_tokens', 'total_tokens', 'total_requests', 'distinct_clients'];
        var rowTables = [
          ['admin-tunnels-rows', tables.tunnels],
          ['admin-history-rows', tables.history],
          ['admin-tokens-rows', tables.tokens],
          ['admin-requests-rows', tables.requests],
        ];
        var chartIds = ['chart-timeseries', 'chart-status', 'chart-method'];
        var timer;

        async function refresh() {
          try {
            var res = await fetch(location.pathname, { headers: { 'X-Requested-With': 'fetch' } });
            if (!res.ok || res.redirected) throw new Error('session expired');
            // doc is a separate Document (from DOMParser) — only read strings
            // (innerHTML/textContent) from it; its nodes can't be moved into
            // the live document without explicit adoption.
            var doc = new DOMParser().parseFromString(await res.text(), 'text/html');

            statKeys.forEach(function (key) {
              var freshEl = doc.getElementById('stat-' + key);
              var liveEl = document.getElementById('stat-' + key);
              if (freshEl && liveEl) liveEl.textContent = freshEl.textContent;
            });

            rowTables.forEach(function (pair) {
              var fresh = doc.getElementById(pair[0]);
              if (!fresh) return;
              document.getElementById(pair[0]).innerHTML = fresh.innerHTML;
              pair[1].reapplySearch();
            });

            chartIds.forEach(function (id) {
              var fresh = doc.getElementById(id);
              if (fresh) document.getElementById(id).innerHTML = fresh.innerHTML;
            });

            liveStatus.textContent = 'Live';
            liveDot.classList.remove('err');
            lastUpdated.textContent = 'updated ' + new Date().toLocaleTimeString();
          } catch (err) {
            liveStatus.textContent = 'Reconnecting…';
            liveDot.classList.add('err');
          }
        }

        function schedule() {
          clearInterval(timer);
          timer = setInterval(function () {
            if (document.visibilityState === 'visible') refresh();
          }, 8000);
        }

        refreshBtn.addEventListener('click', refresh);
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') refresh();
        });
        schedule();
      })();
    </script>
  `, adminNav(true), 'wide');
}

module.exports = {
  renderLanding, renderPrivacy, renderTerms, renderDashboard, renderLogs,
  renderAdminLogin, renderAdminDashboard,
};
