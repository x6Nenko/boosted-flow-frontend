# Activities Feature Architecture

## 1. High-Level Purpose

Enables users to define activities (things they want to track time on) with a simple creation flow. Each activity has its own dedicated page for tracking time and viewing history.

---

## 2. Component & Hook Hierarchy

```
src/features/activities/
├── types.ts                              # TypeScript definitions
├── api.ts                                # API endpoints using API_ENDPOINTS
├── components/
│   └── ActivityForm.tsx                  # Reusable activity creation form
└── hooks/
    ├── index.ts                          # Hook exports
    ├── use-activity.ts                   # TanStack Query for single activity
    ├── use-activities.ts                 # TanStack Query for listing
    └── use-create-activity.ts            # TanStack Mutation for creation

src/routes/_auth/
├── activities.index.tsx                  # Activities list page
└── activities.$activityId.tsx            # Activity detail page with timer
```

**Pages:**
- `/activities` — List all activities, create new ones
- `/activities/:activityId` — View/track single activity with its time entries

---

## 3. State & Data Flow

### **Loading Activities**
1. `useActivities()` fetches `GET /activities`
2. Cache key: `['activities', { includeArchived }]`
3. Returns `Activity[]` — sorted by `createdAt DESC` from backend
4. 60min `staleTime` — activities rarely change

### **Loading Single Activity**
1. `useActivity(id)` fetches `GET /activities/:id`
2. Cache key: `['activities', id]`
3. Returns `Activity`
4. 60min `staleTime`

### **Creating Activity**
1. User types activity name in `ActivityForm`
2. On submit → `useCreateActivity().mutate({ name })`
3. `activitiesApi.create()` → POST `/activities`
4. **onSuccess:** Invalidates `['activities']` → list re-fetches
5. **Redirect:** Navigate to `/activities/:newActivityId`

---

## 4. Key Patterns & Configuration

| Pattern | Implementation |
|---------|----------------|
| **Query Key Strategy** | `['activities', { includeArchived }]` for list, `['activities', id]` for single |
| **Stale Time** | 60min — activities don't change frequently |
| **Suggestions** | `ACTIVITY_SUGGESTIONS` constant for common activities |
| **No Optimistic UI** | Simple invalidation on success is sufficient |
| **Redirect on Create** | Navigate to activity page after creation |

---

## 5. Public Interface

### **Hooks**

#### `useActivity(id)`
```typescript
Params: id: string
Returns: UseQueryResult<Activity>
```

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

#### `activitiesApi.get(id)`
```typescript
GET /activities/:id
Returns: Promise<Activity>
```

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
- **First activity redirects** — after creating first activity, user goes to its page
- **Activity page shows timer** — start/stop tracking directly on activity page

### **Cache Behavior**
- **60min staleTime** — manual refresh not needed
- **Invalidate on create** — ensures list shows new activity immediately

### **TypeScript Strictness**
- **All API responses typed** — `Activity` from `types.ts`
- **Query keys are tuples** — `['activities', opts]` or `['activities', id]`
