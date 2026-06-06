import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  targetDate: string; // ISO string
  label?: string;
}

function formatDiff(ms: number): string {
  if (ms <= 0) return 'Ended';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function CountdownTimer({ targetDate, label }: Props) {
  const [remaining, setRemaining] = useState(() => new Date(targetDate).getTime() - Date.now());

  useEffect(() => {
    const tick = setInterval(() => {
      setRemaining(new Date(targetDate).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(tick);
  }, [targetDate]);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
      <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
      {label && <span>{label}:</span>}
      <span className="font-mono tabular-nums">{formatDiff(remaining)}</span>
    </span>
  );
}
