'use strict';
require('dotenv').config();
const path = require('path');

module.exports = {
  PORT: parseInt(process.env.PORT || '6000'),

  // Shared secret with the hostmargin Portal — signs both the SSO handoff
  // token and this app's own session cookie.
  SSO_SECRET: process.env.SSO_SECRET || '',

  PORTAL_LOGIN_URL: process.env.PORTAL_LOGIN_URL || 'https://hostmargin.com/en-in/sso',

  // Same SQLite file the tunnel-server (hostmargin-full/server) writes to.
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'expose127.db'),

  // How many recent requests to show per tunnel in the dashboard
  LOG_PAGE_SIZE: 100,

  // How many past (disconnected) tunnels to show in the dashboard's history
  TUNNEL_HISTORY_SIZE: 20,

  // Base domain tunnels are published under — a request logged for
  // subdomain "myapp" was publicly reachable at https://myapp.<TUNNEL_DOMAIN>
  TUNNEL_DOMAIN: process.env.TUNNEL_DOMAIN || 'hmrg.xyz',

  // Session cookie lifetime (ms)
  SESSION_TTL_MS: 12 * 60 * 60 * 1000, // 12h

  // SSO handoff token lifetime (ms) — short, single use in practice
  SSO_TOKEN_TTL_MS: 60 * 1000, // 60s

  // ── Admin panel (/admin) — single hardcoded operator account ────────────────
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || '',
  ADMIN_SECRET: process.env.ADMIN_SECRET || '',
  ADMIN_SESSION_TTL_MS: 4 * 60 * 60 * 1000, // 4h — shorter than client sessions on purpose

  // How many rows to show per list in the admin panel (across ALL clients)
  ADMIN_PAGE_SIZE: 200,
};
