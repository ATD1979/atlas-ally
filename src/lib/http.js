// Atlas Ally — HTTP helper
// v2026.04.22 — B6 (AbortController timeouts on outbound fetches)
//
// Thin wrapper around fetch() that enforces a hard timeout via AbortController.
//
// Why this exists:
//   The codebase historically used node-fetch v2's non-standard `timeout` option
//   (e.g. `fetch(url, { timeout: 10000 })`). That option is silently ignored by
//   node-fetch v3+ and by native fetch — if we ever migrate, every outbound call
//   would lose its timeout without warning. AbortController-based cancellation is
//   the one pattern that works consistently across all three.
//
//   It also closes a real gap: the Anthropic calls in routes/pack.js had no
//   timeout at all, so an unresponsive upstream could hang the HTTP handler
//   indefinitely.
//
// Usage:
//   const { fetchWithTimeout } = require('./lib/http');   // adjust path
//   const res = await fetchWithTimeout(url);                   // default 30s
//   const res = await fetchWithTimeout(url, { headers });      // with options
//   const res = await fetchWithTimeout(url, { headers }, 6000);// custom timeout
//
// On timeout: throws an Error with message `fetch timeout after Xms: <url>` and
// code `ETIMEDOUT`, so existing `catch(e) { console.warn(e.message) }` patterns
// produce readable logs (instead of the bare `AbortError` that node-fetch/native
// fetch emit by default). The original AbortError is preserved on `err.cause`.
//
// Note: if `opts.signal` is provided, it's overridden. No current caller does
// this; if one needs to, compose signals at the call site.

const fetch = require('node-fetch');

async function fetchWithTimeout(url, opts = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } catch (e) {
    // node-fetch v2 throws an error with name 'AbortError'; native fetch throws
    // a DOMException with the same name. Cover both.
    if (e && (e.name === 'AbortError' || e.type === 'aborted')) {
      const err = new Error(`fetch timeout after ${timeoutMs}ms: ${url}`);
      err.code = 'ETIMEDOUT';
      err.cause = e;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchWithTimeout };
