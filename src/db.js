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
    created_at INTEGER
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

const stmts = {
  insertToken:      db.prepare('INSERT INTO tokens (token, client_id, email, created_at) VALUES (?, ?, ?, ?)'),
  tokensForClient:  db.prepare('SELECT token, created_at FROM tokens WHERE client_id = ? ORDER BY created_at DESC'),

  activeTunnels:    db.prepare('SELECT subdomain, connected_at FROM tunnels WHERE client_id = ? AND closed_at IS NULL ORDER BY connected_at DESC'),
  tunnelOwner:      db.prepare('SELECT client_id FROM tunnels WHERE subdomain = ?'),

  recentRequests:   db.prepare(`
    SELECT method, path, status_code, duration_ms, ts
    FROM requests
    WHERE client_id = ? AND subdomain = ?
    ORDER BY ts DESC
    LIMIT ?
  `),

  requestCount:     db.prepare('SELECT COUNT(*) AS c FROM requests WHERE client_id = ?'),
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

function listActiveTunnels(clientId) {
  return stmts.activeTunnels.all(clientId);
}

function tunnelBelongsTo(subdomain, clientId) {
  const row = stmts.tunnelOwner.get(subdomain);
  return !!row && row.client_id === clientId;
}

function recentRequests(clientId, subdomain, limit) {
  return stmts.recentRequests.all(clientId, subdomain, limit);
}

function requestCountForClient(clientId) {
  return stmts.requestCount.get(clientId).c;
}

module.exports = {
  createTokenForClient,
  listTokensForClient,
  listActiveTunnels,
  tunnelBelongsTo,
  recentRequests,
  requestCountForClient,
};
