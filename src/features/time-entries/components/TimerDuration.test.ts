import { describe, it, expect } from 'vitest';

import { formatStoppedDuration } from './TimerDuration';

describe('formatStoppedDuration', () => {
  it('returns HH:MM:SS for a normal positive duration', () => {
    const startedAt = '2020-01-01T00:00:00.000Z';
    const stoppedAt = '2020-01-01T01:01:01.000Z';

    expect(formatStoppedDuration(startedAt, stoppedAt)).toBe('01:01:01');
  });

  it('clamps negative durations to 00:00:00', () => {
    const startedAt = '2020-01-01T00:00:10.000Z';
    const stoppedAt = '2020-01-01T00:00:09.000Z';

    expect(formatStoppedDuration(startedAt, stoppedAt)).toBe('00:00:00');
  });
});
