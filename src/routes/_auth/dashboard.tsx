import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useLogout } from '@/features/auth/hooks';
import { useActivities } from '@/features/activities/hooks';
import { ActivityForm } from '@/features/activities/components/ActivityForm';
import { usePomodoroState } from '@/features/pomodoro';
import { useCurrentEntry, useTimeEntries } from '@/features/time-entries/hooks';
import { TimeEntryRow } from '@/features/time-entries/components/TimeEntryRow';
import { ActivityHeatmap } from '@/features/time-entries/components/ActivityHeatmap';

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: activitiesData, isLoading: activitiesLoading } = useActivities();
  const { data: currentData } = useCurrentEntry();
  const { data: entries, isLoading: entriesLoading } = useTimeEntries();
  const pomodoroState = usePomodoroState();

  const activities = activitiesData || [];
  const currentEntry = currentData?.entry ?? null;

  const handleActivityCreated = (id: string) => {
    navigate({ to: '/activities/$activityId', params: { activityId: id } });
  };

  if (activitiesLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  // No activities - show create first activity
  if (activities.length === 0) {
    return (
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            {logout.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
        <div className="rounded border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-gray-900">Create your first activity</h2>
          <p className="mb-4 text-sm text-gray-500">
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
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          {logout.isPending ? 'Logging out...' : 'Logout'}
        </button>
      </div>

      {/* Current Tracking Indicator */}
      {currentEntry ? (
        <div className="rounded border border-indigo-200 bg-indigo-50 p-3 mb-4">
          <p className="text-xs text-indigo-600 mb-1">Currently tracking</p>
          <Link
            to="/activities/$activityId"
            params={{ activityId: currentEntry.activityId }}
            className="text-sm font-medium text-indigo-900 hover:text-indigo-700"
          >
            {currentActivity?.name}
          </Link>
          {currentEntry.description && (
            <p className="text-xs text-indigo-700 mt-1">{currentEntry.description}</p>
          )}
        </div>
      ) : pomodoroState.phase !== 'work' && pomodoroState.isBreakActive ? (
        <div className="rounded border border-green-200 bg-green-50 p-3 mb-4">
          <p className="text-xs text-green-600 mb-1">
            {pomodoroState.phase === 'long-break' ? 'Long break' : 'Short break'} in progress
          </p>
          <p className="text-sm text-green-900">
            Session {pomodoroState.currentSession} completed
          </p>
        </div>
      ) : null}

      {/* Activity Heatmap */}
      <div className="rounded border border-gray-200 bg-white p-4 mb-4">
        <h2 className="mb-3 text-sm font-medium text-gray-900">Activity</h2>
        <ActivityHeatmap />
      </div>

      {/* Recent Entries */}
      <div className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-gray-900">Recent Entries</h2>
        {entriesLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
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
          <p className="text-sm text-gray-500">No time entries yet. Select an activity to start tracking.</p>
        )}
      </div>
    </div>
  );
}
