'use strict';

const crypto = require('crypto');
const cfg = require('./config');

function base64urlEncode(str) {
  return Buffer.from(str, 'utf8').toString('base64url');
}

function base64urlDecode(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

function sign(payloadB64) {
  return crypto.createHmac('sha256', cfg.SSO_SECRET).update(payloadB64).digest('base64url');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// A single "payload.signature" format, shared shape for both the one-time
// SSO handoff token (minted by the hostmargin Portal) and this app's own
// session cookie (minted here) — same HMAC-SHA256 scheme, same secret.
function encode(payload) {
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

function decode(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;

  if (!cfg.SSO_SECRET) return null;
  if (!safeEqual(sign(payloadB64), signature)) return null;

  try {
    const payload = JSON.parse(base64urlDecode(payloadB64));
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verify the one-time token the hostmargin Portal redirects with after
 * `/sso/expose127`. Payload shape (minted PHP-side with the same
 * HMAC-SHA256 scheme): { cid, email, fn, ln, exp }.
 */
function verifySsoToken(token) {
  const payload = decode(token);
  if (!payload || !payload.cid) return null;
  return {
    clientId:  payload.cid,
    email:     payload.email || null,
    firstName: payload.fn || '',
    lastName:  payload.ln || '',
  };
}

function createSessionCookie({ clientId, email }) {
  return encode({ cid: clientId, email, exp: Date.now() + cfg.SESSION_TTL_MS });
}

function verifySessionCookie(cookieValue) {
  const payload = decode(cookieValue);
  if (!payload || !payload.cid) return null;
  return { clientId: payload.cid, email: payload.email || null };
}

module.exports = { verifySsoToken, createSessionCookie, verifySessionCookie };
