import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useUpdateTimeEntry, useDeleteTimeEntry } from '../hooks';
import { formatStoppedDuration, TimerDuration } from './TimerDuration';
import { formatTime, formatDate } from '@/lib/utils';
import { toDateTimeLocalValue, toIsoFromLocal } from '../time-entries.utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
            <p className="text-sm font-medium text-foreground">{activity?.name || 'Unknown'}</p>
          )}
          {entry.description && (
            <p className="text-sm text-muted-foreground">{entry.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDate(entry.startedAt)} • {formatTime(entry.startedAt)}
            {entry.stoppedAt && ` – ${formatTime(entry.stoppedAt)}`}
          </p>
        </div>
        <div className="text-sm font-mono text-foreground">
          {entry.stoppedAt ? (
            formatStoppedDuration(entry.startedAt, entry.stoppedAt)
          ) : (
            <span className="text-primary">
              <TimerDuration startedAt={entry.startedAt} />
            </span>
          )}
        </div>
      </div>

      {editable && isStopped && (
        <div className="mt-2">
          {isEditing ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-muted-foreground">
                  Started at
                  <Input
                    type="datetime-local"
                    value={startedAtLocal}
                    onChange={(e) => setStartedAtLocal(e.target.value)}
                    className="mt-2"
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Stopped at
                  <Input
                    type="datetime-local"
                    value={stoppedAtLocal}
                    onChange={(e) => setStoppedAtLocal(e.target.value)}
                    className="mt-2"
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
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Distractions:</span>
                <Button
                  type="button"
                  onClick={() => setDistractionCount((c) => Math.max(0, c - 1))}
                  variant="outline"
                  size="sm"
                >
                  −
                </Button>
                <span className="text-sm w-6 text-center text-foreground">{distractionCount}</span>
                <Button
                  type="button"
                  onClick={() => setDistractionCount((c) => c + 1)}
                  variant="outline"
                  size="sm"
                >
                  +
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={updateEntry.isPending}
                  size="sm"
                >
                  Save
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deleteEntry.isPending}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <RatingStars value={entry.rating} onChange={() => { }} disabled />
              {entry.comment && (
                <span className="text-xs text-muted-foreground truncate">{entry.comment}</span>
              )}
              {entry.distractionCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {entry.distractionCount} distraction{entry.distractionCount !== 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={handleEditStart}
                className="text-xs text-primary hover:text-primary/80"
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
            <span className="text-xs text-muted-foreground truncate">{entry.comment}</span>
          )}
          {entry.distractionCount > 0 && (
            <span className="text-xs text-muted-foreground">
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
        className="block border-b border-border py-3 last:border-0 hover:bg-accent/50 -mx-2 px-2 rounded transition-colors"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="border-b border-border py-3 last:border-0">
      {content}
    </div>
  );
}
