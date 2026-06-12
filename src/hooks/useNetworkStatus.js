import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Detects the *user's* internet quality (not the backend cold-start).
 *
 * It pings a tiny static asset served by the frontend CDN (always warm,
 * globally edge-cached) and measures the round-trip time. That isolates the
 * user's connection from the Render backend, which can be slow only because
 * it is waking up.
 *
 * Returns one of:
 *   - 'online'  : connection is fine
 *   - 'slow'    : reachable but high latency / 2g-class link
 *   - 'offline' : no connection at all
 *
 * Sources combined (for cross-browser coverage):
 *   - navigator.onLine + 'online'/'offline' events   (all browsers)
 *   - Network Information API (effectiveType/rtt)     (Chromium, Android)
 *   - active latency probe against /vite.svg          (all browsers)
 */

// A tiny asset served by the frontend host (Vercel CDN). Cache-busted so we
// measure the network, not the disk cache.
const PROBE_URL = '/vite.svg';
const PROBE_INTERVAL_MS = 12000;  // re-check every 12s
const PROBE_TIMEOUT_MS = 6000;    // give up after 6s → treat as offline
const SLOW_RTT_MS = 1200;         // above this round-trip → 'slow'

export const useNetworkStatus = () => {
  const [status, setStatus] = useState('online');
  const [rtt, setRtt] = useState(null);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);

  const probe = useCallback(async () => {
    // Hard offline — no point pinging.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (!cancelledRef.current) { setStatus('offline'); setRtt(null); }
      return;
    }

    // Network Information API hint (Chromium / Android). If the OS already
    // reports a 2g-class link, surface 'slow' without waiting for the probe.
    const conn = typeof navigator !== 'undefined'
      ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection)
      : null;
    const effectiveType = conn?.effectiveType;
    const apiSaysSlow = effectiveType === 'slow-2g' || effectiveType === '2g';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const start = performance.now();
    try {
      await fetch(`${PROBE_URL}?_=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      const elapsed = Math.round(performance.now() - start);
      clearTimeout(timeout);
      if (cancelledRef.current) return;

      setRtt(elapsed);
      if (apiSaysSlow || elapsed > SLOW_RTT_MS) setStatus('slow');
      else setStatus('online');
    } catch {
      clearTimeout(timeout);
      if (cancelledRef.current) return;
      // Fetch failed/aborted while the browser still thinks it's online →
      // the link is effectively down or extremely degraded.
      setStatus(navigator.onLine === false ? 'offline' : 'slow');
      setRtt(null);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;

    const runProbe = () => { probe(); };

    // Initial check + periodic re-check.
    runProbe();
    timerRef.current = setInterval(runProbe, PROBE_INTERVAL_MS);

    const onOnline = () => { setStatus('online'); runProbe(); };
    const onOffline = () => { setStatus('offline'); setRtt(null); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Re-probe when the Network Information API reports a change.
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn?.addEventListener) conn.addEventListener('change', runProbe);

    return () => {
      cancelledRef.current = true;
      clearInterval(timerRef.current);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      if (conn?.removeEventListener) conn.removeEventListener('change', runProbe);
    };
  }, [probe]);

  return { status, rtt, isOnline: status === 'online' };
};

export default useNetworkStatus;
