# Pomodoro Timer Feature Architecture

## 1. High-Level Purpose

Provides a Pomodoro technique timer alongside the existing stopwatch mode. Users can choose between simple time tracking (stopwatch) or structured work/break intervals (pomodoro) with customizable durations.

---

## 2. Component & Hook Hierarchy

```
src/features/pomodoro/
├── index.ts                              # Exports: hooks, store, types
├── pomodoro-store.ts                     # Settings & state management (localStorage)
└── components/
    ├── BreakTimer.tsx                    # Countdown timer for breaks
    ├── PomodoroTimer.tsx                 # Countdown timer for work sessions
    └── PomodoroSettingsModal.tsx         # Modal for customizing settings

routes/_auth/
└── activities.$activityId.tsx            # Integrates mode toggle & pomodoro UI
```

---

## 3. State & Data Flow

### **Storage Strategy**
- **Settings** (work duration, break durations, session count): Persisted to `localStorage`
- **Phase state** (current session, phase): Persisted to `localStorage`
- **Timer mode** (stopwatch vs pomodoro per activity): Persisted to `localStorage`
- **Break timer**: NOT persisted - ephemeral client-side only
- **Work session timer**: Uses existing backend time entry tracking

### **Starting Pomodoro Session**
1. User selects "Pomodoro" mode via toggle
2. User clicks "Start Pomodoro Session"
3. `pomodoroStore.startWorkSession()` → sets phase to 'work'
4. `startTimer.mutate()` → creates time entry via backend (same as stopwatch)
5. Timer runs using `<PomodoroTimer>` component - counts down from work duration
6. When timer reaches 00:00, automatically calls `onComplete` which stops the timer

### **Completing Work Session**
1. User clicks "Stop" OR timer reaches 00:00 automatically
2. `pomodoroStore.completeWorkSession()` → determines break type
3. `stopTimer.mutate()` → stops time entry via backend
4. UI shows break prompt with Start/Skip options

### **Break Phase**
1. User clicks "Start Break" → `pomodoroStore.startBreak()`
2. `<BreakTimer>` counts down from break duration
3. On completion or skip → `pomodoroStore.completeBreak()`
4. Session counter advances, phase resets to 'work'

### **Browser Refresh Behavior**
- Settings: Restored from localStorage
- Phase/session: Restored from localStorage
- Timer mode: Restored from localStorage (per activity)
- Active work timer: Restored via backend (existing `useCurrentEntry`)
- Active break timer: Reset - user sees "Start Break" option again

---

## 4. Key Patterns & Configuration

| Pattern | Implementation |
|---------|----------------|
| **localStorage Persistence** | Settings, phase state, and timer mode survive browser refresh |
| **Backend Time Tracking** | Work sessions use existing time entries API |
| **Client-only Breaks** | Break timers are ephemeral, not tracked in backend |
| **Reactive Store** | Subscribe pattern for React integration via `useSyncExternalStore` |
| **Mode Toggle** | Per-activity mode persisted to localStorage |
| **Settings Modal** | On-demand display, saves to store on confirm |

### **Default Settings**
```typescript
{
  workDuration: 25,           // minutes
  shortBreakDuration: 5,      // minutes
  longBreakDuration: 15,      // minutes
  sessionsBeforeLongBreak: 4  // sessions
}
```

---

## 5. Public Interface

### **Store**

```typescript
pomodoroStore.getSettings()           // Returns PomodoroSettings
pomodoroStore.updateSettings(partial) // Merge updates, persist
pomodoroStore.resetSettings()         // Restore defaults

pomodoroStore.getState()              // Returns PomodoroState
pomodoroStore.startWorkSession()      // Begin work phase
pomodoroStore.completeWorkSession()   // End work, determine break type
pomodoroStore.startBreak()            // Begin break countdown
pomodoroStore.completeBreak()         // End break, advance session
pomodoroStore.resetState()            // Reset to session 1, work phase

pomodoroStore.subscribe(callback)     // For reactivity
pomodoroStore.getCurrentBreakDuration() // Helper: returns current break duration
```

### **Hooks**

```typescript
usePomodoroSettings()  // Returns: PomodoroSettings (reactive)
usePomodoroState()     // Returns: PomodoroState (reactive)
```

### **Components**

```typescript
<PomodoroTimer
  startedAt={string}        // ISO timestamp
  durationMinutes={number}  // Work session length
  onComplete={() => void}   // Called when countdown reaches 0
/>

<BreakTimer
  startedAt={string}        // ISO timestamp
  durationMinutes={number}  // Break length
  onComplete={() => void}   // Called when countdown reaches 0
/>

<PomodoroSettingsModal
  isOpen={boolean}
  onClose={() => void}
/>
```

---

## 6. Types

```typescript
type PomodoroSettings = {
  workDuration: number;           // minutes
  shortBreakDuration: number;     // minutes
  longBreakDuration: number;      // minutes
  sessionsBeforeLongBreak: number;
};

type PomodoroPhase = 'work' | 'short-break' | 'long-break';

type PomodoroState = {
  currentSession: number;         // 1-based session number
  phase: PomodoroPhase;
  isBreakActive: boolean;         // true when break timer running
  breakStartedAt: string | null;  // ISO timestamp for break
};
```

---

## 7. UI Behavior

### **Mode Toggle**
- Located above description input
- Two buttons: "Stopwatch" | "Pomodoro"
- Simple visual indication of selected mode

### **Pomodoro Start State**
- Shows next session: "Next: Session 1 of 4"
- Shows settings preview: "25m focus • 5m short • 15m long • 4 sessions"
- Gear icon opens settings modal
- Button: "Start Pomodoro Session"

### **Active Work Session**
- Shows session progress: "Session 1 of 4"
- Timer counts down from work duration
- Timer automatically stops at 00:00
- Manual Stop button also available

### **Break Prompt**
- Shows completed session: "Completed: Session 1 of 4"
- Shows break type: "Short break time!" or "Long break time!"
- Two buttons: "Start [Short/Long] Break" | "Skip"
- If started, shows countdown timer with "Skip Break" option

### **Settings Modal**
- Four number inputs for durations/sessions
- Save, Reset, Cancel buttons
- Reset restores default values

### **Dashboard**
- Simple tracking indicator when timer is active
- Shows break indicator when pomodoro break is active
- Shows activity name and description (if present)
- No timer controls - user must go to activity page to start/stop
- Avoids duplication and conflicts with activity page timer

### **Break Phase Protections**
- Other activities cannot be started during active break
- Archive and delete buttons disabled during active tracking or breaks
- Prevents data conflicts and ensures clean session completion
