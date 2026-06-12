import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import useNetworkStatus from '../hooks/useNetworkStatus';

/**
 * Shows a red banner when the *user's* internet is offline or slow.
 * Renders nothing when the connection is fine.
 *
 * Distinct from the "Waking up the server…" banner, which is about the
 * backend cold-start, not the user's network.
 */
const NetworkStatusBanner = ({ language = 'fr' }) => {
  const { status, rtt } = useNetworkStatus();

  if (status === 'online') return null;

  const isOffline = status === 'offline';

  const text = language === 'fr'
    ? (isOffline
        ? 'Aucune connexion internet détectée.'
        : 'Connexion internet faible — le chargement peut être lent.')
    : (isOffline
        ? 'No internet connection detected.'
        : 'Weak internet connection — loading may be slow.');

  const Icon = isOffline ? WifiOff : Wifi;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <Icon size={18} className={`shrink-0 text-rose-600 dark:text-rose-400 ${isOffline ? 'animate-pulse' : ''}`} />
      <span className="text-sm font-semibold flex-1">{text}</span>
      {rtt != null && !isOffline && (
        <span className="text-[10px] font-mono text-rose-500/80 shrink-0">{rtt} ms</span>
      )}
    </div>
  );
};

export default NetworkStatusBanner;
