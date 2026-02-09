import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Star, Trash2, Edit2, Check, MessageSquare,
  Clock, Calendar as CalendarIcon, Plus, Minus, ChevronRight, Lightbulb,
} from 'lucide-react';
import { useUpdateTimeEntry, useDeleteTimeEntry } from '../hooks';
import { formatStoppedDuration, TimerDuration } from './TimerDuration';
import { formatTime, formatDate, cn } from '@/lib/utils';
import { toDateTimeLocalValue, toIsoFromLocal } from '../time-entries.utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
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
      <span className="text-xs font-medium text-destructive/70 bg-destructive/5 px-1.5 py-0.5 rounded-md">
        {count} distraction{count !== 1 ? 's' : ''}
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-clean/70 bg-clean/5 px-1.5 py-0.5 rounded-md">
      0 distractions
    </span>
  );
}

function parseDateTimeLocal(value: string) {
  const [dateStr, timeStr] = value.split('T');
  return {
    date: new Date(`${dateStr}T00:00`),
    time: timeStr,
  };
}

function getLocalDateTimeParts(iso?: string | null) {
  if (!iso) return { date: undefined, time: '' };
  return parseDateTimeLocal(toDateTimeLocalValue(iso));
}

function buildDateTimeLocal(date: Date, time: string) {
  const dateStr = format(date, 'yyyy-MM-dd');
  return `${dateStr}T${time}`;
}

type DateTimeInputProps = {
  label: string;
  date: Date | undefined;
  time: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  dateId: string;
  timeId: string;
};

function DateTimeInput({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  dateId,
  timeId,
}: DateTimeInputProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={dateId}
        className="text-sm font-semibold text-muted-foreground tracking-wide px-1"
      >
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id={dateId}
              className="h-8 flex-1 justify-start text-sm font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              defaultMonth={date}
              onSelect={onDateChange}
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          id={timeId}
          step="1"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="h-8 w-fit text-sm bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}

type TimeEntryRowProps = {
  entry: TimeEntry;
  activity?: Activity;
  showActivityName?: boolean;
  editable?: boolean;
  showDetails?: boolean;
};

export function TimeEntryRow({
  entry,
  activity,
  showActivityName = false,
  editable = false,
  showDetails = false,
}: TimeEntryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState(entry.comment || '');
  const [distractionCount, setDistractionCount] = useState(entry.distractionCount);
  const initialStarted = getLocalDateTimeParts(entry.startedAt);
  const initialStopped = getLocalDateTimeParts(entry.stoppedAt);
  const [startedDate, setStartedDate] = useState<Date | undefined>(initialStarted.date);
  const [startedTime, setStartedTime] = useState(initialStarted.time);
  const [stoppedDate, setStoppedDate] = useState<Date | undefined>(initialStopped.date);
  const [stoppedTime, setStoppedTime] = useState(initialStopped.time);
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
    const startedAtLocal =
      startedDate && startedTime ? buildDateTimeLocal(startedDate, startedTime) : undefined;
    const stoppedAtLocal =
      stoppedDate && stoppedTime ? buildDateTimeLocal(stoppedDate, stoppedTime) : undefined;
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
    const nextStarted = getLocalDateTimeParts(entry.startedAt);
    const nextStopped = getLocalDateTimeParts(entry.stoppedAt);
    setStartedDate(nextStarted.date);
    setStartedTime(nextStarted.time);
    setStoppedDate(nextStopped.date);
    setStoppedTime(nextStopped.time);
    setIsEditing(true);
  };

  const detailsContent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-5 pt-4 border-t border-border/10 mt-1">
      {/* Intention */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground tracking-wide">
          <Lightbulb size={14} className="text-primary/60" />
          Intention
        </div>
        <div className="text-sm text-foreground/80 leading-relaxed pl-4 border-l border-primary/20">
          {entry.description || (
            <span className="text-muted-foreground/40 font-normal">No intention</span>
          )}
        </div>
      </div>

      {/* Reflection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground tracking-wide">
          <MessageSquare size={14} className="text-primary/60" />
          Reflection
        </div>
        <div className="text-sm text-foreground/80 leading-relaxed pl-4 border-l border-primary/20">
          {entry.comment || (
            <span className="text-muted-foreground/40 font-normal">No reflection</span>
          )}
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     Dashboard mode — compact row
     Activity name + date/time + duration only
     ═══════════════════════════════════════════ */
  if (showActivityName) {
    const dashboardContent = (
      <div className="flex items-center justify-between py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-semibold tracking-wide text-primary/80">
              {activity?.name || 'Unknown'}
            </span>
            <ChevronRight size={10} className="text-muted-foreground/30" />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <CalendarIcon size={14} className="opacity-60" />
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
      <div className="border-b border-border/40">
        <Link
          to="/activities/$activityId"
          params={{ activityId: entry.activityId }}
          className="block hover:bg-secondary/10 -mx-2 px-2 rounded-lg transition-colors duration-200"
        >
          {dashboardContent}
        </Link>
        {isStopped && showDetails && <div className="px-2">{detailsContent}</div>}
      </div>
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
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <CalendarIcon size={14} className="opacity-60" />
            {formatDate(entry.startedAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="opacity-60" />
            {formatTime(entry.startedAt)}
            {entry.stoppedAt && ` – ${formatTime(entry.stoppedAt)}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {editable && isStopped && (
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
          <RatingStars
            value={entry.rating}
            onChange={editable ? handleRatingChange : () => { }}
            disabled={!editable}
          />
          <DistractionChip count={entry.distractionCount} />
        </div>
      )}

      {/* Detail Block (Intention & Reflection) - Stopped entries only */}
      {isStopped && showDetails && detailsContent}

      {/* Line 2 alt: Intention for running entries */}
      {!isStopped && showDetails && (
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

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-4">
              <DateTimeInput
                label="Started"
                date={startedDate}
                time={startedTime}
                onDateChange={setStartedDate}
                onTimeChange={setStartedTime}
                dateId={`started-date-${entry.id}`}
                timeId={`started-time-${entry.id}`}
              />
              <DateTimeInput
                label="Stopped"
                date={stoppedDate}
                time={stoppedTime}
                onDateChange={setStoppedDate}
                onTimeChange={setStoppedTime}
                dateId={`stopped-date-${entry.id}`}
                timeId={`stopped-time-${entry.id}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground tracking-wide px-1">
                Reflection
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How did this flow session go?"
                maxLength={1000}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-200"
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-border/50">
              <div className="space-y-1">
                <span className="text-sm font-semibold text-muted-foreground tracking-wide block mb-1">
                  Distractions
                </span>
                <div className="flex items-center justify-center gap-1.5 bg-secondary/30 p-0.5 rounded-md">
                  <button
                    type="button"
                    onClick={() => setDistractionCount((c) => Math.max(0, c - 1))}
                    className="p-1 hover:bg-background rounded-md transition-colors duration-150"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-mono w-5 text-center">{distractionCount}</span>
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
                  className="text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateEntry.isPending}
                  variant="action"
                  size="sm"
                  className="text-sm"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return <div className="border-b border-border/40">{activityContent}</div>;
}
