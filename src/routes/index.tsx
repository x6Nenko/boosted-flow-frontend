import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { authStore } from '@/features/auth/auth-store';
import logo from '../logo.svg';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    // Redirect authenticated users to dashboard
    if (authStore.isAuthenticated()) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: App,
});

function App() {
  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        <img
          src={logo}
          className="h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
          alt="logo"
        />
        <p>
          Edit <code>src/routes/index.tsx</code> and save to reload.
        </p>

        <div className="mt-8 flex gap-4">
          <Link
            to="/login"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
          >
            Register
          </Link>
        </div>

        <div className="mt-8 flex gap-4">
          <a
            className="text-[#61dafb] hover:underline"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <a
            className="text-[#61dafb] hover:underline"
            href="https://tanstack.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn TanStack
          </a>
        </div>
      </header>
    </div>
  );
}
