import { createFileRoute } from '@tanstack/react-router';
import { useAuth, useLogout } from '@/features/auth/hooks';

export const Route = createFileRoute('/_auth/dashboard')({
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white px-6 py-8 shadow">
          <div className="mb-8 border-b border-gray-200 pb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back! You're successfully authenticated.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">User Information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>User ID: {user?.userId}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Session Status</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your session is active and protected with JWT authentication
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800">
                  Active
                </span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
              >
                {logout.isPending ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
