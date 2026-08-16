'use strict';

const path = require('path');
const express = require('express');
const cookie = require('cookie');

const cfg = require('./config');
const sso = require('./sso');
const admin = require('./admin');
const db = require('./db');
const views = require('./views');

const app = express();
app.use(express.urlencoded({ extended: false }));

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
  const pastTunnels = db.listInactiveTunnels(clientId, cfg.TUNNEL_HISTORY_SIZE);
  const tokens = db.listTokensForClient(clientId);
  const totalRequests = db.requestCountForClient(clientId);
  res.send(views.renderDashboard({ user: { email }, tunnels, pastTunnels, tokens, totalRequests }));
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

app.post('/dashboard/token/:token/revoke', requireSession, (req, res) => {
  db.revokeToken(req.params.token, req.session.clientId);
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

// ── Admin panel (superuser view across every client — separate session from
// the client dashboard) ─────────────────────────────────────────────────────
function readAdminSession(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  return admin.verifySessionCookie(cookies.exp127_admin);
}

function requireAdminSession(req, res, next) {
  if (!readAdminSession(req)) {
    return res.redirect('/admin/login');
  }
  next();
}

function clientIp(req) {
  return req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
}

app.get('/admin/login', (req, res) => {
  if (readAdminSession(req)) return res.redirect('/admin');
  res.send(views.renderAdminLogin({}));
});

app.post('/admin/login', (req, res) => {
  const ip = clientIp(req);
  if (admin.isLockedOut(ip)) {
    return res.status(429).send(views.renderAdminLogin({ error: 'Too many failed attempts. Try again in 15 minutes.' }));
  }

  const { email, password } = req.body || {};
  if (!admin.verifyCredentials(email, password)) {
    admin.recordFailure(ip);
    return res.status(401).send(views.renderAdminLogin({ error: 'Invalid email or password.' }));
  }
  admin.recordSuccess(ip);

  res.setHeader('Set-Cookie', cookie.serialize('exp127_admin', admin.createSessionCookie(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: cfg.ADMIN_SESSION_TTL_MS / 1000,
    path: '/',
  }));
  res.redirect('/admin');
});

app.get('/admin/logout', (req, res) => {
  admin.invalidateAllSessions();
  res.setHeader('Set-Cookie', cookie.serialize('exp127_admin', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  }));
  res.redirect('/admin/login');
});

app.get('/admin', requireAdminSession, (req, res) => {
  res.send(views.renderAdminDashboard({
    stats: db.adminStats(),
    activeTunnels: db.allActiveTunnels(cfg.ADMIN_PAGE_SIZE),
    pastTunnels: db.allInactiveTunnels(cfg.ADMIN_PAGE_SIZE),
    tokens: db.allTokens(cfg.ADMIN_PAGE_SIZE),
    requests: db.allRequests(cfg.ADMIN_PAGE_SIZE),
    tunnelDomain: cfg.TUNNEL_DOMAIN,
    pageSize: cfg.ADMIN_PAGE_SIZE,
  }));
});

// Admin can view any client's tunnel logs — bypasses the per-client ownership
// check that /dashboard/tunnels/:subdomain/logs enforces.
app.get('/admin/tunnels/:subdomain/logs', requireAdminSession, (req, res) => {
  const { subdomain } = req.params;
  const ownerClientId = db.tunnelOwnerClientId(subdomain);
  if (ownerClientId === undefined) {
    return res.status(404).send('Tunnel not found.');
  }

  const rows = db.recentRequests(ownerClientId, subdomain, cfg.LOG_PAGE_SIZE);
  res.send(views.renderLogs({
    subdomain,
    rows,
    tunnelDomain: cfg.TUNNEL_DOMAIN,
    backHref: '/admin',
    backLabel: 'back to admin panel',
  }));
});

app.listen(cfg.PORT, () => {
  console.log(`[expose127-dashboard] listening on http://0.0.0.0:${cfg.PORT}`);
});
