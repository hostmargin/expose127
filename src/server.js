'use strict';

const path = require('path');
const express = require('express');
const cookie = require('cookie');

const cfg = require('./config');
const sso = require('./sso');
const db = require('./db');
const views = require('./views');

const app = express();

// ── Public site (landing + legal pages) — server-rendered so they share one
// nav/footer via views.js instead of three copy-pasted static files ─────────
app.get('/', (req, res) => {
  res.send(views.renderLanding());
});

app.get('/privacy', (req, res) => {
  res.send(views.renderPrivacy());
});

app.get('/terms', (req, res) => {
  res.send(views.renderTerms());
});

// Remaining static assets (favicon.ico, logo-expose127.png) live one level
// up from src/.
app.use(express.static(path.join(__dirname, '..'), { index: false }));

function readSession(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  return sso.verifySessionCookie(cookies.exp127_session);
}

function requireSession(req, res, next) {
  const session = readSession(req);
  if (!session) {
    return res.redirect(cfg.PORTAL_LOGIN_URL);
  }
  req.session = session;
  next();
}

// ── SSO handoff from the hostmargin Portal ────────────────────────────────────
app.get('/sso', (req, res) => {
  const identity = sso.verifySsoToken(req.query.token);
  if (!identity) {
    return res.redirect(cfg.PORTAL_LOGIN_URL);
  }

  const sessionCookie = sso.createSessionCookie({
    clientId: identity.clientId,
    email: identity.email,
  });

  res.setHeader('Set-Cookie', cookie.serialize('exp127_session', sessionCookie, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: cfg.SESSION_TTL_MS / 1000,
    path: '/',
  }));

  res.redirect('/dashboard');
});

// ── Dashboard (requires session) ──────────────────────────────────────────────
app.get('/dashboard', requireSession, (req, res) => {
  const { clientId, email } = req.session;
  const tunnels = db.listActiveTunnels(clientId);
  const tokens = db.listTokensForClient(clientId);
  const totalRequests = db.requestCountForClient(clientId);
  res.send(views.renderDashboard({ user: { email }, tunnels, tokens, totalRequests }));
});

app.get('/logout', (req, res) => {
  res.setHeader('Set-Cookie', cookie.serialize('exp127_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  }));
  res.redirect('/');
});

app.post('/dashboard/token', requireSession, (req, res) => {
  db.createTokenForClient(req.session.clientId, req.session.email);
  res.redirect('/dashboard');
});

app.get('/dashboard/tunnels/:subdomain/logs', requireSession, (req, res) => {
  const { subdomain } = req.params;
  const { clientId } = req.session;

  if (!db.tunnelBelongsTo(subdomain, clientId)) {
    return res.status(404).send('Tunnel not found.');
  }

  const rows = db.recentRequests(clientId, subdomain, cfg.LOG_PAGE_SIZE);
  res.send(views.renderLogs({ subdomain, rows, tunnelDomain: cfg.TUNNEL_DOMAIN }));
});

app.listen(cfg.PORT, () => {
  console.log(`[expose127-dashboard] listening on http://0.0.0.0:${cfg.PORT}`);
});
