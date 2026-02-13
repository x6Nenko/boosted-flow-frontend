import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Star, Trash2, Edit2, MessageSquare,
  Clock, Calendar as CalendarIcon, Plus, Minus, ChevronRight, ChevronDown, Lightbulb, MoreVertical,
} from 'lucide-react';
import { useUpdateTimeEntry, useDeleteTimeEntry } from '../hooks';
import { formatStoppedDuration } from './TimerDuration';
import { formatTime, formatDate, cn } from '@/lib/utils';
import { toDateTimeLocalValue, toIsoFromLocal } from '../time-entries.utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Button
          key={star}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange(star);
          }}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onMouseLeave={() => setHoverValue(null)}
          disabled={disabled}
          variant="ghost"
          size="icon-xs"
          className={cn(
            'transition-all duration-150 hover:bg-transparent disabled:opacity-100',
            !disabled && 'hover:scale-110',
            (hoverValue !== null && star <= hoverValue) || (value && star <= value)
              ? 'text-primary fill-primary'
              : 'text-muted-foreground/70 fill-transparent'
          )}
        >
          <Star size={14} strokeWidth={2} />
        </Button>
      ))}
    </div>
  );
}

function DistractionChip({ count }: { count: number }) {
  return (
    <div className="w-32 flex justify-start">
      <div className="max-w-32 flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/50 text-xs font-medium text-muted-foreground">
        <div className={cn("w-1.5 h-1.5 rounded-full", count > 0 ? "bg-destructive/60" : "bg-clean/60")} />
        <span className="truncate">
          {count} {count === 1 ? 'distraction' : 'distractions'}
        </span>
      </div>
    </div>
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
    <div>
      <Label
        htmlFor={dateId}
        className="mb-2 text-sm font-semibold text-muted-foreground tracking-wide px-1"
      >
        {label}
      </Label>
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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  const detailsId = `time-entry-details-${entry.id}`;

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
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteEntry.mutate(entry.id);
    setIsDeleteDialogOpen(false);
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

  const handleToggleDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDetailsOpen((open) => !open);
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
      <div className={cn(
        "flex items-center justify-between py-3",
        "group/row rounded-lg border border-transparent transition-all duration-200",
        "border-border/50 mb-2",
        "hover:bg-secondary/50 hover:border-border/40 px-4",
      )}>
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <div className="relative flex items-center pl-0 transition-all duration-200 ease-out group-hover:pl-4 group-focus-visible:pl-4 min-w-0 max-w-full">
              <ChevronRight
                size={14}
                className="absolute left-0 text-muted-foreground/80 opacity-0 -translate-x-2 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
              />
              <span className="text-sm font-semibold tracking-wide text-primary/80 truncate">
                {activity?.name || 'Unknown'}
              </span>
            </div>
          </div>
          <div className="flex max-[440px]:flex-col max-[440px]:items-start items-center gap-3 text-sm text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <CalendarIcon size={14} className="opacity-60" />
              {formatDate(entry.startedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="opacity-60" />
              {formatTime(entry.startedAt)} – {formatTime(entry.stoppedAt!)}
            </span>
          </div>
        </div>

        <div className="text-base font-bold font-mono tracking-tight tabular-nums text-right ml-4">
          {formatStoppedDuration(entry.startedAt, entry.stoppedAt!)}
        </div>
      </div>
    );

    return (
      <div className="border-b border-border/40">
        <Link
          to="/activities/$activityId"
          params={{ activityId: entry.activityId }}
          className="group block -mx-2 px-2 rounded-lg"
        >
          {dashboardContent}
        </Link>
        {showDetails && <div className="px-2">{detailsContent}</div>}
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
    <div className={cn(
      "group/row relative rounded-lg border border-transparent transition-all duration-200",
      "border-border/50 mb-2",
      "hover:bg-secondary/50 hover:border-border/40 px-4",
      isDetailsOpen && "bg-secondary/50 border-border/40"
    )}>
      {/* Line 1: Date/time + actions + duration */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center max-sm:py-4 py-2 gap-x-2 gap-y-2 min-[861px]:flex min-[861px]:items-center min-[861px]:justify-between min-[861px]:gap-2">
        <div className="flex max-[440px]:flex-col max-sm:mb-auto max-sm:items-start items-center gap-3 max-sm:gap-2 text-sm text-muted-foreground font-mono min-w-0 col-start-1 row-start-1 min-[861px]:col-auto min-[861px]:row-auto">
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

        <div className="flex max-[470px]:flex-col max-sm:mt-auto items-center max-sm:items-start gap-3 max-sm:gap-2 col-start-1 row-start-2 min-[861px]:ml-auto min-[861px]:col-auto min-[861px]:row-auto">
          <RatingStars
            value={entry.rating}
            onChange={editable ? handleRatingChange : () => { }}
            disabled={!editable}
          />
          <DistractionChip count={entry.distractionCount} />
        </div>

        <div className="flex mb-auto max-sm:flex-col items-center max-sm:items-end gap-2 max-sm:gap-1 col-start-2 row-start-1 row-span-2 min-[861px]:col-auto min-[861px]:row-auto">
          <div className="flex max-[360px]:flex-col items-center gap-2 max-sm:order-2 ">
            {!showDetails && (
              <Button
                type="button"
                onClick={handleToggleDetails}
                aria-expanded={isDetailsOpen}
                aria-controls={detailsId}
                title={isDetailsOpen ? 'Hide details' : 'Show details'}
                variant="ghost"
                size="icon-sm"
                className={cn(
                  '',
                  'text-muted-foreground hover:text-foreground transition-all duration-200',
                  isDetailsOpen
                    ? 'opacity-100'
                    : 'max-[860px]:opacity-100 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100'
                )}
              >
                <ChevronDown
                  size={14}
                  className={cn(
                    'transition-transform duration-200 ease-out',
                    isDetailsOpen && 'rotate-180'
                  )}
                />
              </Button>
            )}
            {editable && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      '',
                      'text-muted-foreground hover:text-foreground transition-all duration-200',
                      isDetailsOpen
                        ? 'opacity-100'
                        : 'max-[860px]:opacity-100 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100'
                    )}
                    title="More actions"
                  >
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditStart}>
                    <Edit2 size={14} className="mr-2" />
                    Edit entry
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={deleteEntry.isPending}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete entry
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="text-base font-bold font-mono tracking-tight tabular-nums text-right max-sm:order-1">
            {formatStoppedDuration(entry.startedAt, entry.stoppedAt!)}
          </div>
        </div>
      </div>

      {/* Detail Block (Intention & Reflection) */}
      {(showDetails || isDetailsOpen) && <div id={detailsId}>{detailsContent}</div>}

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete time entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this time entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-dark-destructive/80 hover:bg-dark-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

            <div>
              <Label className="mb-2 text-sm font-semibold text-muted-foreground tracking-wide px-1">
                Reflection
              </Label>
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
              <div>
                <Label className="mb-2 text-sm font-semibold text-muted-foreground tracking-wide block">
                  Distractions
                </Label>
                <div className="flex items-center justify-center gap-1.5 bg-secondary/30 p-0.5 rounded-md">
                  <Button
                    type="button"
                    onClick={() => setDistractionCount((c) => Math.max(0, c - 1))}
                    variant="ghost"
                    size="icon-xs"
                    className="hover:bg-background transition-colors duration-150"
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="text-sm font-mono w-5 text-center">{distractionCount}</span>
                  <Button
                    type="button"
                    onClick={() => setDistractionCount((c) => c + 1)}
                    variant="ghost"
                    size="icon-xs"
                    className="hover:bg-background transition-colors duration-150"
                  >
                    <Plus size={14} />
                  </Button>
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

  return <div className="">{activityContent}</div>;
}
