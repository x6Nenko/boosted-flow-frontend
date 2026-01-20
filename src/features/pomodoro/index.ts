import { useSyncExternalStore } from 'react';
import { pomodoroStore } from './pomodoro-store';

export function usePomodoroSettings() {
  return useSyncExternalStore(pomodoroStore.subscribe, pomodoroStore.getSettings);
}

export function usePomodoroState() {
  return useSyncExternalStore(pomodoroStore.subscribe, pomodoroStore.getState);
}

export { pomodoroStore } from './pomodoro-store';
export type { PomodoroSettings, PomodoroState, PomodoroPhase } from './pomodoro-store';
