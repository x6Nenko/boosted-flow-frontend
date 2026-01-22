/**
 * Pomodoro timer settings and state management
 * Persists to localStorage for cross-session persistence
 * State is per-activity to avoid conflicts when switching between activities
 */

const SETTINGS_KEY = 'pomodoro-settings';
const STATE_KEY_PREFIX = 'pomodoro-state-';

export type PomodoroSettings = {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsBeforeLongBreak: number;
};

export type PomodoroPhase = 'work' | 'short-break' | 'long-break';

export type PomodoroState = {
  currentSession: number; // 1-based session number
  phase: PomodoroPhase;
  isBreakActive: boolean; // true when break timer is running (client-side only)
  breakStartedAt: string | null; // ISO timestamp for break timer
  activityId: string | null; // which activity this state belongs to
};

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

const DEFAULT_STATE: PomodoroState = {
  currentSession: 1,
  phase: 'work',
  isBreakActive: false,
  breakStartedAt: null,
  activityId: null,
};

// Subscribers for reactivity
const subscribers = new Set<() => void>();

function loadSettings(): PomodoroSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // Invalid JSON, use defaults
  }
  return DEFAULT_SETTINGS;
}

function loadState(activityId: string | null): PomodoroState {
  if (!activityId) return { ...DEFAULT_STATE };
  try {
    const stored = localStorage.getItem(STATE_KEY_PREFIX + activityId);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        activityId,
      };
    }
  } catch {
    // Invalid JSON, use defaults
  }
  return { ...DEFAULT_STATE, activityId };
}

let settings = loadSettings();
let state = loadState(null);

function notifySubscribers() {
  subscribers.forEach((callback) => callback());
}

function saveState() {
  if (!state.activityId) return;
  localStorage.setItem(STATE_KEY_PREFIX + state.activityId, JSON.stringify(state));
}

export const pomodoroStore = {
  // Settings
  getSettings: () => settings,

  updateSettings: (updates: Partial<PomodoroSettings>) => {
    settings = { ...settings, ...updates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    notifySubscribers();
  },

  resetSettings: () => {
    settings = DEFAULT_SETTINGS;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    notifySubscribers();
  },

  // State
  getState: () => state,

  // Load state for a specific activity
  setActivity: (activityId: string) => {
    if (state.activityId === activityId) return;
    state = loadState(activityId);
    notifySubscribers();
  },

  // Called when user starts a work session
  startWorkSession: () => {
    state = {
      ...state,
      phase: 'work',
      isBreakActive: false,
      breakStartedAt: null,
    };
    saveState();
    notifySubscribers();
  },

  // Called when work session completes (user stops timer)
  completeWorkSession: () => {
    const isLongBreakNext = state.currentSession >= settings.sessionsBeforeLongBreak;
    state = {
      ...state,
      phase: isLongBreakNext ? 'long-break' : 'short-break',
      isBreakActive: false,
      breakStartedAt: null,
    };
    saveState();
    notifySubscribers();
  },

  // Called when user starts break timer
  startBreak: () => {
    state = {
      ...state,
      isBreakActive: true,
      breakStartedAt: new Date().toISOString(),
    };
    saveState();
    notifySubscribers();
  },

  // Called when break completes or user skips it
  completeBreak: () => {
    const wasLongBreak = state.phase === 'long-break';
    state = {
      ...state,
      currentSession: wasLongBreak ? 1 : state.currentSession + 1,
      phase: 'work',
      isBreakActive: false,
      breakStartedAt: null,
    };
    saveState();
    notifySubscribers();
  },

  // Reset to initial state (keeps activityId)
  resetState: () => {
    state = { ...DEFAULT_STATE, activityId: state.activityId };
    saveState();
    notifySubscribers();
  },

  // Subscription
  subscribe: (callback: () => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  },

  // Helper to get current break duration
  getCurrentBreakDuration: () => {
    return state.phase === 'long-break'
      ? settings.longBreakDuration
      : settings.shortBreakDuration;
  },

  // Check if any activity has an active break
  hasActiveBreak: () => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STATE_KEY_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.isBreakActive && parsed.phase !== 'work') {
              return true;
            }
          }
        }
      }
    } catch {
      // Invalid JSON or localStorage error
    }
    return false;
  },
};
