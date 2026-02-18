import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useActivities } from '@/features/activities/hooks';
import { ActivityForm } from '@/features/activities/components/ActivityForm';
import { useRegisterCommands } from '@/features/command-palette';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_auth/activities/')({
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const navigate = useNavigate();
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data: activities, isLoading } = useActivities(includeArchived);

  const activityCommands = useMemo(() => {
    if (!activities) return [];
    return activities.map((activity) => ({
      id: `activities.open.${activity.id}`,
      group: 'Activities',
      label: activity.archivedAt ? `${activity.name} (archived)` : activity.name,
      run: () => navigate({
        to: '/activities/$activityId',
        params: { activityId: activity.id },
      }),
    }));
  }, [activities, navigate]);

  useRegisterCommands(activityCommands);

  const handleActivityCreated = (id: string) => {
    navigate({ to: '/activities/$activityId', params: { activityId: id } });
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="rounded-xl border border-border bg-card max-sm:p-4 p-6 mb-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="rounded-xl border border-border bg-card max-sm:p-4 p-6">
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Activities</h1>

      {/* Create Activity */}
      <div className="rounded-xl border border-border bg-card max-sm:p-4 p-6 mb-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Create Activity</h2>
        <ActivityForm onCreated={handleActivityCreated} />
      </div>

      {/* Activities List */}
      <div className="rounded-xl border border-border bg-card max-sm:p-4 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">All Activities</h2>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={includeArchived}
              onCheckedChange={(checked) => setIncludeArchived(checked === true)}
            />
            <span>Show archived</span>
          </label>
        </div>
        {activities && activities.length > 0 ? (
          <div className="space-y-2">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                to="/activities/$activityId"
                params={{ activityId: activity.id }}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm hover:bg-accent transition-colors"
              >
                <span className="text-foreground">{activity.name}</span>
                {activity.archivedAt && (
                  <span className="ml-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-500">
                    Archived
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No activities yet. Create one above.</p>
        )}
      </div>
    </div>
  );
}
