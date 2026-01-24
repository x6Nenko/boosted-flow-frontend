import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  useActivity,
  useArchiveActivity,
  useDeleteActivity,
  useUnarchiveActivity,
  useUpdateActivity,
} from '@/features/activities/hooks';
import {
  pomodoroStore,
  usePomodoroSettings,
  usePomodoroState,
} from '@/features/pomodoro';
import { BreakTimer } from '@/features/pomodoro/components/BreakTimer';
import { PomodoroTimer } from '@/features/pomodoro/components/PomodoroTimer';
import { PomodoroSettingsModal } from '@/features/pomodoro/components/PomodoroSettingsModal';
import { TimerDuration } from '@/features/time-entries/components/TimerDuration';
import { TimeEntryRow } from '@/features/time-entries/components/TimeEntryRow';
import {
  useCurrentEntry,
  useStartTimer,
  useStopTimer,
  useTimeEntries,
} from '@/features/time-entries/hooks';
import { getDateRangeForDays } from '@/features/analytics';

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

  const pomodoroSettings = usePomodoroSettings();
  const pomodoroState = usePomodoroState();

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
  const updateActivity = useUpdateActivity();
  const archiveActivity = useArchiveActivity();
  const unarchiveActivity = useUnarchiveActivity();
  const deleteActivity = useDeleteActivity();

  const currentEntry = currentData?.entry ?? null;
  const isRunningThisActivity = currentEntry?.activityId === activityId;
  const isRunningOther = !!currentEntry && !isRunningThisActivity;
  const hasAnyActiveBreak = pomodoroStore.hasActiveBreak();
  const isArchived = !!activity?.archivedAt;

  const handleStart = () => {
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
  };

  const handleStop = () => {
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
      <div className="p-4">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Activity not found</p>
        <Link to="/activities" className="text-sm text-indigo-600 hover:text-indigo-500">
          ← Back to activities
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link to="/activities" className="text-sm text-indigo-600 hover:text-indigo-500">
          ← Activities
        </Link>
      </div>

      {/* Activity Header */}
      <div className="mb-4">
        {isEditing ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={255}
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleEditSave}
              disabled={!editName.trim() || updateActivity.isPending}
              className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{activity.name}</h1>
            {isArchived && (
              <span className="text-xs text-gray-500">(archived)</span>
            )}
          </div>
        )}
      </div>

      {/* Activity Actions */}
      {!isEditing && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={handleEditStart}
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
          >
            Edit
          </button>
          {isArchived ? (
            <button
              onClick={handleUnarchive}
              disabled={unarchiveActivity.isPending}
              className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Unarchive
            </button>
          ) : (
            <button
              onClick={handleArchive}
              disabled={archiveActivity.isPending || isRunningThisActivity || hasAnyActiveBreak}
              className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Archive
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleteActivity.isPending || isRunningThisActivity || hasAnyActiveBreak}
            className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}

      {/* Timer Control */}
      <div className="rounded border border-gray-200 bg-white p-4 mb-4">
        {isArchived ? (
          <p className="text-sm text-gray-500">
            This activity is archived. Unarchive it to track time.
          </p>
        ) : isRunningThisActivity ? (
          <>
            <div className="mb-3">
              {timerMode === 'pomodoro' && (
                <p className="text-xs text-gray-400 mb-1">
                  Session {pomodoroState.currentSession} of {pomodoroSettings.sessionsBeforeLongBreak}
                </p>
              )}
              {currentEntry.description && (
                <p className="text-sm text-gray-500">{currentEntry.description}</p>
              )}
            </div>
            <div className="mb-3 text-center">
              <span className="text-3xl font-mono text-indigo-600">
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
            <button
              onClick={handleStop}
              disabled={stopTimer.isPending}
              className="w-full rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {stopTimer.isPending ? 'Stopping...' : 'Stop'}
            </button>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={() => setDistractionCount((c) => c + 1)}
                className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
              >
                + Distraction
              </button>
              {distractionCount > 0 && (
                <span className="text-sm text-gray-500">{distractionCount}</span>
              )}
            </div>
          </>
        ) : isRunningOther ? (
          <p className="text-sm text-gray-500">
            Timer is running on another activity. Stop it first to start tracking here.
          </p>
        ) : timerMode === 'pomodoro' && pomodoroState.phase !== 'work' ? (
          // Break phase UI
          <div>
            <p className="text-xs text-gray-400 mb-1">
              Completed: Session {pomodoroState.currentSession} of {pomodoroSettings.sessionsBeforeLongBreak}
            </p>
            <p className="text-sm text-gray-700 mb-2">
              {pomodoroState.phase === 'long-break' ? 'Long break' : 'Short break'} time!
            </p>
            {pomodoroState.isBreakActive && pomodoroState.breakStartedAt ? (
              <div className="mb-3 text-center">
                <span className="text-3xl font-mono text-green-600">
                  <BreakTimer
                    startedAt={pomodoroState.breakStartedAt}
                    durationMinutes={pomodoroStore.getCurrentBreakDuration()}
                    onComplete={handleSkipBreak}
                  />
                </span>
                <button
                  onClick={handleSkipBreak}
                  className="mt-3 w-full rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Stop Break
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleStartBreak}
                  className="flex-1 rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
                >
                  Start Break
                </button>
                <button
                  onClick={handleSkipBreak}
                  className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Skip
                </button>
                <button
                  onClick={handleResetPomodoro}
                  className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        ) : hasAnyActiveBreak ? (
          <p className="text-sm text-gray-500">
            Break is active on another activity. Complete or skip it first to start tracking here.
          </p>
        ) : (
          <>
            {/* Mode toggle */}
            <div className="mb-3 flex gap-1">
              <button
                onClick={() => setTimerMode('stopwatch')}
                className={`flex-1 rounded px-3 py-1 text-sm ${timerMode === 'stopwatch'
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-100'
                  }`}
              >
                Stopwatch
              </button>
              <button
                onClick={() => setTimerMode('pomodoro')}
                className={`flex-1 rounded px-3 py-1 text-sm ${timerMode === 'pomodoro'
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-100'
                  }`}
              >
                Pomodoro
              </button>
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on? (optional)"
                maxLength={500}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            {/* Pomodoro settings preview */}
            {timerMode === 'pomodoro' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-gray-400">
                    Next: Session {pomodoroState.currentSession} of {pomodoroSettings.sessionsBeforeLongBreak}
                  </p>
                  {pomodoroState.currentSession > 1 && (
                    <button
                      onClick={handleResetPomodoro}
                      className="text-xs text-gray-400 hover:text-gray-600"
                      title="Reset to Session 1"
                    >
                      ↺
                    </button>
                  )}
                </div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {pomodoroSettings.workDuration}m focus • {pomodoroSettings.shortBreakDuration}m short • {pomodoroSettings.longBreakDuration}m long • {pomodoroSettings.sessionsBeforeLongBreak} sessions
                  </p>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                    title="Settings"
                  >
                    ⚙
                  </button>
                </div>
              </>
            )}

            <button
              onClick={handleStart}
              disabled={startTimer.isPending}
              className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {startTimer.isPending
                ? 'Starting...'
                : timerMode === 'pomodoro'
                  ? 'Start Pomodoro Session'
                  : 'Start Tracking'}
            </button>
          </>
        )}
      </div>

      <PomodoroSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Entries List */}
      <div className="rounded border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">History</h2>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {period === 'custom' && (
          <div className="mb-3 flex gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
        )}
        {entriesLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : entries && entries.length > 0 ? (
          <div>
            {entries.map((entry) => (
              <TimeEntryRow key={entry.id} entry={entry} editable />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No time entries yet.</p>
        )}
      </div>
    </div>
  );
}
