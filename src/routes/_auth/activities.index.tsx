import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useActivities } from '@/features/activities/hooks';
import { ActivityForm } from '@/features/activities/components/ActivityForm';

export const Route = createFileRoute('/_auth/activities/')({
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const navigate = useNavigate();
  const { data: activities, isLoading } = useActivities();

  const handleActivityCreated = (id: string) => {
    navigate({ to: '/activities/$activityId', params: { activityId: id } });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Activities</h1>

      {/* Create Activity */}
      <div className="rounded border border-gray-200 bg-white p-4 mb-4">
        <h2 className="mb-3 text-sm font-medium text-gray-900">Create Activity</h2>
        <ActivityForm onCreated={handleActivityCreated} />
      </div>

      {/* Activities List */}
      <div className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-gray-900">All Activities</h2>
        {activities && activities.length > 0 ? (
          <div className="space-y-2">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                to="/activities/$activityId"
                params={{ activityId: activity.id }}
                className="block rounded border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
              >
                {activity.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No activities yet. Create one above.</p>
        )}
      </div>
    </div>
  );
}
