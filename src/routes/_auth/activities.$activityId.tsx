import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useActivity,
  useArchiveActivity,
  useDeleteActivity,
  useUnarchiveActivity,
  useUpdateActivity,
} from '@/features/activities/hooks';
import { useActivityPageHotkeys } from '@/features/hotkeys';
import {
  pomodoroStore,
  usePomodoroSettings,
  usePomodoroState,
} from '@/features/pomodoro';
import { useRegisterCommand } from '@/features/command-palette';
import { BreakTimer } from '@/features/pomodoro/components/BreakTimer';
import { PomodoroTimer } from '@/features/pomodoro/components/PomodoroTimer';
import { PomodoroSettingsModal } from '@/features/pomodoro/components/PomodoroSettingsModal';
import { TimerDuration } from '@/features/time-entries/components/TimerDuration';
import { TimeEntryList } from '@/features/time-entries/components/TimeEntryList';
import {
  useCurrentEntry,
  useCreateManualTimeEntry,
  useStartTimer,
  useStopTimer,
  useTimeEntries,
} from '@/features/time-entries/hooks';
import { toIsoFromLocal } from '@/features/time-entries/time-entries.utils';
import { getDateRangeForDays } from '@/features/analytics';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Plus, Minus, Timer, RotateCcw, Settings2, Edit3, Archive, Trash2, ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
import { setAppTitle } from '@/lib/page-title';

type TimerMode = 'stopwatch' | 'pomodoro';

const PERIOD_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom Range' },
] as const;

export const Route = createFileRoute('/_auth/activities/$activityId')({
  component: ActivityPage,
});

function ActivityPage() {
  const { activityId } = Route.useParams();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [distractionCount, setDistractionCount] = useState(0);
  const [timerMode, setTimerMode] = useState<TimerMode>(() => {
    const stored = localStorage.getItem(`timerMode-${activityId}`);
    return (stored === 'pomodoro' ? 'pomodoro' : 'stopwatch') as TimerMode;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [period, setPeriod] = useState('7');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createIntention, setCreateIntention] = useState('');
  const [createDistractionCount, setCreateDistractionCount] = useState(0);
  const [createStartedDate, setCreateStartedDate] = useState<Date | undefined>(new Date());
  const [createStartedTime, setCreateStartedTime] = useState('');
  const [createStoppedDate, setCreateStoppedDate] = useState<Date | undefined>(new Date());
  const [createStoppedTime, setCreateStoppedTime] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const intentionInputRef = useRef<HTMLInputElement>(null);

  // Parse dates for Calendar component
  const customFromDate = customFrom ? new Date(customFrom) : undefined;
  const customToDate = customTo ? new Date(customTo) : undefined;

  const pomodoroSettings = usePomodoroSettings();
  const pomodoroState = usePomodoroState();
  const isInBreakPhase = pomodoroState.phase !== 'work';

  // Load activity-specific pomodoro state
  useEffect(() => {
    pomodoroStore.setActivity(activityId);
  }, [activityId]);

  useEffect(() => {
    localStorage.setItem(`timerMode-${activityId}`, timerMode);
  }, [timerMode, activityId]);

  const { data: activity, isLoading: activityLoading } = useActivity(activityId);

  useEffect(() => {
    if (activity?.name) {
      setAppTitle(activity.name);
    }
  }, [activity?.name]);

  const { data: currentData } = useCurrentEntry();
  const dateRange =
    period === 'custom'
      ? (customFrom && customTo ? { from: customFrom, to: customTo } : undefined)
      : period !== 'all'
        ? getDateRangeForDays(Number(period))
        : undefined;
  const { data: entries, isLoading: entriesLoading } = useTimeEntries({
    activityId,
    from: dateRange?.from,
    to: dateRange?.to + 'T23:59:59',
  });
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const createManual = useCreateManualTimeEntry();

  const updateActivity = useUpdateActivity();
  const archiveActivity = useArchiveActivity();
  const unarchiveActivity = useUnarchiveActivity();
  const deleteActivity = useDeleteActivity();

  const currentEntry = currentData?.entry ?? null;
  const isRunningThisActivity = currentEntry?.activityId === activityId;
  const isRunningOther = !!currentEntry && !isRunningThisActivity;
  const hasAnyActiveBreak = pomodoroStore.hasActiveBreak();
  const isArchived = !!activity?.archivedAt;
  const isBreakActive = pomodoroState.isBreakActive && !!pomodoroState.breakStartedAt;
  const isModeControlsDisabled = isRunningThisActivity || hasAnyActiveBreak;
  const canSetIntention =
    !isArchived &&
    !isRunningThisActivity &&
    !isRunningOther &&
    !hasAnyActiveBreak &&
    pomodoroState.phase === 'work';

  const handleStart = useCallback(() => {
    if (timerMode === 'pomodoro') {
      pomodoroStore.startWorkSession();
    }
    setDistractionCount(0);
    startTimer.mutate(
      {
        activityId,
        description: description.trim() || undefined,
      },
      { onSuccess: () => setDescription('') }
    );
  }, [timerMode, startTimer, activityId, description]);

  const handleStopTimer = () => {
    if (startTimer.isPending) return;
    if (currentEntry) {
      if (timerMode === 'pomodoro') {
        pomodoroStore.completeWorkSession();
      }
      stopTimer.mutate({
        id: currentEntry.id,
        distractionCount: distractionCount > 0 ? distractionCount : undefined,
      });
    }
  };

  const handleToggleTimer = useCallback(() => {
    if (isArchived || isRunningOther || hasAnyActiveBreak) return;
    if (startTimer.isPending) return;
    if (isRunningThisActivity) {
      if (currentEntry) {
        if (timerMode === 'pomodoro') {
          pomodoroStore.completeWorkSession();
        }
        stopTimer.mutate({
          id: currentEntry.id,
          distractionCount: distractionCount > 0 ? distractionCount : undefined,
        });
      }
    } else if (pomodoroState.phase === 'work') {
      if (timerMode === 'pomodoro') {
        pomodoroStore.startWorkSession();
      }
      setDistractionCount(0);
      startTimer.mutate({ activityId, description: description.trim() || undefined });
    }
  }, [isArchived, isRunningOther, hasAnyActiveBreak, isRunningThisActivity, pomodoroState.phase, currentEntry, timerMode, distractionCount, activityId, description, startTimer, stopTimer]);

  const handleAddDistraction = useCallback(() => {
    if (isRunningThisActivity) {
      setDistractionCount((c) => c + 1);
    }
  }, [isRunningThisActivity]);

  const handleToggleTimerMode = useCallback(() => {
    setTimerMode((mode) => (mode === 'stopwatch' ? 'pomodoro' : 'stopwatch'));
  }, []);

  const handleOpenPomodoroSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const startStopCommand = useMemo(
    () => ({
      id: 'timer.startStop',
      group: 'Timer',
      label: 'Start/Stop Timer',
      shortcut: 'Space',
      run: handleToggleTimer,
    }),
    [handleToggleTimer]
  );

  const toggleModeCommand = useMemo(
    () => ({
      id: 'timer.toggleMode',
      group: 'Timer',
      label: 'Toggle Pomodoro/Stopwatch',
      run: handleToggleTimerMode,
    }),
    [handleToggleTimerMode]
  );

  const addDistractionCommand = useMemo(
    () => ({
      id: 'timer.addDistraction',
      group: 'Timer',
      label: 'Add Distraction',
      shortcut: 'Shift + D',
      run: handleAddDistraction,
    }),
    [handleAddDistraction]
  );

  const intentionCommand = useMemo(
    () => ({
      id: 'timer.intention',
      group: 'Timer',
      label: 'Start timer with intention',
      run: () => intentionInputRef.current?.focus(),
    }),
    []
  );

  const skipBreakCommand = useMemo(
    () => ({
      id: 'timer.skipBreak',
      group: 'Timer',
      label: 'Skip Break',
      run: () => pomodoroStore.completeBreak(),
    }),
    []
  );

  const startBreakCommand = useMemo(
    () => ({
      id: 'timer.startBreak',
      group: 'Timer',
      label: 'Start Break',
      run: () => pomodoroStore.startBreak(),
    }),
    []
  );

  const resetPomodoroCommand = useMemo(
    () => ({
      id: 'timer.resetPomodoro',
      group: 'Timer',
      label: 'Reset Pomodoro Phase',
      run: () => pomodoroStore.resetState(),
    }),
    []
  );

  const pomodoroSettingsCommand = useMemo(
    () => ({
      id: 'timer.settings',
      group: 'Timer',
      label: 'Pomodoro Settings',
      run: handleOpenPomodoroSettings,
    }),
    [handleOpenPomodoroSettings]
  );

  useRegisterCommand(startStopCommand);
  useRegisterCommand(toggleModeCommand);
  useRegisterCommand(addDistractionCommand);
  useRegisterCommand(canSetIntention ? intentionCommand : null);
  useRegisterCommand(isInBreakPhase ? skipBreakCommand : null);
  useRegisterCommand(isInBreakPhase && !isBreakActive ? startBreakCommand : null);
  useRegisterCommand(pomodoroSettingsCommand);
  useRegisterCommand(resetPomodoroCommand);

  useActivityPageHotkeys({
    onStartStop: handleToggleTimer,
    onAddDistraction: handleAddDistraction,
  });

  const handlePomodoroComplete = () => {
    if (currentEntry) {
      pomodoroStore.completeWorkSession();
      stopTimer.mutate({
        id: currentEntry.id,
        distractionCount: distractionCount > 0 ? distractionCount : undefined,
      });
    }
  };

  const handleStartBreak = () => {
    pomodoroStore.startBreak();
  };

  const handleSkipBreak = () => {
    pomodoroStore.completeBreak();
  };

  const handleResetPomodoro = () => {
    pomodoroStore.resetState();
  };

  const handleEditStart = () => {
    if (activity) {
      setEditName(activity.name);
      setIsEditing(true);
    }
  };

  const handleEditSave = () => {
    if (!editName.trim()) return;
    updateActivity.mutate(
      { id: activityId, data: { name: editName.trim() } },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleArchive = () => {
    archiveActivity.mutate(activityId);
  };

  const handleUnarchive = () => {
    unarchiveActivity.mutate(activityId);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteActivity.mutate(activityId, {
      onSuccess: () => navigate({ to: '/activities' }),
    });
    setIsDeleteDialogOpen(false);
  };

  if (activityLoading) {
    return (
      <div className="py-8">
        <Skeleton className="h-4 w-32 mb-6" />
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-md" />
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card max-sm:p-4 p-6">
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="py-8">
        <p className="text-sm text-muted-foreground">Activity not found</p>
        <Link to="/activities" className="text-sm text-primary hover:text-primary/80">
          ← Back to activities
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <Link
          to="/activities"
          className="group w-fit flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-foreground" />
          <span>Back to activities</span>
        </Link>
      </div>

      {/* Activity Header */}
      <div className="mb-6">
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={255}
              className="flex-1"
              autoFocus
            />
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={!editName.trim() || updateActivity.isPending}
            >
              Save
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{activity.name}</h1>
            {isArchived && (
              <span className="ml-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-500">
                Archived
              </span>
            )}
          </div>
        )}
      </div>

      {/* Activity Actions */}
      {!isEditing && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            onClick={handleEditStart}
            variant="outline"
            size="sm"
            className='h-7 px-3 text-xs font-medium flex items-center gap-1.5'
          >
            <Edit3 />
            Edit
          </Button>
          {isArchived ? (
            <Button
              onClick={handleUnarchive}
              disabled={unarchiveActivity.isPending}
              variant="outline"
              size="sm"
              className='h-7 px-3 text-xs font-medium flex items-center gap-1.5'
            >
              <Archive />
              Unarchive
            </Button>
          ) : (
            <Button
              onClick={handleArchive}
              disabled={archiveActivity.isPending || isRunningThisActivity || hasAnyActiveBreak}
              variant="outline"
              size="sm"
              className='h-7 px-3 text-xs font-medium flex items-center gap-1.5'
            >
              <Archive />
              Archive
            </Button>
          )}
          <Button
            onClick={handleDelete}
            disabled={deleteActivity.isPending || isRunningThisActivity || hasAnyActiveBreak}
            variant="destructive"
            size="sm"
            className='h-7 px-3 text-xs font-medium flex items-center gap-1.5'
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      )}

      {/* Timer Control */}
      <div className="bg-card border border-border rounded-xl p-1 shadow-sm mb-6">
        <div className="bg-background/30 rounded-lg border border-border/50 max-sm:p-4 p-6 relative overflow-hidden">
          <div
            className={cn(
              'absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-primary/10 blur-3xl pointer-events-none transition-opacity duration-500',
              isRunningThisActivity ? 'opacity-100' : 'opacity-0'
            )}
          />
          <div
            className={cn(
              'absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-clean/10 blur-3xl pointer-events-none transition-opacity duration-500',
              pomodoroState.isBreakActive ? 'opacity-100' : 'opacity-0'
            )}
          />

          <div className="relative z-10">
            {isArchived ? (
              <p className="text-sm text-muted-foreground">
                This activity is archived. Unarchive it to track time.
              </p>
            ) : isRunningOther ? (
              <p className="text-sm text-muted-foreground">
                Timer is running on another activity. Stop it first to start tracking here.
              </p>
            ) : (
              <>
                <div className="mb-8 flex max-sm:flex-col max-sm:gap-2 items-center justify-between">
                  <div className={cn("flex gap-0.5 bg-background rounded-md border border-border p-0.5", isModeControlsDisabled && "opacity-100")}>
                    <Button
                      onClick={() => setTimerMode('stopwatch')}
                      variant="ghost"
                      size="sm"
                      disabled={isModeControlsDisabled}
                      className={cn(
                        "h-7 px-3 text-xs font-medium flex items-center gap-1.5",
                        timerMode === 'stopwatch' && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Timer size={14} /> Stopwatch
                    </Button>
                    <Button
                      onClick={() => setTimerMode('pomodoro')}
                      variant="ghost"
                      size="sm"
                      disabled={isModeControlsDisabled}
                      className={cn(
                        "h-7 px-3 text-xs font-medium flex items-center gap-1.5",
                        timerMode === 'pomodoro' && "bg-accent text-accent-foreground"
                      )}
                    >
                      <RotateCcw size={14} /> Pomodoro
                    </Button>
                  </div>

                  {timerMode === 'pomodoro' && (
                    <div className={cn("flex items-center text-xs text-muted-foreground border border-border rounded-md px-3 py-1 bg-background gap-2", isModeControlsDisabled && "opacity-100")}>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Session {pomodoroState.currentSession}
                        {pomodoroState.currentSession > 1 && (
                          <Button
                            onClick={handleResetPomodoro}
                            variant="ghost"
                            size="icon-xs"
                            disabled={isModeControlsDisabled}
                            className="h-5 w-5 p-0 hover:text-foreground"
                            title="Reset to Session 1"
                          >
                            <RotateCcw size={14} />
                          </Button>
                        )}
                      </span>
                      <span className="w-px h-3 bg-border" />
                      <span>{pomodoroSettings.workDuration}m / {pomodoroSettings.shortBreakDuration}m</span>
                      <Button
                        onClick={handleOpenPomodoroSettings}
                        variant="ghost"
                        size="icon-xs"
                        disabled={isModeControlsDisabled}
                        className="h-5 w-5 p-0 hover:text-foreground"
                        title="Pomodoro Settings"
                      >
                        <Settings2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>

                {timerMode === 'pomodoro' && pomodoroState.phase !== 'work' ? (
                  <div>
                    {/* Break timer */}
                    <div className="text-6xl font-mono font-medium tracking-tighter tabular-nums text-center mb-4">
                      {pomodoroState.isBreakActive && pomodoroState.breakStartedAt ? (
                        <span className="text-clean">
                          <BreakTimer
                            startedAt={pomodoroState.breakStartedAt}
                            durationMinutes={pomodoroStore.getCurrentBreakDuration()}
                            onComplete={handleSkipBreak}
                          />
                        </span>
                      ) : (
                        (() => {
                          const duration = pomodoroState.phase === 'long-break'
                            ? pomodoroSettings.longBreakDuration
                            : pomodoroSettings.shortBreakDuration;
                          const hours = Math.floor(duration / 60);
                          const minutes = duration % 60;
                          return (
                            <span className="text-muted-foreground/30">
                              {hours > 0 && `${hours.toString().padStart(2, '0')}:`}
                              {minutes.toString().padStart(2, '0')}:00
                            </span>
                          );
                        })()
                      )}
                    </div>

                    {/* Break controls */}
                    {pomodoroState.isBreakActive && pomodoroState.breakStartedAt ? (
                      <Button
                        onClick={handleSkipBreak}
                        variant="outline"
                        className="w-full"
                      >
                        Skip Break
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleStartBreak}
                          variant="success"
                          className="w-full"
                        >
                          Start Break
                        </Button>
                        <div className="mt-4">
                          <Button
                            onClick={handleSkipBreak}
                            variant="outline"
                            className="w-full"
                          >
                            Skip Break
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : hasAnyActiveBreak ? (
                  <p className="text-sm text-muted-foreground">
                    Break is active on another activity. Complete or skip it first to start tracking here.
                  </p>
                ) : (
                  <>
                    {/* Timer */}
                    <div className="text-6xl max-[370px]:text-5xl font-mono font-medium tracking-tighter text-foreground mb-8 tabular-nums text-center">
                      {timerMode === 'pomodoro' ? (
                        <PomodoroTimer
                          startedAt={isRunningThisActivity ? currentEntry?.startedAt : undefined}
                          durationMinutes={pomodoroSettings.workDuration}
                          onComplete={handlePomodoroComplete}
                        />
                      ) : (
                        <TimerDuration startedAt={isRunningThisActivity ? currentEntry?.startedAt : undefined} />
                      )}
                    </div>

                    {/* Controls */}
                    {isRunningThisActivity ? (
                      <>
                        <Button
                          onClick={handleStopTimer}
                          disabled={stopTimer.isPending || startTimer.isPending}
                          variant="destructive"
                          className="w-full"
                        >
                          {startTimer.isPending ? 'Starting...' : stopTimer.isPending ? 'Stopping...' : 'Stop'}
                        </Button>
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <Button
                            onClick={() => setDistractionCount((c) => c + 1)}
                            variant="outline"
                            className='w-full'
                          >
                            {distractionCount === 0
                              ? "I got distracted"
                              : `I got distracted (${distractionCount} ${distractionCount === 1 ? "time" : "times"})`}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-4">
                          <Input
                            ref={intentionInputRef}
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleStart();
                              }
                            }}
                            placeholder="What are your intention? (optional)"
                            maxLength={500}
                            className='text-center focus:placeholder-transparent'
                          />
                        </div>

                        <Button
                          onClick={handleStart}
                          disabled={startTimer.isPending}
                          className="w-full"
                        >
                          {startTimer.isPending
                            ? 'Starting...'
                            : timerMode === 'pomodoro'
                              ? 'Start Pomodoro Session'
                              : 'Start Tracking'}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <PomodoroSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Entries List */}
      <div className="rounded-xl border border-border bg-card max-sm:p-4 p-6">
        <div className="mb-4 flex max-sm:flex-col gap-y-4 items-center justify-between">
          <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-between sm:mr-auto">
            <h2 className="text-base font-semibold text-foreground">History</h2>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              variant="ghost"
              size="icon-sm"
              className="text-primary hover:text-primary/80 hover:bg-primary/10"
              title="Add time entry"
            >
              <Plus size={16} />
            </Button>
          </div>
          <div className="flex items-center gap-4 max-sm:w-full max-sm:flex-col">
            <div className="flex max-sm:mr-auto items-center gap-2">
              <Checkbox
                id="show-details-history"
                checked={showDetails}
                onCheckedChange={(checked) => setShowDetails(checked === true)}
              />
              <Label htmlFor="show-details-history" className="text-sm text-muted-foreground">
                Show details
              </Label>
            </div>
            <Select
              value={period}
              onValueChange={(value) => {
                if (value === 'custom' && !customFrom && !customTo) {
                  const range = getDateRangeForDays(7);
                  setCustomFrom(range.from);
                  setCustomTo(range.to);
                }
                setPeriod(value);
              }}
            >
              <SelectTrigger className="w-[180px] max-sm:w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {period === 'custom' && (
          <div className="mb-4 flex max-sm:flex-col gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[200px] max-sm:w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customFromDate ? format(customFromDate, 'PPP') : <span>From date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customFromDate}
                  onSelect={(date) => setCustomFrom(date ? format(date, 'yyyy-MM-dd') : '')}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[200px] max-sm:w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customToDate ? format(customToDate, 'PPP') : <span>To date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customToDate}
                  onSelect={(date) => setCustomTo(date ? format(date, 'yyyy-MM-dd') : '')}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
        {entriesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : entries && entries.length > 0 ? (
          <TimeEntryList
            entries={entries}
            editable
            showDetails={showDetails}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No time entries yet.</p>
        )}
      </div>

      {/* Create Time Entry Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Time Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="create-started-date" className="mb-2 text-sm font-semibold text-muted-foreground tracking-wide px-1">
                  Started
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" id="create-started-date" className="h-8 flex-1 justify-start text-sm font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {createStartedDate ? format(createStartedDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={createStartedDate} defaultMonth={createStartedDate} onSelect={setCreateStartedDate} />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    id="create-started-time"
                    step="1"
                    value={createStartedTime}
                    onChange={(e) => setCreateStartedTime(e.target.value)}
                    className="h-8 w-fit text-sm bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="create-stopped-date" className="mb-2 text-sm font-semibold text-muted-foreground tracking-wide px-1">
                  Stopped
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" id="create-stopped-date" className="h-8 flex-1 justify-start text-sm font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {createStoppedDate ? format(createStoppedDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={createStoppedDate} defaultMonth={createStoppedDate} onSelect={setCreateStoppedDate} />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    id="create-stopped-time"
                    step="1"
                    value={createStoppedTime}
                    onChange={(e) => setCreateStoppedTime(e.target.value)}
                    className="h-8 w-fit text-sm bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-2 text-sm font-semibold text-muted-foreground tracking-wide px-1">
                Intention
              </Label>
              <textarea
                value={createIntention}
                onChange={(e) => setCreateIntention(e.target.value)}
                placeholder="What do you plan to accomplish?"
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
                    onClick={() => setCreateDistractionCount((c) => Math.max(0, c - 1))}
                    variant="ghost"
                    size="icon-xs"
                    className="hover:bg-background transition-colors duration-150"
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="text-sm font-mono w-5 text-center">{createDistractionCount}</span>
                  <Button
                    type="button"
                    onClick={() => setCreateDistractionCount((c) => c + 1)}
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
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setCreateIntention('');
                    setCreateDistractionCount(0);
                    setCreateStartedDate(new Date());
                    setCreateStartedTime('');
                    setCreateStoppedDate(new Date());
                    setCreateStoppedTime('');
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!createStartedDate || !createStartedTime || !createStoppedDate || !createStoppedTime) return;
                    const startedAtLocal = `${format(createStartedDate, 'yyyy-MM-dd')}T${createStartedTime}`;
                    const stoppedAtLocal = `${format(createStoppedDate, 'yyyy-MM-dd')}T${createStoppedTime}`;
                    const startedAtIso = toIsoFromLocal(startedAtLocal);
                    const stoppedAtIso = toIsoFromLocal(stoppedAtLocal);
                    if (!startedAtIso || !stoppedAtIso) return;
                    createManual.mutate(
                      {
                        activityId,
                        startedAt: startedAtIso,
                        stoppedAt: stoppedAtIso,
                        description: createIntention || undefined,
                        distractionCount: createDistractionCount > 0 ? createDistractionCount : undefined,
                      },
                      {
                        onSuccess: () => {
                          setCreateDialogOpen(false);
                          setCreateIntention('');
                          setCreateDistractionCount(0);
                          setCreateStartedDate(new Date());
                          setCreateStartedTime('');
                          setCreateStoppedDate(new Date());
                          setCreateStoppedTime('');
                        },
                      }
                    );
                  }}
                  disabled={createManual.isPending || !createStartedDate || !createStartedTime || !createStoppedDate || !createStoppedTime}
                  variant="action"
                  size="sm"
                  className="text-sm"
                >
                  {createManual.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Activity Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this activity and all its time entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="border border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 bg-transparent"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
