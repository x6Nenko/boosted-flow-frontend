import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Star, Trash2, Edit2, Check, MessageSquare,
  Clock, Calendar, Plus, Minus, ChevronRight, Lightbulb,
} from 'lucide-react';
import { useUpdateTimeEntry, useDeleteTimeEntry } from '../hooks';
import { formatStoppedDuration, TimerDuration } from './TimerDuration';
import { formatTime, formatDate, cn } from '@/lib/utils';
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange(star);
          }}
          disabled={disabled}
          className={cn(
            'transition-all duration-150',
            disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110',
            value && star <= value
              ? 'text-primary fill-primary'
              : 'text-muted-foreground/70 fill-transparent'
          )}
        >
          <Star size={14} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}

function DistractionChip({ count }: { count: number }) {
  if (count > 0) {
    return (
      <span className="text-xs font-medium text-destructive/80 bg-destructive/5 px-1.5 py-0.5 rounded-md">
        {count} distraction{count !== 1 ? 's' : ''}
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-clean/80 bg-clean/5 px-1.5 py-0.5 rounded-md">
      0 distractions
    </span>
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

  /* ── Quick-action: save rating immediately ── */
  const handleRatingChange = (newRating: number) => {
    updateEntry.mutate({
      id: entry.id,
      data: { rating: newRating },
    });
  };

  /* ── Edit form: save timestamps, reflection, distractions ── */
  const handleSave = () => {
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
          comment: comment || undefined,
          distractionCount,
        },
      },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this time entry?')) {
      deleteEntry.mutate(entry.id);
    }
  };

  const handleEditStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setComment(entry.comment || '');
    setDistractionCount(entry.distractionCount);
    setStartedAtLocal(entry.startedAt ? toDateTimeLocalValue(entry.startedAt) : '');
    setStoppedAtLocal(entry.stoppedAt ? toDateTimeLocalValue(entry.stoppedAt) : '');
    setIsEditing(true);
  };

  /* ═══════════════════════════════════════════
     Dashboard mode — compact row
     Activity name + date/time + duration only
     ═══════════════════════════════════════════ */
  if (showActivityName) {
    const dashboardContent = (
      <div className="flex items-center justify-between py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs uppercase font-semibold tracking-wide text-primary/80">
              {activity?.name || 'Unknown'}
            </span>
            <ChevronRight size={10} className="text-muted-foreground/30" />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="opacity-60" />
              {formatDate(entry.startedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="opacity-60" />
              {formatTime(entry.startedAt)}
              {entry.stoppedAt && ` – ${formatTime(entry.stoppedAt)}`}
            </span>
          </div>
        </div>

        <div
          className={cn(
            'text-sm font-bold font-mono tracking-tighter timer-nums ml-4',
            !entry.stoppedAt && 'text-primary animate-flow-pulse'
          )}
        >
          {entry.stoppedAt ? (
            formatStoppedDuration(entry.startedAt, entry.stoppedAt)
          ) : (
            <TimerDuration startedAt={entry.startedAt} />
          )}
        </div>
      </div>
    );

    return (
      <Link
        to="/activities/$activityId"
        params={{ activityId: entry.activityId }}
        className="block border-b border-border/40 hover:bg-secondary/10 -mx-2 px-2 rounded-lg transition-colors duration-200"
      >
        {dashboardContent}
      </Link>
    );
  }

  /* ═══════════════════════════════════════════
     Activity page mode — rich row
     Date/time + duration + intention/reflection
     + interactive rating + distraction chip
     + hover edit/delete icons
     ═══════════════════════════════════════════ */
  const activityContent = (
    <div className="relative group/row">
      {/* Line 1: Date/time + actions + duration */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="opacity-60" />
            {formatDate(entry.startedAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="opacity-60" />
            {formatTime(entry.startedAt)}
            {entry.stoppedAt && ` – ${formatTime(entry.stoppedAt)}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {editable && isStopped && !isEditing && (
            <>
              <button
                onClick={handleEditStart}
                className="opacity-0 group-hover/row:opacity-100 p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-all duration-200"
                title="Edit entry"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteEntry.isPending}
                className="opacity-0 group-hover/row:opacity-100 p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-all duration-200"
                title="Delete entry"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          <div
            className={cn(
              'text-sm font-bold font-mono tracking-tighter timer-nums min-w-[70px] text-right',
              !entry.stoppedAt && 'text-primary animate-flow-pulse'
            )}
          >
            {entry.stoppedAt ? (
              formatStoppedDuration(entry.startedAt, entry.stoppedAt)
            ) : (
              <TimerDuration startedAt={entry.startedAt} />
            )}
          </div>
        </div>
      </div>

      {/* Line 2: Rating + Distractions (stopped entries only) */}
      {isStopped && (
        <div className="flex items-center gap-3 pb-3">
          <DistractionChip count={entry.distractionCount} />
          <RatingStars
            value={entry.rating}
            onChange={editable ? handleRatingChange : () => { }}
            disabled={!editable}
          />
        </div>
      )}

      {/* Detail Block (Intention & Reflection) - Stopped entries only */}
      {isStopped && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-5 pt-4 border-t border-border/10 mt-1">
          {/* Intention */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase font-semibold text-muted-foreground tracking-wide">
              <Lightbulb size={14} className="text-primary/60" />
              Intention
            </div>
            <div className="text-sm text-foreground/90 leading-relaxed font-medium pl-4 border-l border-primary/20">
              {entry.description || (
                <span className="text-muted-foreground/40 font-normal">No intention defined</span>
              )}
            </div>
          </div>

          {/* Reflection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase font-semibold text-muted-foreground tracking-wide">
              <MessageSquare size={14} className="text-primary/60" />
              Reflection
            </div>
            <div className="text-sm text-foreground/80 leading-relaxed pl-4 border-l border-border/60">
              {entry.comment || (
                <span className="text-muted-foreground/40 font-normal">No reflection provided</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Line 2 alt: Intention for running entries */}
      {!isStopped && (
        <div className="pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-muted-foreground/50 shrink-0" />
            {entry.description ? (
              <p className="text-sm text-foreground truncate">{entry.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No intention</p>
            )}
          </div>
        </div>
      )}

      {/* Inline edit form */}
      {isEditing && (
        <div className="mb-4 p-4 rounded-xl border border-border bg-card animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            {/* Timestamps */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-semibold text-muted-foreground tracking-wide px-1">
                  Started
                </label>
                <Input
                  type="datetime-local"
                  value={startedAtLocal}
                  onChange={(e) => setStartedAtLocal(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-semibold text-muted-foreground tracking-wide px-1">
                  Stopped
                </label>
                <Input
                  type="datetime-local"
                  value={stoppedAtLocal}
                  onChange={(e) => setStoppedAtLocal(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>

            {/* Reflection */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-semibold text-muted-foreground tracking-wide px-1">
                Reflection
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How did this flow session go?"
                maxLength={1000}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-200"
              />
            </div>

            {/* Distractions + Actions */}
            <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-border/50">
              <div className="space-y-1">
                <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wide block mb-1">
                  Distractions
                </span>
                <div className="flex items-center gap-1.5 bg-secondary/30 p-0.5 rounded-md">
                  <button
                    type="button"
                    onClick={() => setDistractionCount((c) => Math.max(0, c - 1))}
                    className="p-1 hover:bg-background rounded-md transition-colors duration-150"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-mono w-5 text-center">{distractionCount}</span>
                  <button
                    type="button"
                    onClick={() => setDistractionCount((c) => c + 1)}
                    className="p-1 hover:bg-background rounded-md transition-colors duration-150"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 ml-auto">
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
                  variant="action"
                  size="sm"
                  className="h-8 text-xs"
                >
                  <Check size={14} className="mr-1.5" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return <div className="border-b border-border/40">{activityContent}</div>;
}
