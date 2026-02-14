import { useEffect, useState } from 'react';

type BreakTimerProps = {
  startedAt: string;
  durationMinutes: number;
  onComplete: () => void;
};

export function BreakTimer({ startedAt, durationMinutes, onComplete }: BreakTimerProps) {
  const startMs = new Date(startedAt).getTime();
  const durationMs = durationMinutes * 60 * 1000;
  const endMs = startMs + durationMs;

  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      setNowMs(now);
      if (now >= endMs) {
        window.clearInterval(id);
        onComplete();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [endMs, onComplete]);

  const remainingMs = Math.max(0, endMs - nowMs);
  const remainingSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  return (
    <>
      {hours > 0 && `${hours.toString().padStart(2, '0')}:`}
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </>
  );
}
