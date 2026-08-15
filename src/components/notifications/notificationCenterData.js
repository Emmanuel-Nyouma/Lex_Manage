import {
  Info,
  AlertTriangle,
  AlertOctagon,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { MOTIF_OPTIONS } from '../../lib/schemas/notification.schema';

const LEVEL_CONFIG = {
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Info },
  IMPORTANT: { label: 'Important', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertTriangle },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertOctagon },
};

const STATUS_CONFIG = {
  PENDING: { label: 'Scheduled', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  SENT: { label: 'Sent', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', icon: XCircle },
};

const motifLabel = (motif) => (
  MOTIF_OPTIONS.find((option) => option.value === motif)?.label ?? motif
);

const fmtDate = (date) => new Date(date).toLocaleDateString('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function countdown(scheduledAt) {
  const diff = new Date(scheduledAt) - Date.now();
  if (diff <= 0) return 'imminente';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `dans ${days}j ${hours}h`;
  if (hours > 0) return `dans ${hours}h ${minutes}m`;
  return `dans ${minutes} min`;
}

export { LEVEL_CONFIG, STATUS_CONFIG, motifLabel, fmtDate, countdown };
