'use strict';

const crypto = require('crypto');
const cfg = require('./config');

// ── Password verification ───────────────────────────────────────────────────
// ADMIN_PASSWORD_HASH is "scrypt$N$r$p$saltHex$hashHex" — self-describing so
// cost parameters can change later without breaking an existing hash.

function verifyPassword(password, encoded) {
  if (!password || !encoded) return false;

  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nStr, rStr, pStr, salt, hashHex] = parts;
  const N = parseInt(nStr, 10);
  const r = parseInt(rStr, 10);
  const p = parseInt(pStr, 10);
  if (!N || !r || !p || !salt || !hashHex) return false;

  const expected = Buffer.from(hashHex, 'hex');
  let actual;
  try {
    actual = crypto.scryptSync(password, salt, expected.length, { N, r, p, maxmem: 64 * 1024 * 1024 });
  } catch {
    return false;
  }
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest();
}

function verifyCredentials(email, password) {
  if (!cfg.ADMIN_EMAIL || !cfg.ADMIN_PASSWORD_HASH) return false;
  if (typeof email !== 'string') return false;

  // Hash both sides to fixed-length digests first — timingSafeEqual requires
  // equal-length buffers, and raw emails could differ in length.
  const emailMatches = crypto.timingSafeEqual(
    sha256(email.trim().toLowerCase()),
    sha256(cfg.ADMIN_EMAIL.trim().toLowerCase())
  );
  if (!emailMatches) return false;

  return verifyPassword(password, cfg.ADMIN_PASSWORD_HASH);
}

// ── Session cookie ───────────────────────────────────────────────────────────
// Same HMAC-SHA256 "payload.signature" shape as sso.js, but signed with its
// own ADMIN_SECRET so a leaked client SSO secret can't be used to forge
// admin access (and vice versa).

function base64urlEncode(str) {
  return Buffer.from(str, 'utf8').toString('base64url');
}

function base64urlDecode(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

function sign(payloadB64) {
  return crypto.createHmac('sha256', cfg.ADMIN_SECRET).update(payloadB64).digest('base64url');
}

// Signed cookies are inherently stateless — clearing the cookie on logout
// doesn't stop a copy of that same token (if it leaked) from still being
// accepted until it naturally expires. revokedBefore closes that gap: any
// session issued before the last logout is rejected outright, even if its
// signature and expiry are otherwise valid. Resets on process restart —
// acceptable for a single operator account.
let revokedBefore = 0;

function createSessionCookie() {
  const payload = { admin: true, iat: Date.now(), exp: Date.now() + cfg.ADMIN_SESSION_TTL_MS };
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

function invalidateAllSessions() {
  revokedBefore = Date.now();
}

function verifySessionCookie(cookieValue) {
  if (!cookieValue || typeof cookieValue !== 'string') return false;
  if (!cfg.ADMIN_SECRET) return false;

  const parts = cookieValue.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;

  const expectedSig = sign(payloadB64);
  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expectedSig);
  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) return false;

  try {
    const payload = JSON.parse(base64urlDecode(payloadB64));
    if (payload.admin !== true) return false;
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return false;
    if (typeof payload.iat !== 'number' || payload.iat < revokedBefore) return false;
    return true;
  } catch {
    return false;
  }
}

// ── Basic brute-force throttling ────────────────────────────────────────────
// In-memory per-IP lockout. Resets on process restart — acceptable for a
// single hardcoded operator account behind a low-traffic admin route.

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const attempts = new Map(); // ip -> { count, lockedUntil }

function isLockedOut(ip) {
  const entry = attempts.get(ip);
  return !!entry && entry.lockedUntil > Date.now();
}

function recordFailure(ip) {
  const entry = attempts.get(ip) || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0;
  }
  attempts.set(ip, entry);
}

function recordSuccess(ip) {
  attempts.delete(ip);
}

module.exports = {
  verifyCredentials,
  createSessionCookie,
  verifySessionCookie,
  invalidateAllSessions,
  isLockedOut,
  recordFailure,
  recordSuccess,
};
