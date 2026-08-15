'use strict';

// Minimal server-rendered HTML — no templating engine, matching the plain-HTML
// style already used in hostmargin-full/server/src/pages.js.

const SHELL_STYLE = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;
       min-height:100vh;padding:2rem}
  .wrap{max-width:900px;margin:0 auto}
  h1{font-size:1.5rem;margin-bottom:.25rem}
  .sub{color:#94a3b8;margin-bottom:2rem;font-size:.9rem}
  .card{background:#1e293b;border-radius:.5rem;padding:1.25rem;margin-bottom:1.5rem}
  .card h2{font-size:1.05rem;margin-bottom:1rem;color:#f1f5f9}
  table{width:100%;border-collapse:collapse;font-size:.85rem}
  th,td{text-align:left;padding:.5rem .6rem;border-bottom:1px solid #334155}
  th{color:#94a3b8;font-weight:600;font-size:.75rem;text-transform:uppercase}
  a{color:#38bdf8;text-decoration:none}
  a:hover{text-decoration:underline}
  code{background:#0f172a;padding:.15rem .4rem;border-radius:.3rem;font-family:monospace;font-size:.9em}
  .empty{color:#64748b;font-size:.9rem}
  .badge{display:inline-block;padding:.1rem .5rem;border-radius:1rem;font-size:.75rem;font-weight:600}
  .b-2xx{background:#064e3b;color:#6ee7b7}
  .b-4xx{background:#78350f;color:#fcd34d}
  .b-5xx{background:#7f1d1d;color:#fca5a5}
  .b-other{background:#334155;color:#cbd5e1}
  button,.btn{background:#38bdf8;color:#0f172a;border:none;padding:.5rem 1rem;border-radius:.4rem;
       font-weight:600;cursor:pointer;font-size:.85rem}
  button:hover,.btn:hover{background:#0ea5e9}
`;

function shell(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — expose127</title>
  <style>${SHELL_STYLE}</style>
</head>
<body><div class="wrap">${body}</div></body>
</html>`;
}

function statusBadge(code) {
  const cls = code >= 500 ? 'b-5xx' : code >= 400 ? 'b-4xx' : code >= 200 && code < 300 ? 'b-2xx' : 'b-other';
  return `<span class="badge ${cls}">${code}</span>`;
}

function renderDashboard({ user, tunnels, tokens }) {
  const tunnelRows = tunnels.length
    ? tunnels.map(t => `
      <tr>
        <td><code>${t.subdomain}</code></td>
        <td>${new Date(t.connected_at).toLocaleString()}</td>
        <td><a href="/dashboard/tunnels/${encodeURIComponent(t.subdomain)}/logs">view requests →</a></td>
      </tr>`).join('')
    : `<tr><td colspan="3" class="empty">No active tunnels right now. Start one with <code>npx expose127 8000 --token &lt;your-token&gt;</code></td></tr>`;

  const tokenRows = tokens.length
    ? tokens.map(t => `
      <tr>
        <td><code>${t.token}</code></td>
        <td>${new Date(t.created_at).toLocaleString()}</td>
      </tr>`).join('')
    : `<tr><td colspan="2" class="empty">No tokens yet — generate one below to link the CLI to your account.</td></tr>`;

  return shell('Dashboard', `
    <h1>Hi ${user.email || 'there'}</h1>
    <p class="sub">Your expose127 tunnels and request logs</p>

    <div class="card">
      <h2>Active tunnels</h2>
      <table><thead><tr><th>Subdomain</th><th>Connected</th><th></th></tr></thead>
      <tbody>${tunnelRows}</tbody></table>
    </div>

    <div class="card">
      <h2>API tokens</h2>
      <table><thead><tr><th>Token</th><th>Created</th></tr></thead>
      <tbody>${tokenRows}</tbody></table>
      <form method="post" action="/dashboard/token" style="margin-top:1rem">
        <button type="submit">Generate new token</button>
      </form>
    </div>
  `);
}

function renderLogs({ subdomain, rows }) {
  const body = rows.length
    ? rows.map(r => `
      <tr>
        <td>${new Date(r.ts).toLocaleTimeString()}</td>
        <td>${r.method}</td>
        <td>${r.path}</td>
        <td>${statusBadge(r.status_code)}</td>
        <td>${r.duration_ms}ms</td>
      </tr>`).join('')
    : `<tr><td colspan="5" class="empty">No requests logged yet for this tunnel.</td></tr>`;

  return shell(`${subdomain} — logs`, `
    <p class="sub"><a href="/dashboard">← back to dashboard</a></p>
    <h1><code>${subdomain}</code></h1>
    <p class="sub">Last ${rows.length} requests · <span id="live-status">live</span></p>
    <div class="card">
      <table><thead><tr><th>Time</th><th>Method</th><th>Path</th><th>Status</th><th>Duration</th></tr></thead>
      <tbody id="log-rows">${body}</tbody></table>
    </div>
    <script>
      (function () {
        var statusEl = document.getElementById('live-status');
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
          } catch (err) {
            statusEl.textContent = 'reconnecting…';
            clearInterval(timer);
            setTimeout(function () { location.reload(); }, 2000);
          }
        }
      })();
    </script>
  `);
}

module.exports = { renderDashboard, renderLogs };
