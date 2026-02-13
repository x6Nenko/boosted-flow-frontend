import { useState } from 'react';
import { pomodoroStore, usePomodoroSettings } from '../index';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pomodoro Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="workDuration" className="mb-2 text-sm font-semibold text-muted-foreground tracking-wide px-1">
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
            <Label htmlFor="shortBreak" className="mb-2 text-sm font-semibold text-muted-foreground tracking-wide px-1">
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
            <Label htmlFor="longBreak" className="mb-2 text-sm font-semibold text-muted-foreground tracking-wide px-1">
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
            <Label htmlFor="sessions" className="mb-2 text-sm font-semibold text-muted-foreground tracking-wide px-1">
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

        <div className="flex gap-2 ml-auto pt-4">
          <Button onClick={onClose} variant="ghost" size="sm" className="text-sm">
            Cancel
          </Button>
          <Button onClick={handleReset} variant="ghost" size="sm" className="text-sm">
            Reset
          </Button>
          <Button onClick={handleSave} variant="action" size="sm" className="text-sm">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
