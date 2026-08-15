'use strict';

// Server-rendered HTML — no templating engine. Shares the landing page's
// (../index.html) design tokens — fonts, palette, glass nav — so the
// dashboard reads as the same product, not a bolted-on admin panel.

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
     text-transform:uppercase;margin-bottom:.4rem}
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

  table{width:100%;border-collapse:collapse;font-size:.88rem}
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
    <a href="/" class="logo"><img src="/logo-expose127.png" alt="expose127">expose127</a>
    <div class="nav-links">
      <a href="/">← Site</a>
      <a href="/logout" class="nav-cta">Sign out</a>
    </div>
  </nav>
  <div class="wrap">${body}</div>
</body>
</html>`;
}

function statusBadge(code) {
  const cls = code >= 500 ? 'b-5xx' : code >= 400 ? 'b-4xx' : code >= 200 && code < 300 ? 'b-2xx' : 'b-other';
  return `<span class="badge ${cls}">${code}</span>`;
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
      <table><thead><tr><th>Subdomain</th><th>Connected</th><th></th></tr></thead>
      <tbody>${tunnelRows}</tbody></table>
    </div>

    <div class="card">
      <h2>API tokens</h2>
      <table><thead><tr><th>Token</th><th>Created</th></tr></thead>
      <tbody>${tokenRows}</tbody></table>
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

function renderLogs({ subdomain, rows }) {
  const body = rows.length
    ? rows.map(r => `
      <tr>
        <td>${new Date(r.ts).toLocaleTimeString()}</td>
        <td>${methodLabel(r.method)}</td>
        <td><code>${r.path}</code></td>
        <td>${statusBadge(r.status_code)}</td>
        <td>${r.duration_ms}ms</td>
      </tr>`).join('')
    : `<tr><td colspan="5" class="empty">No requests logged yet for this tunnel.</td></tr>`;

  return shell(`${subdomain} — logs`, `
    <p class="sub"><a href="/dashboard">← back to dashboard</a></p>
    <h1><code>${subdomain}</code></h1>
    <p class="sub">Last ${rows.length} requests · <span class="live"><span class="dot" id="live-dot"></span><span id="live-status">live</span></span></p>
    <div class="card">
      <table><thead><tr><th>Time</th><th>Method</th><th>Path</th><th>Status</th><th>Duration</th></tr></thead>
      <tbody id="log-rows">${body}</tbody></table>
    </div>
    <script>
      (function () {
        var statusEl = document.getElementById('live-status');
        var dotEl = document.getElementById('live-dot');
        var tbody = document.getElementById('log-rows');
        var timer = setInterval(refresh, 4000);

        async function refresh() {
          try {
            var res = await fetch(location.pathname, { headers: { 'X-Requested-With': 'fetch' } });
            if (!res.ok || res.redirected) throw new Error('session expired');
            var doc = new DOMParser().parseFromString(await res.text(), 'text/html');
            var freshRows = doc.getElementById('log-rows');
            if (!freshRows) throw new Error('unexpected response');
            tbody.innerHTML = freshRows.innerHTML;
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

module.exports = { renderDashboard, renderLogs };
