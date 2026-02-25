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

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(...values: string[]): string {
  return values.map(escapeCsvValue).join(',');
}

export function buildAnalyticsCsv(params: {
  analytics: AnalyticsData;
  from: string;
  to: string;
  activityName: string;
  activityMap: Map<string, string>;
}): string {
  const { analytics, from, to, activityName, activityMap } = params;
  const lines: string[] = [];

  // Header
  lines.push(csvRow('Boosted Flow Analytics Report'));
  lines.push(csvRow('Period', `${from} to ${to}`));
  lines.push(csvRow('Activity', activityName));
  lines.push('');

  // Summary metrics
  lines.push(csvRow('Metric', 'Value'));
  lines.push(csvRow('Total Time', formatDuration(analytics.totalTimeMs)));
  lines.push(csvRow('Session Count', analytics.sessionCount.toString()));
  lines.push(csvRow('Avg Session', formatDuration(analytics.averageSessionMs)));
  lines.push(
    csvRow(
      'Avg Rating',
      analytics.averageRating !== null
        ? `${analytics.averageRating.toFixed(1)} (${analytics.ratedSessionCount} rated)`
        : 'No ratings',
    ),
  );
  lines.push(csvRow('Total Distractions', analytics.totalDistractions.toString()));
  lines.push(csvRow('Avg Distractions', analytics.averageDistractions.toFixed(1)));

  const peakHour =
    Object.keys(analytics.peakHours).length > 0
      ? Number(
        Object.entries(analytics.peakHours).reduce((a, b) => (a[1] > b[1] ? a : b))[0],
      )
      : null;
  lines.push(csvRow('Peak Hour', peakHour !== null ? `${peakHour}:00` : 'No data'));

  // Time per activity
  const activityEntries = Object.entries(analytics.timeByActivity).sort((a, b) => b[1] - a[1]);
  if (activityEntries.length > 0) {
    lines.push('');
    lines.push(csvRow('Activity', 'Time'));
    for (const [id, ms] of activityEntries) {
      lines.push(csvRow(activityMap.get(id) || id, formatDuration(ms)));
    }
  }

  // Peak hours breakdown
  const hourEntries = Object.entries(analytics.peakHours)
    .map(([h, ms]) => [Number(h), ms] as const)
    .sort((a, b) => a[0] - b[0]);
  if (hourEntries.length > 0) {
    lines.push('');
    lines.push(csvRow('Hour', 'Time'));
    for (const [hour, ms] of hourEntries) {
      lines.push(csvRow(`${hour}:00`, formatDuration(ms)));
    }
  }

  return lines.join('\n');
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
