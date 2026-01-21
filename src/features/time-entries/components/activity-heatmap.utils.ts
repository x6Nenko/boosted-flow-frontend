import type { TimeEntry } from '../types';

export type HeatmapDay = {
  date: Date;
  minutes: number;
};

export type HeatmapMonthLabel = {
  week: number;
  month: number; // 0-11
};

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDurationMinutes(entry: TimeEntry): number {
  if (!entry.stoppedAt) return 0;
  const start = new Date(entry.startedAt).getTime();
  const stop = new Date(entry.stoppedAt).getTime();
  return Math.max(0, Math.floor((stop - start) / 60000));
}

export function buildHeatmapData(
  entries: Array<TimeEntry>,
  monthsBack: number,
  endDate: Date = new Date()
): {
  weeks: Array<Array<HeatmapDay>>;
  monthLabels: Array<HeatmapMonthLabel>;
} {
  const today = new Date(endDate);
  today.setHours(0, 0, 0, 0);

  const minutesByDate = new Map<string, number>();
  for (const entry of entries) {
    const minutes = getDurationMinutes(entry);
    if (minutes < 1) continue;
    const key = toLocalDateKey(new Date(entry.startedAt));
    minutesByDate.set(key, (minutesByDate.get(key) || 0) + minutes);
  }

  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - monthsBack);
  startDate.setHours(0, 0, 0, 0);

  // Go back to Sunday so weeks align (Sun..Sat)
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: Array<Array<HeatmapDay>> = [];
  const monthLabels: Array<HeatmapMonthLabel> = [];
  let currentWeek: Array<HeatmapDay> = [];
  let lastMonth = -1;

  const d = new Date(startDate);
  while (d <= today) {
    const key = toLocalDateKey(d);
    const minutes = minutesByDate.get(key) || 0;

    currentWeek.push({
      date: new Date(d),
      minutes,
    });

    if (d.getDay() === 0 && d.getMonth() !== lastMonth) {
      monthLabels.push({ week: weeks.length, month: d.getMonth() });
      lastMonth = d.getMonth();
    }

    if (d.getDay() === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    d.setDate(d.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return { weeks, monthLabels };
}
