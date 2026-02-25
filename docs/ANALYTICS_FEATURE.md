```markdown
# Analytics Feature Architecture

## 1. High-Level Purpose

Provides users with aggregated insights from their time tracking data: total time tracked, session counts, average session duration, average rating, time breakdown by activity, and peak productivity hours. All metrics can be filtered by date range and activity.

---

## 2. Component & Hook Hierarchy

```
src/features/analytics/
├── index.ts                          # Feature exports
├── types.ts                          # TypeScript definitions (AnalyticsQuery, AnalyticsData)
├── analytics.utils.ts                # Computation and formatting utilities
└── hooks/
    ├── index.ts                      # Hook exports
    └── use-analytics.ts              # Computed analytics from time entries

routes/_auth/
└── analytics.tsx                     # Analytics page with filters and metrics display
```

**Page:**
- `/analytics` — Shows all metrics with global date range and activity filters

---

## 3. State & Data Flow

### **Loading Analytics**
1. User navigates to `/analytics`
2. Default filters: last 30 days, all activities
3. User optionally changes filters (from/to dates, activity)
4. `useAnalytics(query)` calls `useTimeEntries(query)` → GET `/time-entries?from=&to=&activityId=`
5. `computeAnalytics(entries)` processes completed entries (with `stoppedAt`)
6. Returns computed `AnalyticsData` object
7. UI renders metric cards and breakdowns

### **Filter Changes**
1. User changes filter (date or activity)
2. Component state updates
3. `useAnalytics` receives new query params
4. Triggers new `useTimeEntries` fetch (if not cached)
5. Re-computes analytics from new data

---

## 4. Key Patterns & Configuration

| Pattern | Implementation |
|---------|----------------|
| **Client-Side Computation** | Analytics derived from time entries data—no dedicated backend endpoint |
| **Query Reuse** | Uses existing `useTimeEntries` hook with filters |
| **Memoized Computation** | `useMemo` prevents recalculation on unrelated re-renders |
| **Filtered Entries** | Only completed entries (`stoppedAt !== null`) included in metrics |
| **Cache Inheritance** | Shares `['time-entries', query]` cache with time entries feature |
| **No Optimistic Updates** | Read-only derived data—mutations handled by time entries feature |

---

## 5. Public Interface

### **Hooks**

#### `useAnalytics(query?: AnalyticsQuery)`
```typescript
Params: { activityId?: string, from?: string, to?: string }
Returns: { data: AnalyticsData | null, isLoading: boolean, error: Error | null }
```

### **Types**

#### `AnalyticsQuery`
```typescript
type AnalyticsQuery = {
  activityId?: string;
  from?: string;        // ISO date string
  to?: string;          // ISO date string
}
```

#### `AnalyticsData`
```typescript
type AnalyticsData = {
  totalTimeMs: number;                    // Total tracked time in milliseconds
  averageSessionMs: number;               // Average session duration in milliseconds
  sessionCount: number;                   // Number of completed sessions
  averageRating: number | null;           // Average rating (null if no ratings)
  ratedSessionCount: number;              // Number of sessions with ratings
  timeByActivity: Record<string, number>; // Time per activity ID in milliseconds
  peakHours: Record<number, number>;      // Time per hour (0-23) in milliseconds
  totalDistractions: number;              // Total distraction count across all sessions
  averageDistractions: number;            // Average distractions per session
}
```

### **Utilities**

#### `computeAnalytics(entries: TimeEntry[]): AnalyticsData`
Computes all metrics from an array of time entries.

#### `formatDuration(ms: number): string`
Formats milliseconds as human-readable string (e.g., "2h 30m").

#### `getDefaultDateRange(): { from: string; to: string }`
Returns last 30 days as date strings (YYYY-MM-DD format).

#### `buildAnalyticsCsv(params): string`
Builds a CSV string from analytics data. Includes report header (period, activity filter), summary metrics, time-per-activity breakdown, and peak hours breakdown.
```typescript
Params: { analytics: AnalyticsData, from: string, to: string, activityName: string, activityMap: Map<string, string> }
```

#### `downloadCsv(content: string, filename: string): void`
Triggers a browser file download from a CSV string.

---

## 6. Metrics Breakdown

| Metric | Description | Filter Support |
|--------|-------------|----------------|
| **Total Time** | Sum of all session durations | Period + Activity |
| **Session Count** | Number of completed sessions | Period + Activity |
| **Avg Session** | Total time ÷ session count | Period + Activity |
| **Avg Rating** | Mean of all ratings (1-5) | Period + Activity |
| **Total Distractions** | Sum of all distraction counts | Period + Activity |
| **Avg Distractions** | Total distractions ÷ session count | Period + Activity |
| **Peak Hour** | Hour with most tracked time | Period + Activity |
| **Time per Activity** | Breakdown by activity | Period only |

---

## 7. "Gotchas" & Rules

1. **Completed entries only**: Active entries (no `stoppedAt`) are excluded from all calculations
2. **Duration calculation**: `stoppedAt - startedAt` in milliseconds
5. **Peak hours**: Based on session start time (UTC), not distributed across hours
4. **Average rating**: Returns `null` if no entries have ratings
5. **Activity filtering**: When activity filter is set, "Time per Activity" section hides
6. **Date range**: Filters on `startedAt`, same as time entries endpoint
7. **Cache sharing**: Uses same cache key structure as `useTimeEntries`
8. **No pagination**: Analytics computed from all matching entries—same limitation as time entries
```
