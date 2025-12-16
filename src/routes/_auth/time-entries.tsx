import { createFileRoute } from '@tanstack/react-router';
import { TimeTracker } from '@/features/time-entries/components/TimeTracker';

export const Route = createFileRoute('/_auth/time-entries')({
  component: TimeEntriesPage,
});

function TimeEntriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Time Tracker</h1>
        </div>
        <TimeTracker />
      </div>
    </div>
  );
}
