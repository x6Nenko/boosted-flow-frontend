/**
 * Pomodoro timer settings and state management
 * Persists to localStorage for cross-session persistence
 */

const SETTINGS_KEY = 'pomodoro-settings';
const STATE_KEY = 'pomodoro-state';

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

function loadState(): PomodoroState {
  try {
    const stored = localStorage.getItem(STATE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Reset break state on load - breaks don't persist
      return {
        ...DEFAULT_STATE,
        ...parsed,
        isBreakActive: false,
        breakStartedAt: null,
      };
    }
  } catch {
    // Invalid JSON, use defaults
  }
  return DEFAULT_STATE;
}

let settings = loadSettings();
let state = loadState();

function notifySubscribers() {
  subscribers.forEach((callback) => callback());
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

  // Called when user starts a work session
  startWorkSession: () => {
    state = {
      ...state,
      phase: 'work',
      isBreakActive: false,
      breakStartedAt: null,
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
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
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    notifySubscribers();
  },

  // Called when user starts break timer
  startBreak: () => {
    state = {
      ...state,
      isBreakActive: true,
      breakStartedAt: new Date().toISOString(),
    };
    // Don't persist breakStartedAt - breaks are ephemeral
    localStorage.setItem(STATE_KEY, JSON.stringify({
      ...state,
      isBreakActive: false,
      breakStartedAt: null,
    }));
    notifySubscribers();
  },

  // Called when break completes or user skips it
  completeBreak: () => {
    const wasLongBreak = state.phase === 'long-break';
    state = {
      currentSession: wasLongBreak ? 1 : state.currentSession + 1,
      phase: 'work',
      isBreakActive: false,
      breakStartedAt: null,
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    notifySubscribers();
  },

  // Reset to initial state
  resetState: () => {
    state = DEFAULT_STATE;
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
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
};
