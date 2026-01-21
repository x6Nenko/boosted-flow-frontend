import { buildHeatmapData, calculateCurrentStreak, toLocalDateKey } from './activity-heatmap.utils';
import { describe, it, expect } from 'vitest'
import type { TimeEntry } from '../types';

describe('activity-heatmap.utils', () => {
  describe('toLocalDateKey', () => {
    it('returns YYYY-MM-DD with zero padding', () => {
      const d = new Date('2026-01-05T12:00:00Z');
      expect(toLocalDateKey(d)).toBe('2026-01-05');
    });
  });

  describe('buildHeatmapData', () => {
    it('buckets minutes by parsed startedAt local day (handles offset timestamps)', () => {
      const entry: TimeEntry = {
        id: 'e1',
        userId: 'u1',
        activityId: 'a1',
        description: null,
        startedAt: '2026-01-19T23:30:00-05:00',
        stoppedAt: '2026-01-20T00:30:00-05:00',
        rating: null,
        comment: null,
        createdAt: '2026-01-20T00:30:00-05:00',
      };

      const endDate = new Date('2026-01-21T12:00:00Z');
      const { weeks } = buildHeatmapData([entry], 1, endDate);

      const days = weeks.flat();
      const jan20 = days.find((d) => toLocalDateKey(d.date) === '2026-01-20');
      const jan19 = days.find((d) => toLocalDateKey(d.date) === '2026-01-19');

      expect(jan20?.minutes).toBe(60);
      expect(jan19?.minutes).toBe(0);
    });
  });

  describe('calculateCurrentStreak', () => {
    it('counts consecutive days when each day has > 1 minute tracked', () => {
      const entries: TimeEntry[] = [
        {
          id: 'e3',
          userId: 'u1',
          activityId: 'a1',
          description: null,
          startedAt: '2026-01-19T10:00:00Z',
          stoppedAt: '2026-01-19T10:03:00Z',
          rating: null,
          comment: null,
          createdAt: '2026-01-19T10:03:00Z',
        },
        {
          id: 'e2',
          userId: 'u1',
          activityId: 'a1',
          description: null,
          startedAt: '2026-01-20T10:00:00Z',
          stoppedAt: '2026-01-20T10:02:00Z',
          rating: null,
          comment: null,
          createdAt: '2026-01-20T10:02:00Z',
        },
        {
          id: 'e1',
          userId: 'u1',
          activityId: 'a1',
          description: null,
          startedAt: '2026-01-21T10:00:00Z',
          stoppedAt: '2026-01-21T10:02:00Z',
          rating: null,
          comment: null,
          createdAt: '2026-01-21T10:02:00Z',
        },
      ];

      const now = new Date('2026-01-21T12:00:00Z');
      expect(calculateCurrentStreak(entries, now)).toBe(3);
    });

    it('does not count a day when tracked time is <= 60 seconds', () => {
      const entries: TimeEntry[] = [
        {
          id: 'e2',
          userId: 'u1',
          activityId: 'a1',
          description: null,
          startedAt: '2026-01-20T10:00:00Z',
          stoppedAt: '2026-01-20T10:03:00Z',
          rating: null,
          comment: null,
          createdAt: '2026-01-20T10:03:00Z',
        },
        {
          id: 'e1',
          userId: 'u1',
          activityId: 'a1',
          description: null,
          startedAt: '2026-01-21T10:00:00Z',
          stoppedAt: '2026-01-21T10:01:00Z', // exactly 60s
          rating: null,
          comment: null,
          createdAt: '2026-01-21T10:01:00Z',
        },
      ];

      const now = new Date('2026-01-21T12:00:00Z');
      expect(calculateCurrentStreak(entries, now)).toBe(0);
    });

    it('counts an active entry for today if it already exceeds 1 minute', () => {
      const entries: TimeEntry[] = [
        {
          id: 'e1',
          userId: 'u1',
          activityId: 'a1',
          description: null,
          startedAt: '2026-01-21T11:58:00Z',
          stoppedAt: null,
          rating: null,
          comment: null,
          createdAt: '2026-01-21T11:58:00Z',
        },
      ];

      const now = new Date('2026-01-21T12:00:30Z');
      expect(calculateCurrentStreak(entries, now)).toBe(1);
    });
  });
});
