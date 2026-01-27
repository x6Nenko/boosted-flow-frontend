import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useUpdateTimeEntry, useDeleteTimeEntry } from '../hooks';
import { formatStoppedDuration, TimerDuration } from './TimerDuration';
import { formatTime, formatDate } from '@/lib/utils';
import { toDateTimeLocalValue, toIsoFromLocal } from '../time-entries.utils';
import type { TimeEntry } from '../types';
import type { Activity } from '@/features/activities/types';

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

type TimeEntryRowProps = {
  entry: TimeEntry;
  activity?: Activity;
  showActivityName?: boolean;
  editable?: boolean;
};

export function TimeEntryRow({
  entry,
  activity,
  showActivityName = false,
  editable = false,
}: TimeEntryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState(entry.comment || '');
  const [rating, setRating] = useState<number | null>(entry.rating);
  const [distractionCount, setDistractionCount] = useState(entry.distractionCount);
  const [startedAtLocal, setStartedAtLocal] = useState(
    entry.startedAt ? toDateTimeLocalValue(entry.startedAt) : ''
  );
  const [stoppedAtLocal, setStoppedAtLocal] = useState(
    entry.stoppedAt ? toDateTimeLocalValue(entry.stoppedAt) : ''
  );
  const updateEntry = useUpdateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();

  const isStopped = !!entry.stoppedAt;

  const handleSave = async () => {
    const startedAtIso = startedAtLocal ? toIsoFromLocal(startedAtLocal) : undefined;
    const stoppedAtIso = stoppedAtLocal ? toIsoFromLocal(stoppedAtLocal) : undefined;
    const startedAtChanged =
      startedAtIso && startedAtIso !== entry.startedAt ? startedAtIso : undefined;
    const stoppedAtChanged =
      stoppedAtIso && stoppedAtIso !== entry.stoppedAt ? stoppedAtIso : undefined;

    updateEntry.mutate(
      {
        id: entry.id,
        data: {
          startedAt: startedAtChanged,
          stoppedAt: stoppedAtChanged,
          rating: rating ?? undefined,
          comment: comment || undefined,
          distractionCount,
        },
      },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleDelete = () => {
    if (confirm('Delete this time entry?')) {
      deleteEntry.mutate(entry.id);
    }
  };

  const handleEditStart = () => {
    setComment(entry.comment || '');
    setRating(entry.rating);
    setDistractionCount(entry.distractionCount);
    setStartedAtLocal(entry.startedAt ? toDateTimeLocalValue(entry.startedAt) : '');
    setStoppedAtLocal(entry.stoppedAt ? toDateTimeLocalValue(entry.stoppedAt) : '');
    setIsEditing(true);
  };

  const content = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {showActivityName && (
            <p className="text-sm font-medium text-gray-900">{activity?.name || 'Unknown'}</p>
          )}
          {entry.description && (
            <p className="text-sm text-gray-700">{entry.description}</p>
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

      {editable && isStopped && (
        <div className="mt-2">
          {isEditing ? (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-gray-500">
                  Started at
                  <input
                    type="datetime-local"
                    value={startedAtLocal}
                    onChange={(e) => setStartedAtLocal(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                </label>
                <label className="text-xs text-gray-500">
                  Stopped at
                  <input
                    type="datetime-local"
                    value={stoppedAtLocal}
                    onChange={(e) => setStoppedAtLocal(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                </label>
              </div>
              <RatingStars value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What are your reflections? (optional)"
                maxLength={1000}
                rows={2}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Distractions:</span>
                <button
                  type="button"
                  onClick={() => setDistractionCount((c) => Math.max(0, c - 1))}
                  className="rounded border border-gray-300 px-2 py-0.5 text-sm hover:bg-gray-50"
                >
                  −
                </button>
                <span className="text-sm w-6 text-center">{distractionCount}</span>
                <button
                  type="button"
                  onClick={() => setDistractionCount((c) => c + 1)}
                  className="rounded border border-gray-300 px-2 py-0.5 text-sm hover:bg-gray-50"
                >
                  +
                </button>
              </div>
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
                <button
                  onClick={handleDelete}
                  disabled={deleteEntry.isPending}
                  className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <RatingStars value={entry.rating} onChange={() => { }} disabled />
              {entry.comment && (
                <span className="text-xs text-gray-500 truncate">{entry.comment}</span>
              )}
              {entry.distractionCount > 0 && (
                <span className="text-xs text-gray-400">
                  {entry.distractionCount} distraction{entry.distractionCount !== 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={handleEditStart}
                className="text-xs text-indigo-600 hover:text-indigo-500"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      )}

      {!editable && isStopped && (entry.rating || entry.distractionCount > 0) && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {entry.rating && <RatingStars value={entry.rating} onChange={() => { }} disabled />}
          {entry.comment && (
            <span className="text-xs text-gray-500 truncate">{entry.comment}</span>
          )}
          {entry.distractionCount > 0 && (
            <span className="text-xs text-gray-400">
              {entry.distractionCount} distraction{entry.distractionCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (showActivityName) {
    return (
      <Link
        to="/activities/$activityId"
        params={{ activityId: entry.activityId }}
        className="block border-b border-gray-200 py-3 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="border-b border-gray-200 py-3 last:border-0">
      {content}
    </div>
  );
}
