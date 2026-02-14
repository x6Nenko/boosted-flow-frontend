import { useEffect, useState } from 'react';

function formatDurationBetween(startMs: number, endMs: number): string {
  const diffSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));

  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatStoppedDuration(startedAt: string, stoppedAt: string): string {
  const startMs = new Date(startedAt).getTime();
  const stopMs = new Date(stoppedAt).getTime();
  return formatDurationBetween(startMs, stopMs);
}

interface TimerDurationProps {
  startedAt?: string;
}

export function TimerDuration({ startedAt }: TimerDurationProps) {
  // When not started, show placeholder
  if (!startedAt) {
    return <span className="text-muted-foreground/30">00:00:00</span>;
  }

  const startMs = new Date(startedAt).getTime();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [startMs]);

  return <>{formatDurationBetween(startMs, nowMs)}</>;
}
