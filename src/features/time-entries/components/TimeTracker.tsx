import { useState } from 'react';
import {
  useCurrentEntry,
  useTimeEntries,
  useStartTimer,
  useStopTimer,
  useUpdateTimeEntry,
} from '../hooks';
import { useActivities, useCreateActivity } from '@/features/activities/hooks';
import { ACTIVITY_SUGGESTIONS } from '@/features/activities/types';
import { formatStoppedDuration, TimerDuration } from './TimerDuration';
import type { TimeEntry } from '../types';
import type { Activity } from '@/features/activities/types';

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function RatingStars({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          disabled={disabled}
          className={`text-lg ${value && star <= value ? 'text-yellow-500' : 'text-gray-300'} disabled:cursor-not-allowed`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function TimeEntryRow({
  entry,
  activities,
}: {
  entry: TimeEntry;
  activities: Activity[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState(entry.comment || '');
  const [rating, setRating] = useState<number | null>(entry.rating);
  const updateEntry = useUpdateTimeEntry();

  const activity = activities.find((a) => a.id === entry.activityId);
  const isStopped = !!entry.stoppedAt;

  const handleSave = () => {
    updateEntry.mutate(
      { id: entry.id, data: { rating: rating ?? undefined, comment: comment || undefined } },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  return (
    <div className="border-b border-gray-200 py-3 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{activity?.name || 'Unknown'}</p>
          {entry.description && (
            <p className="text-xs text-gray-500">{entry.description}</p>
          )}
          <p className="text-xs text-gray-400">
            {formatDate(entry.startedAt)} • {formatTime(entry.startedAt)}
            {entry.stoppedAt && ` – ${formatTime(entry.stoppedAt)}`}
          </p>
        </div>
        <div className="text-sm font-mono text-gray-700">
          {entry.stoppedAt ? (
            formatStoppedDuration(entry.startedAt, entry.stoppedAt)
          ) : (
            <span className="text-indigo-600">
              <TimerDuration startedAt={entry.startedAt} />
            </span>
          )}
        </div>
      </div>

      {/* Rating/Comment - only for stopped entries */}
      {isStopped && (
        <div className="mt-2">
          {isEditing ? (
            <div className="space-y-2">
              <RatingStars value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                maxLength={1000}
                rows={2}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={updateEntry.isPending}
                  className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <RatingStars value={entry.rating} onChange={() => { }} disabled />
              {entry.comment && (
                <span className="text-xs text-gray-500 truncate">{entry.comment}</span>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-indigo-600 hover:text-indigo-500"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActivityForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const createActivity = useCreateActivity();

  const filteredSuggestions = ACTIVITY_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(name.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createActivity.mutate(
      { name: name.trim() },
      { onSuccess: () => { setName(''); onCreated?.(); } }
    );
  };

  const handleSuggestionClick = (suggestion: string) => {
    setName(suggestion);
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Enter activity name..."
          maxLength={255}
          className="w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
        />
        {showSuggestions && filteredSuggestions.length > 0 && name.length === 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="p-2 text-xs text-gray-500">Suggestions:</div>
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={!name.trim() || createActivity.isPending}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {createActivity.isPending ? 'Creating...' : 'Create Activity'}
      </button>
    </form>
  );
}

function ActivityPicker({
  activities,
  selectedId,
  onSelect,
}: {
  activities: Activity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {activities.map((activity) => (
        <button
          key={activity.id}
          onClick={() => onSelect(activity.id)}
          className={`rounded-full px-3 py-1 text-sm transition-colors ${selectedId === activity.id
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          {activity.name}
        </button>
      ))}
    </div>
  );
}

export function TimeTracker() {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const { data: activitiesData, isLoading: activitiesLoading } = useActivities();
  const { data: currentData } = useCurrentEntry();
  const { data: entries, isLoading: entriesLoading } = useTimeEntries();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const activities = activitiesData || [];
  const currentEntry = currentData?.entry ?? null;
  const isRunning = !!currentEntry;

  const handleStart = () => {
    if (!selectedActivityId) return;
    startTimer.mutate(
      {
        activityId: selectedActivityId,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setDescription('');
          setSelectedActivityId(null);
        },
      }
    );
  };

  const handleStop = () => {
    if (currentEntry) {
      stopTimer.mutate(currentEntry.id);
    }
  };

  // Loading state
  if (activitiesLoading) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  // No activities yet - show create form
  if (activities.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-gray-900">Create your first activity</h2>
          <p className="mb-4 text-sm text-gray-500">
            Activities are things you want to track time on.
          </p>
          <ActivityForm />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timer Control */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {isRunning ? (
          <>
            <div className="mb-3">
              <p className="text-sm text-gray-500">Tracking:</p>
              <p className="font-medium text-gray-900">
                {activities.find((a) => a.id === currentEntry.activityId)?.name}
              </p>
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
              className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {stopTimer.isPending ? 'Stopping...' : 'Stop'}
            </button>
          </>
        ) : (
          <>
            <div className="mb-3">
              <label className="mb-2 block text-sm font-medium text-gray-900">Activity</label>
              <ActivityPicker
                activities={activities}
                selectedId={selectedActivityId}
                onSelect={setSelectedActivityId}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on? (optional)"
                maxLength={500}
                className="w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              />
            </div>
            <button
              onClick={handleStart}
              disabled={!selectedActivityId || startTimer.isPending}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {startTimer.isPending ? 'Starting...' : 'Start'}
            </button>
          </>
        )}
      </div>

      {/* Add Activity (collapsed) */}
      <details className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-900">
          Add new activity
        </summary>
        <div className="px-4 pb-4">
          <ActivityForm />
        </div>
      </details>

      {/* Entries List */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-gray-900">Recent Entries</h2>
        {entriesLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : entries && entries.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <TimeEntryRow key={entry.id} entry={entry} activities={activities} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No time entries yet.</p>
        )}
      </div>
    </div>
  );
}
