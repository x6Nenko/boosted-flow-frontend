import type { TimeEntry } from '@/features/time-entries/types';
import type { AnalyticsData } from './types';

export function computeAnalytics(entries: TimeEntry[]): AnalyticsData {
  const completedEntries = entries.filter((e) => e.stoppedAt);

  let totalTimeMs = 0;
  let totalRating = 0;
  let ratedSessionCount = 0;
  let totalDistractions = 0;
  const timeByActivity: Record<string, number> = {};
  const peakHours: Record<number, number> = {};

  for (const entry of completedEntries) {
    const startMs = new Date(entry.startedAt).getTime();
    const stopMs = new Date(entry.stoppedAt!).getTime();
    const durationMs = stopMs - startMs;

    totalTimeMs += durationMs;
    totalDistractions += entry.distractionCount;

    // Time by activity
    timeByActivity[entry.activityId] = (timeByActivity[entry.activityId] || 0) + durationMs;

    // Peak hours (hour when session started, local timezone)
    const hour = new Date(entry.startedAt).getHours();
    peakHours[hour] = (peakHours[hour] || 0) + durationMs;

    // Rating
    if (entry.rating !== null) {
      totalRating += entry.rating;
      ratedSessionCount++;
    }
  }

  const sessionCount = completedEntries.length;

  return {
    totalTimeMs,
    averageSessionMs: sessionCount > 0 ? totalTimeMs / sessionCount : 0,
    sessionCount,
    averageRating: ratedSessionCount > 0 ? totalRating / ratedSessionCount : null,
    ratedSessionCount,
    timeByActivity,
    peakHours,
    totalDistractions,
    averageDistractions: sessionCount > 0 ? totalDistractions / sessionCount : 0,
  };
}

export function formatDuration(ms: number): string {
  if (ms === 0) return '0m';

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export function getDateRangeForDays(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}
