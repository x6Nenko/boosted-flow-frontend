import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useLogout } from '@/features/auth/hooks';
import { useActivities } from '@/features/activities/hooks';
import { ActivityForm } from '@/features/activities/components/ActivityForm';
import { useCurrentEntry, useTimeEntries, useStopTimer } from '@/features/time-entries/hooks';
import { TimerDuration } from '@/features/time-entries/components/TimerDuration';
import { TimeEntryRow } from '@/features/time-entries/components/TimeEntryRow';

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: activitiesData, isLoading: activitiesLoading } = useActivities();
  const { data: currentData } = useCurrentEntry();
  const { data: entries, isLoading: entriesLoading } = useTimeEntries();
  const stopTimer = useStopTimer();

  const activities = activitiesData || [];
  const currentEntry = currentData?.entry ?? null;

  const handleActivityCreated = (id: string) => {
    navigate({ to: '/activities/$activityId', params: { activityId: id } });
  };

  const handleStop = () => {
    if (currentEntry) {
      stopTimer.mutate(currentEntry.id);
    }
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

      {/* Current Timer */}
      {currentEntry && (
        <div className="rounded border border-gray-200 bg-white p-4 mb-4">
          <div className="mb-2">
            <p className="text-sm text-gray-500">Currently tracking:</p>
            <Link
              to="/activities/$activityId"
              params={{ activityId: currentEntry.activityId }}
              className="font-medium text-gray-900 hover:text-indigo-600"
            >
              {currentActivity?.name}
            </Link>
            {currentEntry.description && (
              <p className="text-sm text-gray-500">{currentEntry.description}</p>
            )}
          </div>
          <div className="mb-3 text-center">
            <span className="text-3xl font-mono text-indigo-600">
              <TimerDuration startedAt={currentEntry.startedAt} />
            </span>
          </div>
          <button
            onClick={handleStop}
            disabled={stopTimer.isPending}
            className="w-full rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {stopTimer.isPending ? 'Stopping...' : 'Stop'}
          </button>
        </div>
      )}

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
