# Time Entries Feature Architecture

## 1. High-Level Purpose

Enables users to track work sessions with start/stop timer controls, live duration display, activity-based categorization, and post-session rating/comments.

---

## 2. Component & Hook Hierarchy

```
routes/_auth/
├── dashboard.tsx                         # Overview: current timer, all recent entries, activity heatmap
└── activities.$activityId.tsx            # Activity-specific: timer, filtered entries

src/features/time-entries/
├── time-entries.schema.ts               # Zod schema for manual entry form
├── time-entries.utils.ts                # datetime-local helpers
├── types.ts                              # TypeScript definitions (TimeEntry, requests)
├── api.ts                                # API endpoints
├── components/
│   ├── TimerDuration.tsx                 # Live duration display
│   ├── TimerDuration.test.ts             # Unit tests
│   ├── TimeEntryRow.tsx                  # Reusable entry row with rating/edit/delete
│   ├── ActivityHeatmap.tsx               # GitHub-style contribution grid (past 6 months)
│   ├── activity-heatmap.utils.ts          # Heatmap bucketing + current streak logic
│   └── activity-heatmap.utils.test.ts     # Unit tests for heatmap + streak
└── hooks/
    ├── index.ts                          # Hook exports
    ├── use-current-entry.ts              # TanStack Query for active entry
    ├── use-time-entries.ts               # TanStack Query for listing
    ├── use-start-timer.ts                # TanStack Mutation
    ├── use-stop-timer.ts                 # TanStack Mutation
    ├── use-create-manual-time-entry.ts   # TanStack Mutation
    ├── use-update-time-entry.ts          # TanStack Mutation
    └── use-delete-time-entry.ts          # TanStack Mutation

src/lib/utils.ts                          # Shared formatTime, formatDate functions
```

**Pages:**
- `/dashboard` — Shows current timer (if running), current streak, heatmap, and recent entries across activities
- `/activities/:activityId` — Timer control and entries filtered by activity

---

## 3. State & Data Flow

### **Starting Timer**
1. User goes to activity page `/activities/:activityId`
2. User optionally enters description → `description` state
3. User clicks "Start Tracking" → `handleStart()`
4. `distractionCount` resets to 0
5. `startTimer.mutate({ activityId, description? })`
6. `useStartTimer` calls `timeEntriesApi.start(data)` → POST `/time-entries/start`
7. **onSuccess:** `setQueryData(['time-entries', 'current'], { entry })` — immediate cache update
8. Invalidates `['time-entries']` → triggers re-fetch of `useTimeEntries`
9. UI re-renders: shows "Stop" button, live timer displays, "+ Distraction" button

### **Tracking Distractions**
1. User clicks "+ Distraction" while timer is running
2. Local `distractionCount` state increments by 1
3. Count shown next to button when > 0
4. Sent to backend when timer stops

### **Stopping Timer**
1. User clicks "Stop" → `handleStop()` → `stopTimer.mutate({ id, distractionCount })`
2. `useStopTimer` calls `timeEntriesApi.stop({ id, distractionCount })` → POST `/time-entries/stop`
3. **onSuccess:** `setQueryData(['time-entries', 'current'], { entry: null })`
4. Invalidates `['time-entries']` → list re-fetches to include stopped entry
5. UI re-renders: shows start form, stopped entry appears in history

### **Updating Entry (Rating/Comment/Distractions)**
1. User clicks "Edit" on stopped entry → opens inline edit form
2. User sets rating (1-5 stars), comment, and/or distractions (+/- buttons)
3. User clicks "Save" → `updateEntry.mutate({ id, data: { rating, comment, distractionCount } })`
4. `useUpdateTimeEntry` calls `timeEntriesApi.update(id, data)` → PATCH `/time-entries/:id`
5. **onSuccess:** Invalidates `['time-entries']` → list re-fetches
6. Edit form closes, entry shows updated values

### **Updating Entry Timestamps (Manual adjustments)**
1. User clicks "Edit" on stopped entry → shows datetime inputs for started/stopped
2. User updates startedAt/stoppedAt values
3. User clicks "Save" → `updateEntry.mutate({ id, data: { startedAt, stoppedAt } })`
4. `useUpdateTimeEntry` calls `timeEntriesApi.update(id, data)` → PATCH `/time-entries/:id`
5. **onSuccess:** Invalidates `['time-entries']` → list re-fetches

### **Manual Entry (Create stopped entry)**
1. User opens "Manual entry" section on activity page
2. User inputs startedAt, stoppedAt, optional description
3. User clicks "Save" → `createManual.mutate({ activityId, startedAt, stoppedAt, description? })`
4. `useCreateManualTimeEntry` calls `timeEntriesApi.createManual(data)` → POST `/time-entries/manual`
5. **onSuccess:** Invalidates `['time-entries']` → list re-fetches

### **Deleting Entry**
1. User clicks "Delete" in edit form → confirmation dialog
2. `deleteEntry.mutate(entryId)`
3. `useDeleteTimeEntry` calls `timeEntriesApi.delete(id)` → DELETE `/time-entries/:id`
4. **onSuccess:** Invalidates `['time-entries']` → list re-fetches

### **Loading Current Entry (on mount)**
1. `useCurrentEntry()` fetches `/time-entries/current` with 10min `staleTime`
2. Cache key: `['time-entries', 'current']`
3. Returns `{ entry: TimeEntry | null }`
4. UI derives `isRunning = !!currentEntry`

### **Loading Entry List**
1. `useTimeEntries(query?)` fetches `/time-entries?activityId=...&from=...&to=...`
2. Cache key: `['time-entries', query]`
3. Returns `TimeEntry[]` — sorted by backend
4. Pass `{ activityId }` to filter by activity
5. **Default:** Both dashboard and activity pages load last 7 days by default
6. Period filter dropdown allows switching: 7 days, 30 days, 90 days, all time, or custom range
7. **Custom Range:** When selected, reveals From/To date inputs for user-specified date range

### **Live Duration Tick**
1. `TimerDuration` component mounts with `startedAt` prop
2. `setInterval(1000ms)` updates local `nowMs` state
3. Calculates `HH:MM:SS` from `startMs → nowMs` delta
4. No network calls—pure client-side timer

---

## 4. Key Patterns & Configuration

| Pattern | Implementation |
|---------|----------------|
| **Query Key Strategy** | Hierarchical: `['time-entries']` parent, `['time-entries', 'current']` child, `['time-entries', { activityId }]` filtered |
| **Optimistic UI** | Uses `setQueryData` to immediately update cache before invalidation |
| **No Polling** | `useCurrentEntry` has 10min `staleTime`—relies on mutation cache updates |
| **Selective Invalidation** | `invalidateQueries({ queryKey: ['time-entries'] })` re-fetches all sub-keys |
| **Computed State** | `isRunning` derived from `currentEntry` existence (not separate state) |
| **Activity-based tracking** | Timer controls on activity page, not global dashboard |
| **Edit Only When Stopped** | Rating/comment editing only available for stopped entries |
| **Local Timer Logic** | `TimerDuration` uses React state + interval, not server polling |
| **API Layer Separation** | `api.ts` wraps `apiClient` with typed endpoints—no fetch in hooks |
| **Query Params Handling** | `URLSearchParams` for optional `activityId/from/to` filters in list query |

---

## 5. Public Interface

### **Hooks**

#### `useCurrentEntry()`
```typescript
Returns: UseQueryResult<CurrentEntryResponse>
// CurrentEntryResponse = { entry: TimeEntry | null }
```

#### `useTimeEntries(query?: TimeEntriesQuery)`
```typescript
Params: { activityId?: string, from?: string, to?: string }
Returns: UseQueryResult<TimeEntry[]>
```

#### `useStartTimer()`
```typescript
Returns: UseMutationResult<TimeEntry, Error, StartTimeEntryRequest>
// StartTimeEntryRequest = { activityId: string, description?: string }
```

#### `useStopTimer()`
```typescript
Returns: UseMutationResult<TimeEntry, Error, string> // string = entry ID
```

#### `useUpdateTimeEntry()`
```typescript
Returns: UseMutationResult<TimeEntry, Error, { id: string, data: UpdateTimeEntryRequest }>
// UpdateTimeEntryRequest = { startedAt?: string, stoppedAt?: string, rating?: number, comment?: string, distractionCount?: number }
```

#### `useCreateManualTimeEntry()`
```typescript
Returns: UseMutationResult<TimeEntry, Error, CreateManualTimeEntryRequest>
// CreateManualTimeEntryRequest = { activityId: string, startedAt: string, stoppedAt: string, description?: string }
```

#### `useDeleteTimeEntry()`
```typescript
Returns: UseMutationResult<void, Error, string> // string = entry ID
```

### **Components**

#### `<TimerDuration startedAt={string} />`
```typescript
Props: { startedAt: string } // ISO timestamp
Renders: "HH:MM:SS" string
```

#### `<ActivityHeatmap />`
```typescript
Props: none
Renders: GitHub-style contribution grid for past 6 months
```
Also displays **Current streak** on the dashboard.

Streak rules:
- Uses local day bucketing (same as heatmap) based on `startedAt`
- A day counts only if total tracked time for that day is **> 1 minute**
- Active entry (no `stoppedAt`) contributes using the current time
- **At-risk indicator**: When today has no qualifying activity but yesterday does, the streak shows up to yesterday's checkpoint and displays "(at risk)" warning

Displays daily tracked time as a heatmap. Uses 5 levels (0-4) based on daily tracked minutes:
- Level 0: No activity (< 1 min)
- Level 1-4: Scaled from 1 min to 4 hours (≥4h = max level)

Features:
- Month labels above columns where month changes
- Tooltip on hover: "Jan 15: 2.5h"
- Color legend (Less → More)
- Week starts on Sunday

### **API Layer**

#### `timeEntriesApi.start(data)`
```typescript
POST /time-entries/start
Body: { activityId: string, description?: string }
Returns: Promise<TimeEntry>
```

#### `timeEntriesApi.stop(data)`
```typescript
POST /time-entries/stop
Body: { id: string, distractionCount?: number }
Returns: Promise<TimeEntry>
```

#### `timeEntriesApi.update(id, data)`
```typescript
PATCH /time-entries/:id
Body: { startedAt?: string, stoppedAt?: string, rating?: number, comment?: string, distractionCount?: number }
Returns: Promise<TimeEntry>
```

#### `timeEntriesApi.createManual(data)`
```typescript
POST /time-entries/manual
Body: { activityId: string, startedAt: string, stoppedAt: string, description?: string }
Returns: Promise<TimeEntry>
```

#### `timeEntriesApi.delete(id)`
```typescript
DELETE /time-entries/:id
Returns: Promise<void>
```

#### `timeEntriesApi.list(query?)`
```typescript
GET /time-entries?activityId=...&from=...&to=...
Returns: Promise<TimeEntry[]>
```

#### `timeEntriesApi.current()`
```typescript
GET /time-entries/current
Returns: Promise<CurrentEntryResponse>
```

### **Types**

```typescript
TimeEntry {
  id: string
  userId: string
  activityId: string
  description: string | null
  startedAt: string  // ISO timestamp
  stoppedAt: string | null
  rating: number | null  // 1-5
  comment: string | null
  distractionCount: number  // default 0
  createdAt: string
}

StartTimeEntryRequest {
  activityId: string
  description?: string
}

StopTimeEntryRequest {
  id: string
  distractionCount?: number
}

UpdateTimeEntryRequest {
  startedAt?: string
  stoppedAt?: string
  rating?: number
  comment?: string
  distractionCount?: number
}

CreateManualTimeEntryRequest {
  activityId: string
  startedAt: string
  stoppedAt: string
  description?: string
}

TimeEntriesQuery {
  activityId?: string
  from?: string
  to?: string
}
```

---

## 6. "Gotchas" & Rules

### **Critical Constraints**
- **Activity required** — Cannot start timer without `activityId`
- **Always invalidate `['time-entries']` after mutations** — ensures list/current stay in sync
- **Use `setQueryData` before `invalidateQueries`** — provides instant UI feedback
- **`stoppedAt: null` means active** — do not rely on separate "status" field
- **10min staleTime on current entry** — do not poll; mutations update cache manually

### **Rating/Comment Rules**
- **Edit only when stopped** — cannot modify active entries
- **1-week edit window** — backend enforces max 1 week after `stoppedAt`
- **Rating 1-5** — enforced at UI level with star picker
- **Comment max 1000 chars** — enforced client-side with `maxLength`
- **Timestamp edits** — available only for stopped entries; must keep `startedAt < stoppedAt`
- **Manual entries** — created as already stopped entries

### **Component Dependencies**
- **Requires TanStack Query Provider** — must be wrapped in `<QueryClientProvider>`
- **Requires authentication** — route is under `_auth` layout (enforces login)
- **Dashboard shows create form** — redirects to activity page after creation

### **Timing & Intervals**
- **`TimerDuration` starts interval on mount** — must cleanup on unmount
- **1-second tick interval** — do not reduce to avoid performance hit
- **Duration formatting floors to seconds** — sub-second precision ignored

### **API Contracts**
- **`description` max 500 chars** — enforced client-side with `maxLength`
- **Empty description sends `undefined`** — backend interprets as null
- **`activityId/from/to` query params are optional** — backend defaults accordingly

### **State Edge Cases**
- **Only one timer active** — activity page shows message if timer running elsewhere
- **Negative duration clamped to 00:00:00** — `Math.max(0, ...)` in formatter

### **TypeScript Strictness**
- **All API responses typed** — never use `any` or type assertions
- **Query keys are tuples** — `['time-entries', 'current']` not `'time-entries-current'`
- **Mutation callbacks use typed parameters** — `onSuccess: (entry: TimeEntry) => ...`

### **Testing Notes**
- **`formatStoppedDuration` has unit tests** — ensures HH:MM:SS format correctness
- **Tests cover negative duration clamping** — validates `Math.max(0, ...)` logic
- **Mock handlers updated for activityId** — required field in start request
