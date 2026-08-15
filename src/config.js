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

  // Session cookie lifetime (ms)
  SESSION_TTL_MS: 12 * 60 * 60 * 1000, // 12h

  // SSO handoff token lifetime (ms) — short, single use in practice
  SSO_TOKEN_TTL_MS: 60 * 1000, // 60s
};
