import { useState } from 'react';
import { pomodoroStore, usePomodoroSettings } from '../index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-xl font-semibold text-foreground">Pomodoro Settings</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="workDuration" className="text-sm text-muted-foreground mb-2">
              Work duration (minutes)
            </Label>
            <Input
              id="workDuration"
              type="number"
              min="1"
              value={form.workDuration}
              onChange={(e) => handleChange('workDuration', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="shortBreak" className="text-sm text-muted-foreground mb-2">
              Short break (minutes)
            </Label>
            <Input
              id="shortBreak"
              type="number"
              min="1"
              value={form.shortBreakDuration}
              onChange={(e) => handleChange('shortBreakDuration', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="longBreak" className="text-sm text-muted-foreground mb-2">
              Long break (minutes)
            </Label>
            <Input
              id="longBreak"
              type="number"
              min="1"
              value={form.longBreakDuration}
              onChange={(e) => handleChange('longBreakDuration', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="sessions" className="text-sm text-muted-foreground mb-2">
              Sessions before long break
            </Label>
            <Input
              id="sessions"
              type="number"
              min="1"
              value={form.sessionsBeforeLongBreak}
              onChange={(e) => handleChange('sessionsBeforeLongBreak', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Save
          </Button>
          <Button onClick={handleReset} variant="outline">
            Reset
          </Button>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
