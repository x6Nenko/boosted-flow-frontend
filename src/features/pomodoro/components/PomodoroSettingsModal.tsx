import { useState } from 'react';
import { pomodoroStore, usePomodoroSettings } from '../index';
import type { PomodoroSettings } from '../index';

type PomodoroSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function PomodoroSettingsModal({ isOpen, onClose }: PomodoroSettingsModalProps) {
  const currentSettings = usePomodoroSettings();
  const [form, setForm] = useState<PomodoroSettings>(currentSettings);

  if (!isOpen) return null;

  const handleSave = () => {
    pomodoroStore.updateSettings(form);
    onClose();
  };

  const handleReset = () => {
    pomodoroStore.resetSettings();
    setForm(pomodoroStore.getSettings());
  };

  const handleChange = (key: keyof PomodoroSettings, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setForm((prev) => ({ ...prev, [key]: num }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-medium text-gray-900">Pomodoro Settings</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700">Work duration (minutes)</label>
            <input
              type="number"
              min="1"
              value={form.workDuration}
              onChange={(e) => handleChange('workDuration', e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Short break (minutes)</label>
            <input
              type="number"
              min="1"
              value={form.shortBreakDuration}
              onChange={(e) => handleChange('shortBreakDuration', e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Long break (minutes)</label>
            <input
              type="number"
              min="1"
              value={form.longBreakDuration}
              onChange={(e) => handleChange('longBreakDuration', e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Sessions before long break</label>
            <input
              type="number"
              min="1"
              value={form.sessionsBeforeLongBreak}
              onChange={(e) => handleChange('sessionsBeforeLongBreak', e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500"
          >
            Save
          </button>
          <button
            onClick={handleReset}
            className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
