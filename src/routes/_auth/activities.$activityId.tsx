import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { TimeEntryRow } from '@/features/time-entries/components/TimeEntryRow';
import {
  useCurrentEntry,
  useCreateManualTimeEntry,
  useStartTimer,
  useStopTimer,
  useTimeEntries,
} from '@/features/time-entries/hooks';
import { manualEntrySchema, type ManualEntryFormData } from '@/features/time-entries/time-entries.schema';
import { toIsoFromLocal } from '@/features/time-entries/time-entries.utils';
import { getDateRangeForDays } from '@/features/analytics';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

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
  const [manualOpen, setManualOpen] = useState(false);
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
  const {
    register: registerManualField,
    handleSubmit: handleManualSubmit,
    reset: resetManualForm,
    formState: { errors: manualErrors, isSubmitting: isManualSubmitting },
  } = useForm<ManualEntryFormData>({
    resolver: zodResolver(manualEntrySchema),
  });

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
    if (confirm('Delete this activity and all its time entries? This cannot be undone.')) {
      deleteActivity.mutate(activityId, {
        onSuccess: () => navigate({ to: '/activities' }),
      });
    }
  };

  const onManualSubmit = (data: ManualEntryFormData) => {
    const startedAtIso = toIsoFromLocal(data.startedAt);
    const stoppedAtIso = toIsoFromLocal(data.stoppedAt);
    if (!startedAtIso || !stoppedAtIso) return;
    createManual.mutate(
      {
        activityId,
        startedAt: startedAtIso,
        stoppedAt: stoppedAtIso,
        description: data.description?.trim() || undefined,
      },
      {
        onSuccess: () => {
          resetManualForm();
          setManualOpen(false);
        },
      }
    );
  };

  const manualApiErrorMessage =
    createManual.error instanceof ApiError
      ? (createManual.error.data as { message?: string })?.message || 'Failed to save entry'
      : createManual.error?.message;

  if (activityLoading) {
    return (
      <div className="py-8">
        <p className="text-sm text-muted-foreground">Loading...</p>
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
        <Link to="/activities" className="text-sm text-primary hover:text-primary/80">
          ← Activities
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
            />
            <Button
              onClick={handleEditSave}
              disabled={!editName.trim() || updateActivity.isPending}
            >
              Save
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{activity.name}</h1>
            {isArchived && (
              <span className="text-xs text-muted-foreground">(archived)</span>
            )}
          </div>
        )}
      </div>

      {/* Activity Actions */}
      {!isEditing && (
        <div className="mb-6 flex gap-2">
          <Button
            onClick={handleEditStart}
            variant="outline"
            size="sm"
          >
            Edit
          </Button>
          {isArchived ? (
            <Button
              onClick={handleUnarchive}
              disabled={unarchiveActivity.isPending}
              variant="outline"
              size="sm"
            >
              Unarchive
            </Button>
          ) : (
            <Button
              onClick={handleArchive}
              disabled={archiveActivity.isPending || isRunningThisActivity || hasAnyActiveBreak}
              variant="outline"
              size="sm"
            >
              Archive
            </Button>
          )}
          <Button
            onClick={handleDelete}
            disabled={deleteActivity.isPending || isRunningThisActivity || hasAnyActiveBreak}
            variant="destructive"
            size="sm"
          >
            Delete
          </Button>
        </div>
      )}

      {/* Timer Control */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        {isArchived ? (
          <p className="text-sm text-muted-foreground">
            This activity is archived. Unarchive it to track time.
          </p>
        ) : isRunningThisActivity ? (
          <>
            <div className="mb-4">
              {timerMode === 'pomodoro' && (
                <p className="text-xs text-muted-foreground mb-1">
                  Session {pomodoroState.currentSession} of {pomodoroSettings.sessionsBeforeLongBreak}
                </p>
              )}
              {currentEntry.description && (
                <p className="text-sm text-muted-foreground">{currentEntry.description}</p>
              )}
            </div>
            <div className="mb-4 text-center">
              <span className="text-4xl font-mono text-primary timer-nums">
                {timerMode === 'pomodoro' ? (
                  <PomodoroTimer
                    startedAt={currentEntry.startedAt}
                    durationMinutes={pomodoroSettings.workDuration}
                    onComplete={handlePomodoroComplete}
                  />
                ) : (
                  <TimerDuration startedAt={currentEntry.startedAt} />
                )}
              </span>
            </div>
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
                size="sm"
              >
                + Distraction
              </Button>
              {distractionCount > 0 && (
                <span className="text-sm text-muted-foreground">{distractionCount}</span>
              )}
            </div>
          </>
        ) : isRunningOther ? (
          <p className="text-sm text-muted-foreground">
            Timer is running on another activity. Stop it first to start tracking here.
          </p>
        ) : timerMode === 'pomodoro' && pomodoroState.phase !== 'work' ? (
          // Break phase UI
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Completed: Session {pomodoroState.currentSession} of {pomodoroSettings.sessionsBeforeLongBreak}
            </p>
            <p className="text-sm text-foreground mb-3">
              {pomodoroState.phase === 'long-break' ? 'Long break' : 'Short break'} time!
            </p>
            {pomodoroState.isBreakActive && pomodoroState.breakStartedAt ? (
              <div className="mb-4 text-center">
                <span className="text-4xl font-mono text-green-600 timer-nums">
                  <BreakTimer
                    startedAt={pomodoroState.breakStartedAt}
                    durationMinutes={pomodoroStore.getCurrentBreakDuration()}
                    onComplete={handleSkipBreak}
                  />
                </span>
                <Button
                  onClick={handleSkipBreak}
                  variant="outline"
                  className="mt-4 w-full"
                >
                  Skip Break
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleStartBreak}
                  className="flex-1 bg-green-600 hover:bg-green-500"
                >
                  Start Break
                </Button>
                <Button
                  onClick={handleSkipBreak}
                  variant="outline"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleResetPomodoro}
                  variant="outline"
                >
                  Reset
                </Button>
              </div>
            )}
          </div>
        ) : hasAnyActiveBreak ? (
          <p className="text-sm text-muted-foreground">
            Break is active on another activity. Complete or skip it first to start tracking here.
          </p>
        ) : (
          <>
            {/* Mode toggle */}
            <div className="mb-4 flex gap-1">
              <Button
                onClick={() => setTimerMode('stopwatch')}
                variant={timerMode === 'stopwatch' ? 'secondary' : 'ghost'}
                className="flex-1"
                size="sm"
              >
                Stopwatch
              </Button>
              <Button
                onClick={() => setTimerMode('pomodoro')}
                variant={timerMode === 'pomodoro' ? 'secondary' : 'ghost'}
                className="flex-1"
                size="sm"
              >
                Pomodoro
              </Button>
            </div>

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
              />
            </div>

            {/* Pomodoro settings preview */}
            {timerMode === 'pomodoro' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-muted-foreground">
                    Next: Session {pomodoroState.currentSession} of {pomodoroSettings.sessionsBeforeLongBreak}
                  </p>
                  {pomodoroState.currentSession > 1 && (
                    <button
                      onClick={handleResetPomodoro}
                      className="text-xs text-muted-foreground hover:text-foreground"
                      title="Reset to Session 1"
                    >
                      ↺
                    </button>
                  )}
                </div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {pomodoroSettings.workDuration}m focus • {pomodoroSettings.shortBreakDuration}m short • {pomodoroSettings.longBreakDuration}m long • {pomodoroSettings.sessionsBeforeLongBreak} sessions
                  </p>
                  <button
                    onClick={handleOpenPomodoroSettings}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Settings"
                  >
                    ⚙
                  </button>
                </div>
              </>
            )}

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
      </div>

      <PomodoroSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Manual Entry */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Manual entry</h2>
          <button
            onClick={() => setManualOpen((open) => !open)}
            className="text-sm text-primary hover:text-primary/80"
          >
            {manualOpen ? 'Close' : 'Add'}
          </button>
        </div>
        {manualOpen && (
          <form className="mt-4 space-y-3" onSubmit={handleManualSubmit(onManualSubmit)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                Started at
                <Input
                  type="datetime-local"
                  {...registerManualField('startedAt')}
                  className="mt-2"
                />
                {manualErrors.startedAt && (
                  <p className="mt-1 text-xs text-destructive">{manualErrors.startedAt.message}</p>
                )}
              </label>
              <label className="text-xs text-muted-foreground">
                Stopped at
                <Input
                  type="datetime-local"
                  {...registerManualField('stoppedAt')}
                  className="mt-2"
                />
                {manualErrors.stoppedAt && (
                  <p className="mt-1 text-xs text-destructive">{manualErrors.stoppedAt.message}</p>
                )}
              </label>
            </div>
            <div>
              <Input
                type="text"
                placeholder="Description (optional)"
                maxLength={500}
                {...registerManualField('description')}
              />
              {manualErrors.description && (
                <p className="mt-1 text-xs text-destructive">{manualErrors.description.message}</p>
              )}
            </div>
            {manualApiErrorMessage && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">
                <p className="text-xs text-destructive">{manualApiErrorMessage}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={
                  isManualSubmitting ||
                  createManual.isPending ||
                  isArchived ||
                  isRunningThisActivity ||
                  isRunningOther ||
                  hasAnyActiveBreak
                }
                size="sm"
              >
                {createManual.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  resetManualForm();
                  setManualOpen(false);
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
            {(isArchived || isRunningThisActivity || isRunningOther || hasAnyActiveBreak) && (
              <p className="text-xs text-muted-foreground">
                Manual entry is disabled while archived, another timer is running, or a break is active.
              </p>
            )}
          </form>
        )}
      </div>

      {/* Entries List */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">History</h2>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
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
        {period === 'custom' && (
          <div className="mb-4 flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[200px] justify-start text-left font-normal"
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
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[200px] justify-start text-left font-normal"
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
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
        {entriesLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : entries && entries.length > 0 ? (
          <div>
            {entries.map((entry) => (
              <TimeEntryRow key={entry.id} entry={entry} editable />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No time entries yet.</p>
        )}
      </div>
    </div>
  );
}
