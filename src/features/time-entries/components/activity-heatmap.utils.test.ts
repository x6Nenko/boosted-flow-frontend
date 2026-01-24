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
        distractionCount: 0,
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
          distractionCount: 0,
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
          distractionCount: 0,
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
          distractionCount: 0,
          createdAt: '2026-01-21T10:02:00Z',
        },
      ];

      const now = new Date('2026-01-21T12:00:00Z');
      const result = calculateCurrentStreak(entries, now);
      expect(result.days).toBe(3);
      expect(result.isAtRisk).toBe(false);
    });

    it('shows at-risk streak when today has <= 60 seconds but yesterday has activity', () => {
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
          distractionCount: 0,
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
          distractionCount: 0,
          createdAt: '2026-01-21T10:01:00Z',
        },
      ];

      const now = new Date('2026-01-21T12:00:00Z');
      const result = calculateCurrentStreak(entries, now);
      expect(result.days).toBe(1);
      expect(result.isAtRisk).toBe(true);
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
          distractionCount: 0,
          createdAt: '2026-01-21T11:58:00Z',
        },
      ];

      const now = new Date('2026-01-21T12:00:30Z');
      const result = calculateCurrentStreak(entries, now);
      expect(result.days).toBe(1);
      expect(result.isAtRisk).toBe(false);
    });

    it('marks streak as at risk when today has no activity but yesterday does', () => {
      const entries: TimeEntry[] = [
        {
          id: 'e1',
          userId: 'u1',
          activityId: 'a1',
          description: null,
          startedAt: '2026-01-19T10:00:00Z',
          stoppedAt: '2026-01-19T10:03:00Z',
          rating: null,
          comment: null,
          distractionCount: 0,
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
          distractionCount: 0,
          createdAt: '2026-01-20T10:02:00Z',
        },
      ];

      const now = new Date('2026-01-21T12:00:00Z');
      const result = calculateCurrentStreak(entries, now);
      expect(result.days).toBe(2);
      expect(result.isAtRisk).toBe(true);
    });

    it('does not mark as at risk when streak is already broken', () => {
      const entries: TimeEntry[] = [
        {
          id: 'e1',
          userId: 'u1',
          activityId: 'a1',
          description: null,
          startedAt: '2026-01-19T10:00:00Z',
          stoppedAt: '2026-01-19T10:03:00Z',
          rating: null,
          comment: null,
          distractionCount: 0,
          createdAt: '2026-01-19T10:03:00Z',
        },
      ];

      const now = new Date('2026-01-21T12:00:00Z');
      const result = calculateCurrentStreak(entries, now);
      expect(result.days).toBe(0);
      expect(result.isAtRisk).toBe(false);
    });

    it('marks multi-day streak as at risk when today has no activity', () => {
      const entries: TimeEntry[] = [
        {
          id: 'e1',
          userId: 'u1',
          activityId: 'a1',
          description: null,
          startedAt: '2026-01-18T10:00:00Z',
          stoppedAt: '2026-01-18T10:03:00Z',
          rating: null,
          comment: null,
          distractionCount: 0,
          createdAt: '2026-01-18T10:03:00Z',
        },
        {
          id: 'e2',
          userId: 'u1',
          activityId: 'a1',
          description: null,
          startedAt: '2026-01-19T10:00:00Z',
          stoppedAt: '2026-01-19T10:02:00Z',
          rating: null,
          comment: null,
          distractionCount: 0,
          createdAt: '2026-01-19T10:02:00Z',
        },
        {
          id: 'e3',
          userId: 'u1',
          activityId: 'a1',
          description: null,
          startedAt: '2026-01-20T10:00:00Z',
          stoppedAt: '2026-01-20T10:02:00Z',
          rating: null,
          comment: null,
          distractionCount: 0,
          createdAt: '2026-01-20T10:02:00Z',
        },
      ];

      const now = new Date('2026-01-21T12:00:00Z');
      const result = calculateCurrentStreak(entries, now);
      expect(result.days).toBe(3);
      expect(result.isAtRisk).toBe(true);
    });
  });
});
