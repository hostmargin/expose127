'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const cfg = require('./config');

fs.mkdirSync(path.dirname(cfg.DB_PATH), { recursive: true });

const db = new DatabaseSync(cfg.DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 3000;');

// Same schema the tunnel-server (hostmargin-full/server/src/db.js) creates —
// CREATE TABLE IF NOT EXISTS here too so the dashboard also works standalone
// on a fresh box before the tunnel-server has ever started.
db.exec(`
  CREATE TABLE IF NOT EXISTS tokens (
    token      TEXT PRIMARY KEY,
    client_id  INTEGER NOT NULL,
    email      TEXT,
    created_at INTEGER,
    revoked_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS tunnels (
    subdomain    TEXT PRIMARY KEY,
    client_id    INTEGER,
    connected_at INTEGER,
    closed_at    INTEGER
  );

  CREATE TABLE IF NOT EXISTS requests (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id   INTEGER,
    subdomain   TEXT,
    method      TEXT,
    path        TEXT,
    status_code INTEGER,
    duration_ms INTEGER,
    ts          INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_requests_client ON requests(client_id, ts DESC);
`);

// Migration for tokens tables created before revoked_at existed (CREATE TABLE
// IF NOT EXISTS above only applies to brand-new databases — this file and the
// tunnel-server share the same DB, and whichever process starts first creates
// the table). Both processes can hit this check concurrently on a fresh DB —
// check-then-ALTER isn't atomic across processes, so a "duplicate column"
// error here just means the other process won the race; anything else is a
// real problem and should still surface.
const tokenColumns = db.prepare("PRAGMA table_info(tokens)").all().map(c => c.name);
if (!tokenColumns.includes('revoked_at')) {
  try {
    db.exec('ALTER TABLE tokens ADD COLUMN revoked_at INTEGER');
  } catch (err) {
    if (!/duplicate column name/i.test(err.message)) throw err;
  }
}

const stmts = {
  insertToken:      db.prepare('INSERT INTO tokens (token, client_id, email, created_at) VALUES (?, ?, ?, ?)'),
  tokensForClient:  db.prepare('SELECT token, created_at FROM tokens WHERE client_id = ? AND revoked_at IS NULL ORDER BY created_at DESC'),
  revokeToken:      db.prepare('UPDATE tokens SET revoked_at = ? WHERE token = ? AND client_id = ? AND revoked_at IS NULL'),

  activeTunnels:    db.prepare('SELECT subdomain, connected_at FROM tunnels WHERE client_id = ? AND closed_at IS NULL ORDER BY connected_at DESC'),
  inactiveTunnels:  db.prepare('SELECT subdomain, connected_at, closed_at FROM tunnels WHERE client_id = ? AND closed_at IS NOT NULL ORDER BY closed_at DESC LIMIT ?'),
  tunnelOwner:      db.prepare('SELECT client_id FROM tunnels WHERE subdomain = ?'),

  // "IS", not "=" — clientId can be NULL for an anonymous tunnel, and
  // "column = NULL" never matches in SQL even when the column itself is
  // NULL. IS behaves exactly like = for non-NULL operands, so this is safe
  // for the normal (real clientId) case too.
  recentRequests:   db.prepare(`
    SELECT method, path, status_code, duration_ms, ts
    FROM requests
    WHERE client_id IS ? AND subdomain = ?
    ORDER BY ts DESC
    LIMIT ?
  `),

  requestCount:     db.prepare('SELECT COUNT(*) AS c FROM requests WHERE client_id = ?'),

  // ── Admin-wide (all clients, no client_id filter) ─────────────────────────
  adminStats: db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM tunnels WHERE closed_at IS NULL)     AS active_tunnels,
      (SELECT COUNT(*) FROM tunnels)                             AS total_tunnels,
      (SELECT COUNT(*) FROM tokens WHERE revoked_at IS NULL)     AS active_tokens,
      (SELECT COUNT(*) FROM tokens)                              AS total_tokens,
      (SELECT COUNT(*) FROM requests)                            AS total_requests,
      (SELECT COUNT(DISTINCT client_id) FROM tunnels)            AS distinct_clients
  `),
  allActiveTunnels:   db.prepare('SELECT subdomain, client_id, connected_at FROM tunnels WHERE closed_at IS NULL ORDER BY connected_at DESC LIMIT ?'),
  allInactiveTunnels: db.prepare('SELECT subdomain, client_id, connected_at, closed_at FROM tunnels WHERE closed_at IS NOT NULL ORDER BY closed_at DESC LIMIT ?'),
  allTokens:          db.prepare('SELECT token, client_id, email, created_at, revoked_at FROM tokens ORDER BY created_at DESC LIMIT ?'),
  allRequests:        db.prepare('SELECT client_id, subdomain, method, path, status_code, duration_ms, ts FROM requests ORDER BY ts DESC LIMIT ?'),
};

function generateToken() {
  return `exp_${crypto.randomBytes(20).toString('hex')}`;
}

function createTokenForClient(clientId, email) {
  const token = generateToken();
  stmts.insertToken.run(token, clientId, email, Date.now());
  return token;
}

function listTokensForClient(clientId) {
  return stmts.tokensForClient.all(clientId);
}

// Soft delete — the row stays (for audit/history), just hidden from the
// active list. clientId in the WHERE clause ensures you can only revoke
// your own tokens.
function revokeToken(token, clientId) {
  const result = stmts.revokeToken.run(Date.now(), token, clientId);
  return result.changes > 0;
}

function listActiveTunnels(clientId) {
  return stmts.activeTunnels.all(clientId);
}

function listInactiveTunnels(clientId, limit) {
  return stmts.inactiveTunnels.all(clientId, limit);
}

function tunnelBelongsTo(subdomain, clientId) {
  const row = stmts.tunnelOwner.get(subdomain);
  return !!row && row.client_id === clientId;
}

// Returns undefined if no such tunnel exists at all, or the owning
// client_id if it does — which may itself be null for an anonymous tunnel.
// Callers must check `=== undefined` for "not found", not falsiness, since
// null is a legitimate (anonymous) result here.
function tunnelOwnerClientId(subdomain) {
  const row = stmts.tunnelOwner.get(subdomain);
  return row === undefined ? undefined : row.client_id;
}

function recentRequests(clientId, subdomain, limit) {
  return stmts.recentRequests.all(clientId, subdomain, limit);
}

function requestCountForClient(clientId) {
  return stmts.requestCount.get(clientId).c;
}

// ── Admin-wide (all clients) ─────────────────────────────────────────────────

function adminStats() {
  return stmts.adminStats.get();
}

function allActiveTunnels(limit) {
  return stmts.allActiveTunnels.all(limit);
}

function allInactiveTunnels(limit) {
  return stmts.allInactiveTunnels.all(limit);
}

function allTokens(limit) {
  return stmts.allTokens.all(limit);
}

function allRequests(limit) {
  return stmts.allRequests.all(limit);
}

module.exports = {
  createTokenForClient,
  listTokensForClient,
  revokeToken,
  listActiveTunnels,
  listInactiveTunnels,
  tunnelBelongsTo,
  tunnelOwnerClientId,
  recentRequests,
  requestCountForClient,
  adminStats,
  allActiveTunnels,
  allInactiveTunnels,
  allTokens,
  allRequests,
};
