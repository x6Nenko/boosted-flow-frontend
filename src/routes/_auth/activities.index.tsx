import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useActivities } from '@/features/activities/hooks';
import { ActivityForm } from '@/features/activities/components/ActivityForm';

export const Route = createFileRoute('/_auth/activities/')({
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const navigate = useNavigate();
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data: activities, isLoading } = useActivities(includeArchived);

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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">All Activities</h2>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
            Show archived
          </label>
        </div>
        {activities && activities.length > 0 ? (
          <div className="space-y-2">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                to="/activities/$activityId"
                params={{ activityId: activity.id }}
                className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <span>{activity.name}</span>
                {activity.archivedAt && (
                  <span className="text-xs text-gray-500">(archived)</span>
                )}
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
