# Activities Feature Architecture

## 1. High-Level Purpose

Enables users to define activities (things they want to track time on) with a simple creation flow and activity selection for time tracking.

---

## 2. Component & Hook Hierarchy

```
src/features/activities/
├── types.ts                              # TypeScript definitions
├── api.ts                                # API endpoints using API_ENDPOINTS
└── hooks/
    ├── index.ts                          # Hook exports
    ├── use-activities.ts                 # TanStack Query for listing
    └── use-create-activity.ts            # TanStack Mutation for creation
```

**Used in:**
- `TimeTracker.tsx` (ActivityPicker, ActivityForm components)

---

## 3. State & Data Flow

### **Loading Activities**
1. `useActivities()` fetches `GET /activities`
2. Cache key: `['activities', { includeArchived }]`
3. Returns `Activity[]` — sorted by `createdAt DESC` from backend
4. 60min `staleTime` — activities rarely change

### **Creating Activity**
1. User types activity name in `ActivityForm`
2. On submit → `useCreateActivity().mutate({ name })`
3. `activitiesApi.create()` → POST `/activities`
4. **onSuccess:** Invalidates `['activities']` → list re-fetches
5. Form clears, new activity appears in picker

---

## 4. Key Patterns & Configuration

| Pattern | Implementation |
|---------|----------------|
| **Query Key Strategy** | `['activities', { includeArchived }]` for filtering support |
| **Stale Time** | 60min — activities don't change frequently |
| **Suggestions** | `ACTIVITY_SUGGESTIONS` constant for common activities |
| **No Optimistic UI** | Simple invalidation on success is sufficient |

---

## 5. Public Interface

### **Hooks**

#### `useActivities(includeArchived?)`
```typescript
Params: includeArchived?: boolean (default: false)
Returns: UseQueryResult<Activity[]>
```

#### `useCreateActivity()`
```typescript
Returns: UseMutationResult<Activity, Error, CreateActivityRequest>
```

### **API Layer**

#### `activitiesApi.create(data)`
```typescript
POST /activities
Body: { name: string }
Returns: Promise<Activity>
```

#### `activitiesApi.list(includeArchived?)`
```typescript
GET /activities?includeArchived=true
Returns: Promise<Activity[]>
```

### **Types**

```typescript
Activity {
  id: string
  userId: string
  name: string
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

CreateActivityRequest {
  name: string
}

ACTIVITY_SUGGESTIONS = [
  'Reading', 'Coding', 'Writing', 'Studying', 'Exercise',
  'Meditation', 'Learning', 'Drawing', 'Music', 'Cooking'
]
```

---

## 6. "Gotchas" & Rules

### **Critical Constraints**
- **Name max 255 chars** — enforced client-side with `maxLength`
- **Archived activities excluded by default** — pass `includeArchived: true` to include
- **Activities required for time entries** — cannot start timer without selecting activity

### **UI Behavior**
- **Suggestions shown on focus** — filtered as user types
- **Empty state shows create form** — no activities = must create first
- **Activity picker uses pills** — simple tap to select

### **Cache Behavior**
- **60min staleTime** — manual refresh not needed
- **Invalidate on create** — ensures picker shows new activity immediately

### **TypeScript Strictness**
- **All API responses typed** — `Activity` from `types.ts`
- **Query keys are tuples** — `['activities', opts]` not strings
