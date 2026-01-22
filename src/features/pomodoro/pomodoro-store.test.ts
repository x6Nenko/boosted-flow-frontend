import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pomodoroStore } from './pomodoro-store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('pomodoroStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    pomodoroStore.resetSettings();
    pomodoroStore.resetState();
  });

  describe('settings', () => {
    it('returns default settings initially', () => {
      const settings = pomodoroStore.getSettings();
      expect(settings.workDuration).toBe(25);
      expect(settings.shortBreakDuration).toBe(5);
      expect(settings.longBreakDuration).toBe(15);
      expect(settings.sessionsBeforeLongBreak).toBe(4);
    });

    it('updates settings partially', () => {
      pomodoroStore.updateSettings({ workDuration: 30 });
      const settings = pomodoroStore.getSettings();
      expect(settings.workDuration).toBe(30);
      expect(settings.shortBreakDuration).toBe(5); // unchanged
    });

    it('resets settings to defaults', () => {
      pomodoroStore.updateSettings({ workDuration: 30 });
      pomodoroStore.resetSettings();
      expect(pomodoroStore.getSettings().workDuration).toBe(25);
    });
  });

  describe('phase transitions', () => {
    it('starts at session 1 work phase', () => {
      const state = pomodoroStore.getState();
      expect(state.currentSession).toBe(1);
      expect(state.phase).toBe('work');
    });

    it('transitions to short break after completing work (not last session)', () => {
      pomodoroStore.startWorkSession();
      pomodoroStore.completeWorkSession();
      expect(pomodoroStore.getState().phase).toBe('short-break');
    });

    it('transitions to long break after completing last session', () => {
      // Go through sessions 1-4
      for (let i = 1; i <= 4; i++) {
        pomodoroStore.startWorkSession();
        pomodoroStore.completeWorkSession();
        if (i < 4) {
          pomodoroStore.completeBreak(); // advance to next session
        }
      }
      expect(pomodoroStore.getState().phase).toBe('long-break');
    });

    it('resets session count after long break', () => {
      // Complete 4 sessions
      for (let i = 1; i <= 4; i++) {
        pomodoroStore.startWorkSession();
        pomodoroStore.completeWorkSession();
        pomodoroStore.completeBreak();
      }
      expect(pomodoroStore.getState().currentSession).toBe(1);
    });

    it('increments session after short break', () => {
      pomodoroStore.startWorkSession();
      pomodoroStore.completeWorkSession();
      pomodoroStore.completeBreak();
      expect(pomodoroStore.getState().currentSession).toBe(2);
    });
  });

  describe('setActivity', () => {
    it('loads separate state for different activities', () => {
      // Set up state for activity-1
      pomodoroStore.setActivity('activity-1');
      pomodoroStore.startWorkSession();
      pomodoroStore.completeWorkSession();
      pomodoroStore.completeBreak();
      expect(pomodoroStore.getState().currentSession).toBe(2);

      // Switch to activity-2 - should have fresh state
      pomodoroStore.setActivity('activity-2');
      expect(pomodoroStore.getState().currentSession).toBe(1);
      expect(pomodoroStore.getState().phase).toBe('work');

      // Switch back to activity-1 - should restore state
      pomodoroStore.setActivity('activity-1');
      expect(pomodoroStore.getState().currentSession).toBe(2);
    });

    it('does not reload state when setting same activity', () => {
      const subscriber = vi.fn();
      pomodoroStore.setActivity('activity-1');
      pomodoroStore.subscribe(subscriber);

      pomodoroStore.setActivity('activity-1');
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('notifies subscribers on state change', () => {
      const subscriber = vi.fn();
      pomodoroStore.subscribe(subscriber);
      pomodoroStore.startWorkSession();
      expect(subscriber).toHaveBeenCalled();
    });

    it('unsubscribes correctly', () => {
      const subscriber = vi.fn();
      const unsubscribe = pomodoroStore.subscribe(subscriber);
      unsubscribe();
      pomodoroStore.startWorkSession();
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('hasActiveBreak', () => {
    it('returns false when no activities have active breaks', () => {
      pomodoroStore.setActivity('activity-1');
      expect(pomodoroStore.hasActiveBreak()).toBe(false);
    });

    it('returns true when current activity has active break', () => {
      pomodoroStore.setActivity('activity-1');
      pomodoroStore.startWorkSession();
      pomodoroStore.completeWorkSession();
      pomodoroStore.startBreak();
      expect(pomodoroStore.hasActiveBreak()).toBe(true);
    });

    it('returns true when another activity has active break', () => {
      // Set up break on activity-1
      pomodoroStore.setActivity('activity-1');
      pomodoroStore.startWorkSession();
      pomodoroStore.completeWorkSession();
      pomodoroStore.startBreak();

      // Switch to activity-2
      pomodoroStore.setActivity('activity-2');

      // Should still detect break from activity-1
      expect(pomodoroStore.hasActiveBreak()).toBe(true);
    });

    it('returns false after break is completed', () => {
      pomodoroStore.setActivity('activity-1');
      pomodoroStore.startWorkSession();
      pomodoroStore.completeWorkSession();
      pomodoroStore.startBreak();
      pomodoroStore.completeBreak();
      expect(pomodoroStore.hasActiveBreak()).toBe(false);
    });
  });
});
