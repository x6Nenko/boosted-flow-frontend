import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useActivity } from '@/features/activities/hooks';
import {
  useCurrentEntry,
  useTimeEntries,
  useStartTimer,
  useStopTimer,
} from '@/features/time-entries/hooks';
import { TimerDuration } from '@/features/time-entries/components/TimerDuration';
import { TimeEntryRow } from '@/features/time-entries/components/TimeEntryRow';

export const Route = createFileRoute('/_auth/activities/$activityId')({
  component: ActivityPage,
});

function ActivityPage() {
  const { activityId } = Route.useParams();
  const [description, setDescription] = useState('');

  const { data: activity, isLoading: activityLoading } = useActivity(activityId);
  const { data: currentData } = useCurrentEntry();
  const { data: entries, isLoading: entriesLoading } = useTimeEntries({ activityId });
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const currentEntry = currentData?.entry ?? null;
  const isRunningThisActivity = currentEntry?.activityId === activityId;
  const isRunningOther = !!currentEntry && !isRunningThisActivity;

  const handleStart = () => {
    startTimer.mutate(
      {
        activityId,
        description: description.trim() || undefined,
      },
      { onSuccess: () => setDescription('') }
    );
  };

  const handleStop = () => {
    if (currentEntry) {
      stopTimer.mutate(currentEntry.id);
    }
  };

  if (activityLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Activity not found</p>
        <Link to="/activities" className="text-sm text-indigo-600 hover:text-indigo-500">
          ← Back to activities
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link to="/activities" className="text-sm text-indigo-600 hover:text-indigo-500">
          ← Activities
        </Link>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-4">{activity.name}</h1>

      {/* Timer Control */}
      <div className="rounded border border-gray-200 bg-white p-4 mb-4">
        {isRunningThisActivity ? (
          <>
            <div className="mb-3">
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
          </>
        ) : isRunningOther ? (
          <p className="text-sm text-gray-500">
            Timer is running on another activity. Stop it first to start tracking here.
          </p>
        ) : (
          <>
            <div className="mb-3">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on? (optional)"
                maxLength={500}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleStart}
              disabled={startTimer.isPending}
              className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {startTimer.isPending ? 'Starting...' : 'Start Tracking'}
            </button>
          </>
        )}
      </div>

      {/* Entries List */}
      <div className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-gray-900">History</h2>
        {entriesLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : entries && entries.length > 0 ? (
          <div>
            {entries.map((entry) => (
              <TimeEntryRow key={entry.id} entry={entry} editable />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No time entries yet.</p>
        )}
      </div>
    </div>
  );
}
