import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useLogout } from '@/features/auth/hooks';
import { useActivities } from '@/features/activities/hooks';
import { ActivityForm } from '@/features/activities/components/ActivityForm';
import { usePomodoroState } from '@/features/pomodoro';
import { useCurrentEntry, useTimeEntries } from '@/features/time-entries/hooks';
import { TimeEntryRow } from '@/features/time-entries/components/TimeEntryRow';
import { ActivityHeatmap } from '@/features/time-entries/components/ActivityHeatmap';
import { getDateRangeForDays } from '@/features/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardPage,
});

const PERIOD_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom Range' },
] as const;

function DashboardPage() {
  const navigate = useNavigate();
  const logout = useLogout();
  const [period, setPeriod] = useState('7');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const { data: activitiesData, isLoading: activitiesLoading } = useActivities();
  const { data: currentData } = useCurrentEntry();

  const dateRange =
    period === 'custom'
      ? (customFrom && customTo ? { from: customFrom, to: customTo } : undefined)
      : period !== 'all'
        ? getDateRangeForDays(Number(period))
        : undefined;
  const { data: entries, isLoading: entriesLoading } = useTimeEntries(
    dateRange ? { from: dateRange.from, to: dateRange.to + 'T23:59:59' } : undefined
  );
  const pomodoroState = usePomodoroState();

  const activities = activitiesData || [];
  const currentEntry = currentData?.entry ?? null;

  const handleActivityCreated = (id: string) => {
    navigate({ to: '/activities/$activityId', params: { activityId: id } });
  };

  if (activitiesLoading) {
    return (
      <div className="py-8">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // No activities - show create first activity
  if (activities.length === 0) {
    return (
      <div className="py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <Button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            variant="secondary"
            size="sm"
          >
            {logout.isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-3 text-base font-semibold text-foreground">Create your first activity</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Activities are things you want to track time on.
          </p>
          <ActivityForm onCreated={handleActivityCreated} />
        </div>
      </div>
    );
  }

  const currentActivity = currentEntry
    ? activities.find((a) => a.id === currentEntry.activityId)
    : null;

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <Button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          variant="secondary"
          size="sm"
        >
          {logout.isPending ? 'Logging out...' : 'Logout'}
        </Button>
      </div>

      {/* Current Tracking Indicator */}
      {currentEntry ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
          <p className="text-xs text-primary mb-1">Currently tracking</p>
          <Link
            to="/activities/$activityId"
            params={{ activityId: currentEntry.activityId }}
            className="text-sm font-medium text-foreground hover:text-primary"
          >
            {currentActivity?.name}
          </Link>
          {currentEntry.description && (
            <p className="text-xs text-muted-foreground mt-1">{currentEntry.description}</p>
          )}
        </div>
      ) : pomodoroState.phase !== 'work' && pomodoroState.isBreakActive ? (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 mb-6">
          <p className="text-xs text-green-600 mb-1">
            {pomodoroState.phase === 'long-break' ? 'Long break' : 'Short break'} in progress
          </p>
          <p className="text-sm text-foreground">
            Session {pomodoroState.currentSession} completed
          </p>
        </div>
      ) : null}

      {/* Activity Heatmap */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Activity</h2>
        <ActivityHeatmap />
      </div>

      {/* Recent Entries */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent Entries</h2>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {period === 'custom' && (
          <div className="mb-3 flex gap-2">
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        )}
        {entriesLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : entries && entries.length > 0 ? (
          <div>
            {entries.map((entry) => (
              <TimeEntryRow
                key={entry.id}
                entry={entry}
                activity={activities.find((a) => a.id === entry.activityId)}
                showActivityName
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No time entries yet. Select an activity to start tracking.</p>
        )}
      </div>
    </div>
  );
}
