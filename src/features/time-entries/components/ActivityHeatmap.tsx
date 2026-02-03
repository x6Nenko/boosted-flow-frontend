import { useMemo } from 'react';
import { useTimeEntries } from '../hooks';
import { buildHeatmapData, calculateCurrentStreak } from './activity-heatmap.utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MIN_MINUTES = 1;
const MAX_MINUTES = 240; // 4 hours
const MONTHS_BACK = 12;

function getLevel(minutes: number): number {
  if (minutes < MIN_MINUTES) return 0;
  if (minutes >= MAX_MINUTES) return 4;
  // Linear scale: 1-4 hours mapped to levels 1-4
  const ratio = minutes / MAX_MINUTES;
  return Math.min(4, Math.ceil(ratio * 4));
}

function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return hours < 1 ? `${minutes}m` : `${hours.toFixed(1)}h`;
}

function formatTooltipDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function ActivityHeatmap() {
  const sixMonthsAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - MONTHS_BACK);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const { data: entries, isLoading } = useTimeEntries({ from: sixMonthsAgo });

  const streak = useMemo(
    () => calculateCurrentStreak(entries || []),
    [entries]
  );

  const { weeks, monthLabels } = useMemo(
    () => buildHeatmapData(entries || [], MONTHS_BACK),
    [entries]
  );

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      <div className="text-sm text-foreground mb-2">
        Current streak: {streak.days}
        {streak.isAtRisk && <span className="text-destructive"> (at risk)</span>}
      </div>
      {/* Month labels */}
      <div className="flex" style={{ marginLeft: 0 }}>
        {weeks.map((_, weekIndex) => {
          const label = monthLabels.find((m) => m.week === weekIndex);
          return (
            <div key={weekIndex} className="text-xs text-muted-foreground" style={{ width: 12, marginRight: 2 }}>
              {label ? MONTHS[label.month] : ''}
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col" style={{ marginRight: 2 }}>
            {week.map((day, dayIndex) => {
              const level = getLevel(day.minutes);
              return (
                <div
                  key={dayIndex}
                  title={`${formatTooltipDate(day.date)}: ${day.minutes > 0 ? formatHours(day.minutes) : 'No activity'}`}
                  className={`rounded-sm
                    ${level === 0 ? 'bg-muted' : ''}
                    ${level === 1 ? 'bg-primary/20' : ''}
                    ${level === 2 ? 'bg-primary/40' : ''}
                    ${level === 3 ? 'bg-primary/60' : ''}
                    ${level === 4 ? 'bg-primary/80' : ''}
                  `}
                  style={{ width: 12, height: 12, marginBottom: 2 }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="bg-muted rounded-sm" style={{ width: 12, height: 12 }} />
        <div className="bg-primary/20 rounded-sm" style={{ width: 12, height: 12 }} />
        <div className="bg-primary/40 rounded-sm" style={{ width: 12, height: 12 }} />
        <div className="bg-primary/60 rounded-sm" style={{ width: 12, height: 12 }} />
        <div className="bg-primary/80 rounded-sm" style={{ width: 12, height: 12 }} />
        <span>More</span>
      </div>
    </div>
  );
}
