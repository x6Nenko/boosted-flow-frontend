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
import { TimeEntryRow } from '@/features/time-entries/components/TimeEntryRow';
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
import { CalendarIcon, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

      {/* Entries List */}
      <div className="rounded-xl border border-border bg-card p-6">
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
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : entries && entries.length > 0 ? (
          <div>
            {entries
              .filter((entry) => entry.stoppedAt)
              .map((entry) => (
                <TimeEntryRow
                  key={entry.id}
                  entry={entry}
                  editable
                  showDetails={showDetails}
                />
              ))}
          </div>
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
    </div>
  );
}
