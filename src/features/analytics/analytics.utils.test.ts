import { describe, expect, it } from 'vitest';
import { computeAnalytics, formatDuration, getDefaultDateRange, buildAnalyticsCsv } from './analytics.utils';
import type { TimeEntry } from '@/features/time-entries/types';
import type { AnalyticsData } from './types';

const makeEntry = (overrides: Partial<TimeEntry> = {}): TimeEntry => ({
  id: 'entry-1',
  userId: 'user-1',
  activityId: 'activity-1',
  description: null,
  startedAt: '2024-01-15T09:00:00.000Z',
  stoppedAt: '2024-01-15T10:00:00.000Z', // 1 hour
  rating: null,
  comment: null,
  distractionCount: 0,
  createdAt: '2024-01-15T09:00:00.000Z',
  ...overrides,
});

describe('computeAnalytics', () => {
  describe('totalTimeMs', () => {
    it('returns 0 for empty entries', () => {
      const result = computeAnalytics([]);
      expect(result.totalTimeMs).toBe(0);
    });

    it('sums duration of completed entries', () => {
      const entries = [
        makeEntry({ id: '1', startedAt: '2024-01-15T09:00:00.000Z', stoppedAt: '2024-01-15T10:00:00.000Z' }), // 1h
        makeEntry({ id: '2', startedAt: '2024-01-15T11:00:00.000Z', stoppedAt: '2024-01-15T11:30:00.000Z' }), // 30m
      ];
      const result = computeAnalytics(entries);
      expect(result.totalTimeMs).toBe(90 * 60 * 1000); // 1h 30m
    });

    it('excludes active entries (no stoppedAt)', () => {
      const entries = [
        makeEntry({ id: '1', stoppedAt: '2024-01-15T10:00:00.000Z' }), // 1h completed
        makeEntry({ id: '2', stoppedAt: null }), // active
      ];
      const result = computeAnalytics(entries);
      expect(result.totalTimeMs).toBe(60 * 60 * 1000); // only 1h
    });
  });

  describe('sessionCount', () => {
    it('counts only completed entries', () => {
      const entries = [
        makeEntry({ id: '1', stoppedAt: '2024-01-15T10:00:00.000Z' }),
        makeEntry({ id: '2', stoppedAt: '2024-01-15T11:00:00.000Z' }),
        makeEntry({ id: '3', stoppedAt: null }), // active - excluded
      ];
      const result = computeAnalytics(entries);
      expect(result.sessionCount).toBe(2);
    });
  });

  describe('averageSessionMs', () => {
    it('returns 0 for no sessions', () => {
      const result = computeAnalytics([]);
      expect(result.averageSessionMs).toBe(0);
    });

    it('calculates average correctly', () => {
      const entries = [
        makeEntry({ id: '1', startedAt: '2024-01-15T09:00:00.000Z', stoppedAt: '2024-01-15T10:00:00.000Z' }), // 1h
        makeEntry({ id: '2', startedAt: '2024-01-15T11:00:00.000Z', stoppedAt: '2024-01-15T11:30:00.000Z' }), // 30m
      ];
      const result = computeAnalytics(entries);
      expect(result.averageSessionMs).toBe(45 * 60 * 1000); // average of 1h and 30m
    });
  });

  describe('averageRating', () => {
    it('returns null when no rated entries', () => {
      const entries = [makeEntry({ rating: null })];
      const result = computeAnalytics(entries);
      expect(result.averageRating).toBe(null);
      expect(result.ratedSessionCount).toBe(0);
    });

    it('calculates average of rated entries only', () => {
      const entries = [
        makeEntry({ id: '1', rating: 4 }),
        makeEntry({ id: '2', rating: 5 }),
        makeEntry({ id: '3', rating: null }), // excluded from average
      ];
      const result = computeAnalytics(entries);
      expect(result.averageRating).toBe(4.5);
      expect(result.ratedSessionCount).toBe(2);
    });
  });

  describe('timeByActivity', () => {
    it('groups time by activity', () => {
      const entries = [
        makeEntry({ id: '1', activityId: 'a1', startedAt: '2024-01-15T09:00:00.000Z', stoppedAt: '2024-01-15T10:00:00.000Z' }),
        makeEntry({ id: '2', activityId: 'a1', startedAt: '2024-01-15T11:00:00.000Z', stoppedAt: '2024-01-15T11:30:00.000Z' }),
        makeEntry({ id: '3', activityId: 'a2', startedAt: '2024-01-15T12:00:00.000Z', stoppedAt: '2024-01-15T12:15:00.000Z' }),
      ];
      const result = computeAnalytics(entries);
      expect(result.timeByActivity['a1']).toBe(90 * 60 * 1000); // 1h 30m
      expect(result.timeByActivity['a2']).toBe(15 * 60 * 1000); // 15m
    });
  });

  describe('peakHours', () => {
    it('groups time by start hour (local timezone)', () => {
      const entries = [
        makeEntry({ id: '1', startedAt: '2024-01-15T09:00:00.000', stoppedAt: '2024-01-15T10:00:00.000' }), // 1h at hour 9
        makeEntry({ id: '2', startedAt: '2024-01-15T09:30:00.000', stoppedAt: '2024-01-15T10:00:00.000' }), // 30m at hour 9
        makeEntry({ id: '3', startedAt: '2024-01-15T14:00:00.000', stoppedAt: '2024-01-15T15:00:00.000' }), // 1h at hour 14
      ];
      const result = computeAnalytics(entries);
      expect(result.peakHours[9]).toBe(90 * 60 * 1000); // 1h + 30m
      expect(result.peakHours[14]).toBe(60 * 60 * 1000); // 1h
    });
  });

  describe('totalDistractions', () => {
    it('returns 0 for empty entries', () => {
      const result = computeAnalytics([]);
      expect(result.totalDistractions).toBe(0);
    });

    it('sums distractions from completed entries', () => {
      const entries = [
        makeEntry({ id: '1', distractionCount: 3 }),
        makeEntry({ id: '2', distractionCount: 5 }),
      ];
      const result = computeAnalytics(entries);
      expect(result.totalDistractions).toBe(8);
    });

    it('excludes active entries', () => {
      const entries = [
        makeEntry({ id: '1', distractionCount: 3 }),
        makeEntry({ id: '2', stoppedAt: null, distractionCount: 5 }),
      ];
      const result = computeAnalytics(entries);
      expect(result.totalDistractions).toBe(3);
    });
  });

  describe('averageDistractions', () => {
    it('returns 0 for no sessions', () => {
      const result = computeAnalytics([]);
      expect(result.averageDistractions).toBe(0);
    });

    it('calculates average correctly', () => {
      const entries = [
        makeEntry({ id: '1', distractionCount: 3 }),
        makeEntry({ id: '2', distractionCount: 5 }),
        makeEntry({ id: '3', distractionCount: 1 }),
      ];
      const result = computeAnalytics(entries);
      expect(result.averageDistractions).toBe(3);
    });

    it('handles entries with zero distractions', () => {
      const entries = [
        makeEntry({ id: '1', distractionCount: 0 }),
        makeEntry({ id: '2', distractionCount: 6 }),
      ];
      const result = computeAnalytics(entries);
      expect(result.averageDistractions).toBe(3);
    });
  });
});

describe('formatDuration', () => {
  it('returns 0m for zero', () => {
    expect(formatDuration(0)).toBe('0m');
  });

  it('formats minutes only', () => {
    expect(formatDuration(30 * 60 * 1000)).toBe('30m');
  });

  it('formats hours only when no minutes', () => {
    expect(formatDuration(2 * 60 * 60 * 1000)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(2 * 60 * 60 * 1000 + 30 * 60 * 1000)).toBe('2h 30m');
  });
});

describe('getDefaultDateRange', () => {
  it('returns from/to strings in YYYY-MM-DD format', () => {
    const result = getDefaultDateRange();
    expect(result.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a 30 day range', () => {
    const result = getDefaultDateRange();
    const from = new Date(result.from);
    const to = new Date(result.to);
    const diffDays = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });
});

describe('buildAnalyticsCsv', () => {
  const baseAnalytics: AnalyticsData = {
    totalTimeMs: 5400000, // 1h 30m
    averageSessionMs: 2700000, // 45m
    sessionCount: 2,
    averageRating: 4.5,
    ratedSessionCount: 2,
    timeByActivity: { 'act-1': 3600000, 'act-2': 1800000 },
    peakHours: { 9: 3600000, 14: 1800000 },
    totalDistractions: 3,
    averageDistractions: 1.5,
  };

  const activityMap = new Map([
    ['act-1', 'Coding'],
    ['act-2', 'Reading'],
  ]);

  it('includes period and activity filter in header', () => {
    const csv = buildAnalyticsCsv({
      analytics: baseAnalytics,
      from: '2024-01-01',
      to: '2024-01-31',
      activityName: 'All activities',
      activityMap,
    });

    const lines = csv.split('\n');
    expect(lines[0]).toBe('Boosted Flow Analytics Report');
    expect(lines[1]).toBe('Period,2024-01-01 to 2024-01-31');
    expect(lines[2]).toBe('Activity,All activities');
  });

  it('includes all summary metrics', () => {
    const csv = buildAnalyticsCsv({
      analytics: baseAnalytics,
      from: '2024-01-01',
      to: '2024-01-31',
      activityName: 'All activities',
      activityMap,
    });

    expect(csv).toContain('Total Time,1h 30m');
    expect(csv).toContain('Session Count,2');
    expect(csv).toContain('Avg Session,45m');
    expect(csv).toContain('Avg Rating,4.5 (2 rated)');
    expect(csv).toContain('Total Distractions,3');
    expect(csv).toContain('Avg Distractions,1.5');
    expect(csv).toContain('Peak Hour,9:00');
  });

  it('shows specific activity name when filtered', () => {
    const csv = buildAnalyticsCsv({
      analytics: baseAnalytics,
      from: '2024-01-01',
      to: '2024-01-31',
      activityName: 'Coding',
      activityMap,
    });

    expect(csv.split('\n')[2]).toBe('Activity,Coding');
  });

  it('includes time per activity breakdown sorted by time', () => {
    const csv = buildAnalyticsCsv({
      analytics: baseAnalytics,
      from: '2024-01-01',
      to: '2024-01-31',
      activityName: 'All activities',
      activityMap,
    });

    const lines = csv.split('\n');
    const activityHeaderIdx = lines.indexOf('Activity,Time');
    expect(activityHeaderIdx).toBeGreaterThan(-1);
    expect(lines[activityHeaderIdx + 1]).toBe('Coding,1h');
    expect(lines[activityHeaderIdx + 2]).toBe('Reading,30m');
  });

  it('includes peak hours breakdown sorted by hour', () => {
    const csv = buildAnalyticsCsv({
      analytics: baseAnalytics,
      from: '2024-01-01',
      to: '2024-01-31',
      activityName: 'All activities',
      activityMap,
    });

    const lines = csv.split('\n');
    const hourHeaderIdx = lines.indexOf('Hour,Time');
    expect(hourHeaderIdx).toBeGreaterThan(-1);
    expect(lines[hourHeaderIdx + 1]).toBe('9:00,1h');
    expect(lines[hourHeaderIdx + 2]).toBe('14:00,30m');
  });

  it('handles no ratings', () => {
    const csv = buildAnalyticsCsv({
      analytics: { ...baseAnalytics, averageRating: null, ratedSessionCount: 0 },
      from: '2024-01-01',
      to: '2024-01-31',
      activityName: 'All activities',
      activityMap,
    });

    expect(csv).toContain('Avg Rating,No ratings');
  });

  it('handles empty analytics', () => {
    const emptyAnalytics: AnalyticsData = {
      totalTimeMs: 0,
      averageSessionMs: 0,
      sessionCount: 0,
      averageRating: null,
      ratedSessionCount: 0,
      timeByActivity: {},
      peakHours: {},
      totalDistractions: 0,
      averageDistractions: 0,
    };

    const csv = buildAnalyticsCsv({
      analytics: emptyAnalytics,
      from: '2024-01-01',
      to: '2024-01-31',
      activityName: 'All activities',
      activityMap: new Map(),
    });

    expect(csv).toContain('Session Count,0');
    expect(csv).toContain('Peak Hour,No data');
    expect(csv).not.toContain('Activity,Time');
    expect(csv).not.toContain('Hour,Time');
  });

  it('escapes values containing commas', () => {
    const mapWithComma = new Map([['act-1', 'Coding, Debugging']]);
    const analytics: AnalyticsData = {
      ...baseAnalytics,
      timeByActivity: { 'act-1': 3600000 },
    };

    const csv = buildAnalyticsCsv({
      analytics,
      from: '2024-01-01',
      to: '2024-01-31',
      activityName: 'All activities',
      activityMap: mapWithComma,
    });

    expect(csv).toContain('"Coding, Debugging"');
  });
});
