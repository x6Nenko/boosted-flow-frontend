# Time Entries Feature Architecture

## 1. High-Level Purpose

Enables users to track work sessions with start/stop timer controls, live duration display, and historical entry viewing—a simplified time-tracking UI.

---

## 2. Component & Hook Hierarchy

```
routes/_auth/time-entries.tsx (Route/Page)
└── components/TimeTracker.tsx (Container)
    ├── components/TimerDuration.tsx (Presentational - live duration)
    ├── TimeEntryRow (inline presentational - list item)
    │
    ├── hooks/useCurrentEntry() → TanStack Query
    ├── hooks/useTimeEntries() → TanStack Query
    ├── hooks/useStartTimer() → TanStack Mutation
    └── hooks/useStopTimer() → TanStack Mutation
        │
        └── api.ts (timeEntriesApi object)
            └── lib/api-client.ts (shared fetch wrapper)
                └── lib/api-endpoints.ts (centralized URL constants)
```

**Supporting Files:**
- `types.ts` — TypeScript interfaces for TimeEntry, Request/Response shapes
- `components/TimerDuration.test.ts` — Unit tests for duration formatting

---

## 3. State & Data Flow

### **Starting Timer**
1. User types description (local state: `description`) → clicks "Start"
2. `handleStart()` → `startTimer.mutate({ description })`
3. `useStartTimer` calls `timeEntriesApi.start(data)` → POST `/time-entries/start`
4. **onSuccess:** `setQueryData(['time-entries', 'current'], { entry })` — immediate cache update
5. Invalidates `['time-entries']` → triggers re-fetch of `useTimeEntries`
6. UI re-renders: input disabled, "Stop" button shown, live timer displays

### **Stopping Timer**
1. User clicks "Stop" → `handleStop()` → `stopTimer.mutate(currentEntry.id)`
2. `useStopTimer` calls `timeEntriesApi.stop({ id })` → POST `/time-entries/stop`
3. **onSuccess:** `setQueryData(['time-entries', 'current'], { entry: null })`
4. Invalidates `['time-entries']` → list re-fetches to include stopped entry
5. UI re-renders: input enabled, "Start" button shown, stopped entry appears in list

### **Loading Current Entry (on mount)**
1. `useCurrentEntry()` fetches `/time-entries/current` with 10min `staleTime`
2. Cache key: `['time-entries', 'current']`
3. Returns `{ entry: TimeEntry | null }`
4. UI derives `isRunning = !!currentEntry`

### **Loading Entry List**
1. `useTimeEntries(query?)` fetches `/time-entries?from=...&to=...`
2. Cache key: `['time-entries', query]`
3. Returns `TimeEntry[]` — sorted by backend

### **Live Duration Tick**
1. `TimerDuration` component mounts with `startedAt` prop
2. `setInterval(1000ms)` updates local `nowMs` state
3. Calculates `HH:MM:SS` from `startMs → nowMs` delta
4. No network calls—pure client-side timer

---

## 4. Key Patterns & Configuration

| Pattern | Implementation |
|---------|----------------|
| **Query Key Strategy** | Hierarchical: `['time-entries']` parent, `['time-entries', 'current']` child |
| **Optimistic UI** | Uses `setQueryData` to immediately update cache before invalidation |
| **No Polling** | `useCurrentEntry` has 10min `staleTime`—relies on mutation cache updates |
| **Selective Invalidation** | `invalidateQueries({ queryKey: ['time-entries'] })` re-fetches all sub-keys |
| **Computed State** | `isRunning` derived from `currentEntry` existence (not separate state) |
| **Controlled Inputs** | Description field disabled when timer running—prevents edit conflicts |
| **Local Timer Logic** | `TimerDuration` uses React state + interval, not server polling |
| **API Layer Separation** | `api.ts` wraps `apiClient` with typed endpoints—no fetch in hooks |
| **Query Params Handling** | `URLSearchParams` for optional `from/to` filters in list query |

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
Params: { from?: string, to?: string } // ISO date strings
Returns: UseQueryResult<TimeEntry[]>
```

#### `useStartTimer()`
```typescript
Returns: UseMutationResult<TimeEntry, Error, StartTimeEntryRequest | undefined>
// StartTimeEntryRequest = { description?: string }
```

#### `useStopTimer()`
```typescript
Returns: UseMutationResult<TimeEntry, Error, string> // string = entry ID
```

### **Components**

#### `<TimeTracker />`
```typescript
Props: none (self-contained)
```

#### `<TimerDuration startedAt={string} />`
```typescript
Props: { startedAt: string } // ISO timestamp
Renders: "HH:MM:SS" string
```

### **API Layer**

#### `timeEntriesApi.start(data?: StartTimeEntryRequest)`
```typescript
POST /time-entries/start
Returns: Promise<TimeEntry>
```

#### `timeEntriesApi.stop(data: StopTimeEntryRequest)`
```typescript
POST /time-entries/stop
Body: { id: string }
Returns: Promise<TimeEntry>
```

#### `timeEntriesApi.list(query?: TimeEntriesQuery)`
```typescript
GET /time-entries?from=...&to=...
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
  description: string | null
  startedAt: string  // ISO timestamp
  stoppedAt: string | null
  createdAt: string
}
```

---

## 6. "Gotchas" & Rules

### **Critical Constraints**
- **Always invalidate `['time-entries']` after mutations** — ensures list/current stay in sync
- **Use `setQueryData` before `invalidateQueries`** — provides instant UI feedback
- **`stoppedAt: null` means active** — do not rely on separate "status" field
- **10min staleTime on current entry** — do not poll; mutations update cache manually

### **Component Dependencies**
- **Requires TanStack Query Provider** — must be wrapped in `<QueryClientProvider>`
- **Requires authentication** — route is under `_auth` layout (enforces login)
- **No Suspense boundaries** — uses loading states (`isLoading`) instead

### **Timing & Intervals**
- **`TimerDuration` starts interval on mount** — must cleanup on unmount
- **1-second tick interval** — do not reduce to avoid performance hit
- **Duration formatting floors to seconds** — sub-second precision ignored

### **API Contracts**
- **`description` max 500 chars** — enforced client-side with `maxLength`
- **Empty description sends `undefined`** — backend interprets as null
- **`from/to` query params are optional** — backend defaults to "all time"

### **State Edge Cases**
- **Description input disabled when running** — prevents editing active entry
- **Start button disabled during mutation** — avoids duplicate requests
- **Negative duration clamped to 00:00:00** — `Math.max(0, ...)` in formatter
- **"(no description)" fallback text** — displayed when `description` is null

### **TypeScript Strictness**
- **All API responses typed** — never use `any` or type assertions
- **Query keys are tuples** — `['time-entries', 'current']` not `'time-entries-current'`
- **Mutation callbacks use typed parameters** — `onSuccess: (entry: TimeEntry) => ...`

### **Testing Notes**
- **`formatStoppedDuration` has unit tests** — ensures HH:MM:SS format correctness
- **Tests cover negative duration clamping** — validates `Math.max(0, ...)` logic
- **No integration tests for mutations yet** — consider adding with MSW
