import { buildHeatmapData, toLocalDateKey } from './activity-heatmap.utils';
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
});
