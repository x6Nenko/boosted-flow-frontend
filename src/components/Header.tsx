import { Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { BarChart3, Home, Layers, Menu, Search, X } from 'lucide-react'
import { commandPaletteStore } from '@/features/command-palette'
import { useAuth } from '@/features/auth/hooks/use-auth'

function SearchButton() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const nav = navigator as any;
    const isMacPlatform = nav.userAgentData?.platform === 'macOS' || nav.userAgent.includes('Mac');
    setIsMac(isMacPlatform);
  }, []);

  return (
    <button
      type="button"
      onClick={() => commandPaletteStore.open()}
      className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 transition-colors"
    >
      <Search size={14} />
      <kbd className="text-xs">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
    </button>
  );
}

export default function Header() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Navbar Container with Glass Effect */}
      <nav className="mx-auto mt-6 w-full max-w-[1200px] bg-[var(--color-surface-low)]/80 backdrop-blur-md border border-[var(--color-border-subtle)] rounded-2xl px-5 py-3.5 flex items-center justify-between sticky top-6 z-50">
        {/* Left Side: Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="text-cream">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" stroke-dasharray="12 12" transform="rotate(30 12 12)"/>
              <path d="M10 12H14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Boosted Flow</span>
        </Link>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                className="text-[15px] font-medium text-gray-400 hover:text-white transition-colors duration-200"
                activeProps={{ className: 'text-[15px] font-medium text-white transition-colors duration-200' }}
              >
                Dashboard
              </Link>
              <Link
                to="/activities"
                className="text-[15px] font-medium text-gray-400 hover:text-white transition-colors duration-200"
                activeProps={{ className: 'text-[15px] font-medium text-white transition-colors duration-200' }}
              >
                Activities
              </Link>
              <Link
                to="/analytics"
                className="text-[15px] font-medium text-gray-400 hover:text-white transition-colors duration-200"
                activeProps={{ className: 'text-[15px] font-medium text-white transition-colors duration-200' }}
              >
                Analytics
              </Link>
            </>
          )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <SearchButton />
          ) : (
            <>
              <Link
                to="/login"
                className="text-[15px] font-medium text-gray-400 hover:text-white transition-colors duration-200 hidden sm:block"
              >
                Log in
              </Link>

              <Link
                to="/register"
                className="group relative flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                <span className="text-[15px]">Sign Up</span>
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors md:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-black border-r border-white/10 shadow-xl z-50 transform transition-transform duration-200 flex flex-col md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="font-semibold text-white">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors mb-1 text-white"
                activeProps={{ className: 'flex items-center gap-3 p-3 rounded-lg bg-white/20 transition-colors mb-1 text-white' }}
              >
                <Home size={20} />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/activities"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors mb-1 text-white"
                activeProps={{ className: 'flex items-center gap-3 p-3 rounded-lg bg-white/20 transition-colors mb-1 text-white' }}
              >
                <Layers size={20} />
                <span>Activities</span>
              </Link>
              <Link
                to="/analytics"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors mb-1 text-white"
                activeProps={{ className: 'flex items-center gap-3 p-3 rounded-lg bg-white/20 transition-colors mb-1 text-white' }}
              >
                <BarChart3 size={20} />
                <span>Analytics</span>
              </Link>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block w-full p-3 text-center rounded-lg text-white/80 hover:bg-white/10 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="block w-full p-3 text-center rounded-lg bg-white text-black hover:bg-white/90 transition-colors font-medium"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

