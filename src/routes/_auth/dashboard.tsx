import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useActivities } from '@/features/activities/hooks';
import { ActivityForm } from '@/features/activities/components/ActivityForm';
import { usePomodoroState } from '@/features/pomodoro';
import { useCurrentEntry, useTimeEntries } from '@/features/time-entries/hooks';
import { TimeEntryList } from '@/features/time-entries/components/TimeEntryList';
import { ActivityHeatmap } from '@/features/time-entries/components/ActivityHeatmap';
import { getDateRangeForDays } from '@/features/analytics';
import { Button } from '@/components/ui/button';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

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

  const activitiesMap = useMemo(
    () => new Map(activities.map((a) => [a.id, a])),
    [activities],
  );

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
        <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="rounded-xl border border-border bg-card max-sm:p-4 p-6">
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
      <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h1>

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
      <div className="rounded-xl border border-border bg-card max-sm:p-4 p-6 mb-6">
        <ActivityHeatmap />
      </div>

      {/* Recent Entries */}
      <div className="rounded-xl border border-border bg-card max-sm:p-4 p-6">
        <div className="mb-4 flex max-sm:flex-col max-sm:gap-4 sm:items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent Entries</h2>
          <Select
            value={period}
            onValueChange={(value) => {
              if (value === 'custom' && !customFrom && !customTo) {
                const range = getDateRangeForDays(7);
                setCustomFrom(range.from);
                setCustomTo(range.to);
              }
              setPeriod(value);
            }}
          >
            <SelectTrigger className="w-[180px] max-sm:w-full">
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
          <div className="mb-4 flex max-sm:flex-col gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[200px] max-sm:w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customFrom ? format(new Date(customFrom), 'PPP') : <span>From date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customFrom ? new Date(customFrom) : undefined}
                  onSelect={(date) => setCustomFrom(date ? format(date, 'yyyy-MM-dd') : '')}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[200px] max-sm:w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customTo ? format(new Date(customTo), 'PPP') : <span>To date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customTo ? new Date(customTo) : undefined}
                  onSelect={(date) => setCustomTo(date ? format(date, 'yyyy-MM-dd') : '')}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
        {entriesLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : entries && entries.length > 0 ? (
          <TimeEntryList
            entries={entries}
            activitiesMap={activitiesMap}
            showActivityName
            emptyMessage="No time entries yet. Select an activity to start tracking."
          />
        ) : (
          <p className="text-sm text-muted-foreground">No time entries yet. Select an activity to start tracking.</p>
        )}
      </div>
    </div>
  );
}
