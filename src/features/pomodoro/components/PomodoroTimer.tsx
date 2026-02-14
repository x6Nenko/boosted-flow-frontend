import { useEffect, useState } from 'react';

type PomodoroTimerProps = {
  startedAt?: string;
  durationMinutes: number;
  onComplete: () => void;
};

export function PomodoroTimer({ startedAt, durationMinutes, onComplete }: PomodoroTimerProps) {
  // When not started, show the full duration as placeholder
  if (!startedAt) {
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return (
      <span className="text-muted-foreground/30">
        {hours > 0 && `${hours.toString().padStart(2, '0')}:`}
        {minutes.toString().padStart(2, '0')}:00
      </span>
    );
  }

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
