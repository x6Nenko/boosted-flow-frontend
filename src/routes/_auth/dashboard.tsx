import { createFileRoute } from '@tanstack/react-router';
import { TimeTracker } from '@/features/time-entries/components/TimeTracker';
import { useLogout } from '@/features/auth/hooks';

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Time Tracker</h1>
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            {logout.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
        <TimeTracker />
      </div>
    </div>
  );
}
