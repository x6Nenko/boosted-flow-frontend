import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useActivities } from '@/features/activities/hooks';
import {
  useAnalytics,
  formatDuration,
  getDefaultDateRange,
} from '@/features/analytics';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/_auth/analytics')({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const defaultRange = getDefaultDateRange();
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [activityId, setActivityId] = useState<string>('');

  const { data: activities } = useActivities();
  const { data: analytics, isLoading } = useAnalytics({
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to + 'T23:59:59').toISOString() : undefined,
    activityId: activityId || undefined,
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
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Analytics</h1>

      {/* Filters */}
      <div className="rounded border border-gray-200 bg-white p-4 mb-4">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Filters</h2>
        <div className="flex flex-wrap gap-4">
          <div>
            <Label className="block text-sm text-gray-600 mb-1">From</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <Label className="block text-sm text-gray-600 mb-1">To</Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div>
            <Label className="block text-sm text-gray-600 mb-1">Activity</Label>
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All activities</option>
              {activities?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : !analytics ? (
        <p className="text-sm text-gray-500">No data</p>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
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
          {!activityId && Object.keys(analytics.timeByActivity).length > 0 && (
            <div className="rounded border border-gray-200 bg-white p-4 mb-4">
              <h2 className="text-sm font-medium text-gray-900 mb-3">
                Time per Activity
              </h2>
              <div className="space-y-2">
                {Object.entries(analytics.timeByActivity)
                  .sort((a, b) => b[1] - a[1])
                  .map(([id, ms]) => (
                    <div key={id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {activityMap.get(id) || id}
                      </span>
                      <span className="text-gray-900 font-medium">
                        {formatDuration(ms)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Peak Hours Breakdown */}
          {Object.keys(analytics.peakHours).length > 0 && (
            <div className="rounded border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-medium text-gray-900 mb-3">
                Hours Breakdown
              </h2>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-1">
                {Array.from({ length: 24 }, (_, hour) => {
                  const ms = analytics.peakHours[hour] || 0;
                  const maxMs = Math.max(...Object.values(analytics.peakHours));
                  const intensity = maxMs > 0 ? ms / maxMs : 0;
                  return (
                    <div
                      key={hour}
                      className="text-center"
                      title={`${hour}:00 - ${formatDuration(ms)}`}
                    >
                      <div
                        className="h-8 rounded"
                        style={{
                          backgroundColor:
                            intensity > 0
                              ? `rgba(99, 102, 241, ${0.2 + intensity * 0.8})`
                              : '#f3f4f6',
                        }}
                      />
                      <span className="text-xs text-gray-500">{hour}</span>
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
    <div className="rounded border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}
