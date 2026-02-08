import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { 
  Star, Trash2, Edit2, Check, X, MessageSquare, 
  Clock, Calendar, AlertCircle, Plus, Minus, ChevronRight 
} from 'lucide-react';
import { useUpdateTimeEntry, useDeleteTimeEntry } from '../hooks';
import { formatStoppedDuration, TimerDuration } from './TimerDuration';
import { formatTime, formatDate, cn } from '@/lib/utils';
import { toDateTimeLocalValue, toIsoFromLocal } from '../time-entries.utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TimeEntry } from '../types';
import type { Activity } from '@/features/activities/types';

// Updated RatingStars with Lucide icons
function RatingStars({ value, onChange, disabled }: { value: number | null; onChange: (rating: number) => void; disabled?: boolean; }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          disabled={disabled}
          className={cn(
            "transition-all duration-200",
            disabled ? "cursor-default" : "cursor-pointer hover:scale-110",
            value && star <= value ? "text-primary fill-primary" : "text-muted-foreground/20 fill-transparent"
          )}
        >
          <Star size={12} strokeWidth={2.5} />
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

  const handleEditStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setComment(entry.comment || '');
    setRating(entry.rating);
    setDistractionCount(entry.distractionCount);
    setStartedAtLocal(entry.startedAt ? toDateTimeLocalValue(entry.startedAt) : '');
    setStoppedAtLocal(entry.stoppedAt ? toDateTimeLocalValue(entry.stoppedAt) : '');
    setIsEditing(true);
  };

  const content = (
    <div className="relative group/row">
      <div className="flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/30 text-muted-foreground transition-colors group-hover/row:bg-secondary/50">
            <Clock size={14} />
          </div>
          <div className="flex-1 min-w-0">
            {showActivityName && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary/70">
                  {activity?.name || 'Unknown'}
                </span>
                <ChevronRight size={10} className="text-muted-foreground/30" />
              </div>
            )}
            <p className="text-sm font-medium text-foreground truncate select-none">
              {entry.description || 'No description'}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                <Calendar size={11} className="opacity-70" /> {formatDate(entry.startedAt)}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                <Clock size={11} className="opacity-70" /> {formatTime(entry.startedAt)}
                {entry.stoppedAt && ` – ${formatTime(entry.stoppedAt)}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            {entry.rating && <RatingStars value={entry.rating} onChange={() => {}} disabled />}
            {entry.distractionCount > 0 && (
              <div className="px-1.5 py-0.5 rounded bg-destructive/10 text-[10px] font-bold text-destructive uppercase tracking-tight border border-destructive/20">
                {entry.distractionCount}D
              </div>
            )}
          </div>
          <div
            className={cn(
              'text-sm font-bold font-mono tracking-tighter w-16 text-right timer-nums',
              !entry.stoppedAt && 'text-primary animate-flow-pulse'
            )}
          >
            {entry.stoppedAt ? (
              formatStoppedDuration(entry.startedAt, entry.stoppedAt)
            ) : (
              <TimerDuration startedAt={entry.startedAt} />
            )}
          </div>
          {editable && isStopped && !isEditing && (
            <button
              onClick={handleEditStart}
              className="opacity-0 group-hover/row:opacity-100 p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-all"
            >
              <Edit2 size={12} />
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-2 mb-4 p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">
                  Started
                </label>
                <Input
                  type="datetime-local"
                  value={startedAtLocal}
                  onChange={(e) => setStartedAtLocal(e.target.value)}
                  className="h-8 text-xs bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">
                  Stopped
                </label>
                <Input
                  type="datetime-local"
                  value={stoppedAtLocal}
                  onChange={(e) => setStoppedAtLocal(e.target.value)}
                  className="h-8 text-xs bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">
                Comment
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Session notes..."
                rows={2}
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-border/50">
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">
                    Rating
                  </span>
                  <RatingStars value={rating} onChange={setRating} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">
                    Distractions
                  </span>
                  <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-md">
                    <button
                      type="button"
                      onClick={() => setDistractionCount((c) => Math.max(0, c - 1))}
                      className="p-1 hover:bg-background rounded transition-colors"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-xs font-mono w-4 text-center">{distractionCount}</span>
                    <button
                      type="button"
                      onClick={() => setDistractionCount((c) => c + 1)}
                      className="p-1 hover:bg-background rounded transition-colors"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 ml-auto">
                <Button
                  onClick={handleDelete}
                  disabled={deleteEntry.isPending}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={12} className="mr-1.5" />
                  Delete
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateEntry.isPending}
                  size="sm"
                  className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check size={12} className="mr-1.5" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (showActivityName && !isEditing) {
    return (
      <Link
        to="/activities/$activityId"
        params={{ activityId: entry.activityId }}
        className="block border-b border-border/40 hover:bg-secondary/10 -mx-2 px-2 transition-all duration-200"
      >
        {content}
      </Link>
    );
  }

  return <div className="border-b border-border/40">{content}</div>;
}
