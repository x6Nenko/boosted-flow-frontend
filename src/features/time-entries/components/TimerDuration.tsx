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

export function TimerDuration({ startedAt }: { startedAt: string }) {
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
