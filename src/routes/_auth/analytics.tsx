import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useActivities } from '@/features/activities/hooks';
import {
  useAnalytics,
  formatDuration,
  getDefaultDateRange,
} from '@/features/analytics';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export const Route = createFileRoute('/_auth/analytics')({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const defaultRange = getDefaultDateRange();
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [activityId, setActivityId] = useState<string>('all');

  // Parse dates for Calendar component
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  const { data: activities } = useActivities();
  const { data: analytics, isLoading } = useAnalytics({
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to + 'T23:59:59').toISOString() : undefined,
    activityId: activityId === 'all' ? undefined : activityId,
  });

  const activityMap = new Map(activities?.map((a) => [a.id, a.name]) || []);

  // Find peak hour
  const peakHour =
    analytics?.peakHours && Object.keys(analytics.peakHours).length > 0
      ? Number(
        Object.entries(analytics.peakHours).reduce((a, b) =>
          a[1] > b[1] ? a : b
        )[0]
      )
      : null;

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Analytics</h1>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Filters</h2>
        <div className="flex max-sm:flex-col flex-wrap gap-4">
          <div>
            <Label className="block text-sm text-muted-foreground mb-2">From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[200px] max-sm:w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={(date) => setFrom(date ? format(date, 'yyyy-MM-dd') : '')}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="block text-sm text-muted-foreground mb-2">To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[200px] max-sm:w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={(date) => setTo(date ? format(date, 'yyyy-MM-dd') : '')}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="block text-sm text-muted-foreground mb-2">Activity</Label>
            <Select value={activityId} onValueChange={setActivityId}>
              <SelectTrigger className="w-[200px] max-sm:w-full">
                <SelectValue placeholder="All activities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All activities</SelectItem>
                {activities?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !analytics ? (
        <p className="text-sm text-muted-foreground">No data</p>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <MetricCard
              label="Total Time"
              value={formatDuration(analytics.totalTimeMs)}
            />
            <MetricCard
              label="Session Count"
              value={analytics.sessionCount.toString()}
            />
            <MetricCard
              label="Avg Session"
              value={formatDuration(analytics.averageSessionMs)}
            />
            <MetricCard
              label="Avg Rating"
              value={
                analytics.averageRating !== null
                  ? analytics.averageRating.toFixed(1)
                  : '—'
              }
              subtitle={
                analytics.ratedSessionCount > 0
                  ? `${analytics.ratedSessionCount} rated`
                  : undefined
              }
            />
            <MetricCard
              label="Total Distractions"
              value={analytics.totalDistractions.toString()}
            />
            <MetricCard
              label="Avg Distractions"
              value={analytics.averageDistractions.toFixed(1)}
            />
            <MetricCard
              label="Peak Hour"
              value={peakHour !== null ? `${peakHour}:00` : '—'}
            />
          </div>

          {/* Time by Activity */}
          {activityId === 'all' && Object.keys(analytics.timeByActivity).length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 mb-6">
              <h2 className="text-base font-semibold text-foreground mb-4">
                Time per Activity
              </h2>
              <div className="space-y-2">
                {Object.entries(analytics.timeByActivity)
                  .sort((a, b) => b[1] - a[1])
                  .map(([id, ms]) => (
                    <div key={id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {activityMap.get(id) || id}
                      </span>
                      <span className="text-foreground font-medium">
                        {formatDuration(ms)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Peak Hours Breakdown */}
          {Object.keys(analytics.peakHours).length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold text-foreground mb-4">
                Hours Breakdown
              </h2>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-1">
                {Array.from({ length: 24 }, (_, hour) => {
                  const ms = analytics.peakHours[hour] || 0;
                  const maxMs = Math.max(...Object.values(analytics.peakHours));
                  const intensity = maxMs > 0 ? ms / maxMs : 0;
                  const bgColor =
                    intensity > 0
                      ? `color-mix(in srgb, var(--color-cream) ${20 + Math.round(intensity * 60)}%, transparent)`
                      : 'var(--muted)';
                  return (
                    <div
                      key={hour}
                      className="text-center"
                      title={`${hour}:00 - ${formatDuration(ms)}`}
                    >
                      <div
                        className="h-8 rounded mb-1"
                        style={{
                          backgroundColor: bgColor,
                        }}
                      />
                      <span className="text-xs text-muted-foreground">{hour}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
