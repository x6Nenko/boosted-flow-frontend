import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { useTimeEntries } from '../hooks';
import { buildHeatmapData, calculateCurrentStreak } from './activity-heatmap.utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MIN_MINUTES = 1;
const MAX_MINUTES = 240; // 4 hours
const MONTHS_BACK = 12;

const CELL_SIZE = 12;
const CELL_GAP = 2;

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
      {/* Header with Activity */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="mb-4 text-base font-semibold text-foreground">Activity</h2>
        {/* Streak for small screens */}
        <div className="flex items-start gap-1.5 lg:hidden">
          <Flame className={`w-6 h-6 ${streak.isAtRisk ? 'text-muted-foreground' : 'text-streak'}`} />
          <span className="text-primary font-medium">{streak.days}</span>
        </div>
      </div>

      {/* Container with heatmap and streak side by side on large screens */}
      <div className="flex gap-6 items-start">
        {/* Scrollable heatmap container */}
        <div className="flex-1 overflow-x-auto">
          <div className="max-h-[400px] overflow-y-auto">
            <div className="min-w-fit">
              {/* Month labels */}
              <div className="flex overflow-visible" style={{ marginLeft: 0 }}>
                {weeks.map((_, weekIndex) => {
                  const label = monthLabels.find((m) => m.week === weekIndex);
                  return (
                    <div
                      key={weekIndex}
                      className="flex-none text-xs text-muted-foreground whitespace-nowrap"
                      style={{ width: CELL_SIZE, marginRight: CELL_GAP, overflow: 'visible' }}
                    >
                      {label ? MONTHS[label.month] : ''}
                    </div>
                  );
                })}
              </div>

              {/* Grid */}
              <div className="flex">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col" style={{ marginRight: CELL_GAP }}>
                    {week.map((day, dayIndex) => {
                      const level = getLevel(day.minutes);
                      return (
                        <div
                          key={dayIndex}
                          title={`${formatTooltipDate(day.date)}: ${day.minutes > 0 ? formatHours(day.minutes) : 'No activity'}`}
                          className={`rounded-sm
                            ${level === 0 ? 'bg-muted' : ''}
                            ${level === 1 ? 'bg-heatmap-1' : ''}
                            ${level === 2 ? 'bg-heatmap-2' : ''}
                            ${level === 3 ? 'bg-heatmap-3' : ''}
                            ${level === 4 ? 'bg-heatmap-4' : ''}
                          `}
                          style={{ width: CELL_SIZE, height: CELL_SIZE, marginBottom: CELL_GAP }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Large streak indicator for big screens */}
        <div className="hidden lg:flex flex-row items-center my-auto gap-2 min-w-20">
          <Flame className={`w-12 h-12 ${streak.isAtRisk ? 'text-muted-foreground' : 'text-streak'}`} />
          <span className="text-primary font-bold text-4xl">{streak.days}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="bg-muted rounded-sm" style={{ width: CELL_SIZE, height: CELL_SIZE }} />
        <div className="bg-heatmap-1 rounded-sm" style={{ width: CELL_SIZE, height: CELL_SIZE }} />
        <div className="bg-heatmap-2 rounded-sm" style={{ width: CELL_SIZE, height: CELL_SIZE }} />
        <div className="bg-heatmap-3 rounded-sm" style={{ width: CELL_SIZE, height: CELL_SIZE }} />
        <div className="bg-heatmap-4 rounded-sm" style={{ width: CELL_SIZE, height: CELL_SIZE }} />
        <span>More</span>
      </div>
    </div>
  );
}
