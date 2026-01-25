# Command Palette & Hotkeys Feature

## 1. High-Level Purpose

Provides keyboard-driven navigation and actions via a command palette (Cmd/Ctrl+K) and global hotkeys for fast time tracking workflows.

---

## 2. Component & Hook Hierarchy

```
src/features/command-palette/
├── index.ts                              # Exports
├── command-registry.ts                   # Command registry store
├── command-palette-store.ts              # Open/close state management
├── hooks.ts                              # useCommandPaletteOpen/useRegisterCommand hooks
└── CommandPalette.tsx                    # Command palette UI (cmdk)

src/features/hotkeys/
├── index.ts                              # Exports
└── use-global-hotkeys.ts                 # Global and page-specific hotkey hooks
```

---

## 3. Hotkeys Reference

### Global (everywhere)

| Hotkey | Action |
|--------|--------|
| `Cmd/Ctrl + K` | Toggle command palette |
| `g d` | Go to Dashboard |
| `g a` | Go to Activities |
| `g n` | Go to Analytics |

### Activity Page (`/activities/:id`)

| Hotkey | Action |
|--------|--------|
| `Space` | Start/Stop timer |
| `Shift + D` | Add distraction (timer running) |

---

## 4. Command Palette Actions

### Navigation
- Go to Dashboard (`g d`)
- Go to Activities (`g a`)
- Go to Analytics (`g n`)

### Context-Specific Actions

**Activities Page (`/activities`):**
- New Activity — focuses the activity name input
- Search Activities — type to filter by name and open

**Activity Page (`/activities/:id`):**
- Start/Stop Timer (`Space`)
- Toggle Pomodoro/Stopwatch
- Start timer with intention (focuses intention input)
- Add Distraction (`⇧D`)
- Start Break (only during break phase)
- Skip Break (only during break phase)
- Reset Pomodoro Phase
- Pomodoro Settings

---

## 5. State & Data Flow

### **Command Palette Store**
Simple open/close state with subscribe pattern for React integration.

```typescript
commandPaletteStore.open()     // Open palette
commandPaletteStore.close()    // Close palette
commandPaletteStore.toggle()   // Toggle open/close
commandPaletteStore.isOpen()   // Get current state
commandPaletteStore.subscribe(callback) // For reactivity
```

### **Hooks**

```typescript
// Global hotkeys - used once in root layout
useGlobalHotkeys()

// Activity page specific hotkeys
useActivityPageHotkeys({
  onStartStop: () => void,      // Called on Space
  onAddDistraction: () => void, // Called on Shift+D
});

// Register a single command
useRegisterCommand({
  id: 'timer.startStop',
  group: 'Timer',
  label: 'Start/Stop Timer',
  shortcut: 'Space',
  run: handleStartStop,
});

// Register multiple commands (e.g., dynamic list of activities)
useRegisterCommands([
  { id: 'activity.1', group: 'Activities', label: 'Project A', run: () => {} },
  { id: 'activity.2', group: 'Activities', label: 'Project B', run: () => {} },
]);
```

---

## 6. Integration Points

### Root Layout
- `CommandPalette` component mounted in `__root.tsx`
- `useGlobalHotkeys()` hook for Cmd/Ctrl+K and g+key navigation

### Header
- Search button with Cmd/Ctrl+K hint (detects OS for ⌘K vs Ctrl K)

### Activity Page
- `useActivityPageHotkeys` for Space and Shift+D
- Commands registered via the command registry

### Activities Page
- Registers one command per activity so the palette can filter by name and open it
- Uses `useRegisterCommands` hook for dynamic command lists

### Command Registry
Commands are registered by the components that own the action using hooks:

```typescript
// Single command
useRegisterCommand({
  id: 'timer.startStop',
  group: 'Timer',
  label: 'Start/Stop Timer',
  shortcut: 'Space',
  run: handleStartStop,
});

// Multiple commands (dynamic lists)
useRegisterCommands(activityCommands);
```

---

## 7. Dependencies

- **cmdk** — Headless command palette component
- **lucide-react** — Search icon for header button
- Existing stores: `pomodoroStore` for break state

---

## 8. Styling

Minimal styles in `styles.css` under `/* Command Palette (cmdk) */` section.
Designed to be easily customized.
