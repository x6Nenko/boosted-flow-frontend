import { useState } from 'react';
import {
  useCurrentEntry,
  useTimeEntries,
  useStartTimer,
  useStopTimer,
} from '../hooks';
import { formatStoppedDuration, TimerDuration } from './TimerDuration';
import type { TimeEntry } from '../types';

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function TimeEntryRow({ entry }: { entry: TimeEntry }) {
  const isActive = !entry.stoppedAt;

  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-3 last:border-0">
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isActive ? 'font-medium text-indigo-600' : 'text-gray-900'}`}>
          {entry.description || '(no description)'}
        </p>
        <p className="text-xs text-gray-500">
          {formatDate(entry.startedAt)} • {formatTime(entry.startedAt)}
          {entry.stoppedAt && ` – ${formatTime(entry.stoppedAt)}`}
        </p>
      </div>
      <div className={`text-sm font-mono ${isActive ? 'text-indigo-600' : 'text-gray-700'}`}>
        {entry.stoppedAt ? (
          formatStoppedDuration(entry.startedAt, entry.stoppedAt)
        ) : (
          <TimerDuration startedAt={entry.startedAt} />
        )}
      </div>
    </div>
  );
}

export function TimeTracker() {
  const [description, setDescription] = useState('');
  const { data: currentData } = useCurrentEntry();
  const { data: entries, isLoading: entriesLoading } = useTimeEntries();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const currentEntry = currentData?.entry ?? null;
  const isRunning = !!currentEntry;

  const handleStart = () => {
    startTimer.mutate(
      description.trim() ? { description: description.trim() } : undefined,
      {
        onSuccess: () => setDescription(''),
      }
    );
  };

  const handleStop = () => {
    if (currentEntry) {
      stopTimer.mutate(currentEntry.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Timer Control */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          <input
            type="text"
            value={isRunning ? currentEntry.description || '' : description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isRunning}
            placeholder="What are you working on?"
            maxLength={500}
            className="flex-1 rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
          />
          <button
            onClick={isRunning ? handleStop : handleStart}
            disabled={startTimer.isPending || stopTimer.isPending}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${isRunning
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
        </div>

        {/* Live Timer Display */}
        {isRunning && (
          <div className="mt-3 text-center">
            <span className="text-2xl font-mono text-indigo-600">
              <TimerDuration startedAt={currentEntry.startedAt} />
            </span>
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-gray-900">Recent Entries</h2>
        {entriesLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : entries && entries.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <TimeEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No time entries yet.</p>
        )}
      </div>
    </div>
  );
}
