import { Link } from '@tanstack/react-router'

import { useState, useEffect } from 'react'
import { BarChart3, Home, Layers, Menu, Search, X } from 'lucide-react'
import { commandPaletteStore } from '@/features/command-palette'

function SearchButton() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const nav = navigator as any;
    // Check the modern API first (userAgentData), then fall back to the string check
    const isMacPlatform = nav.userAgentData?.platform === 'macOS' || nav.userAgent.includes('Mac');
    setIsMac(isMacPlatform);
  }, []);

  return (
    <button
      type="button"
      onClick={() => commandPaletteStore.open()}
      className="flex items-center gap-1 rounded-full bg-gray-700 px-2 py-1 text-sm hover:bg-gray-600 transition-colors"
    >
      <Search size={14} className="text-gray-400" />
      <kbd className="text-xs text-gray-400">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
    </button>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinkClass =
    'flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors'
  const navLinkActiveClass =
    'flex items-center gap-2 px-3 py-2 rounded text-sm bg-indigo-600 hover:bg-indigo-700 transition-colors'

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-gray-800 text-white">
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-gray-700 rounded transition-colors md:hidden"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <Link to="/dashboard" className="ml-2 md:ml-0 text-lg font-semibold">
            Boosted Flow
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            to="/dashboard"
            className={navLinkClass}
            activeProps={{ className: navLinkActiveClass }}
          >
            <Home size={18} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/activities"
            className={navLinkClass}
            activeProps={{ className: navLinkActiveClass }}
          >
            <Layers size={18} />
            <span>Activities</span>
          </Link>
          <Link
            to="/analytics"
            className={navLinkClass}
            activeProps={{ className: navLinkActiveClass }}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </Link>
          <SearchButton />
        </nav>

        {/* Mobile Search Button */}
        <div className="md:hidden">
          <SearchButton />
        </div>
      </header>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white shadow-lg z-50 transform transition-transform duration-200 flex flex-col md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <span className="font-semibold">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4">
          <Link
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition-colors mb-1"
            activeProps={{ className: 'flex items-center gap-3 p-3 rounded bg-indigo-600 hover:bg-indigo-700 transition-colors mb-1' }}
          >
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/activities"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition-colors mb-1"
            activeProps={{ className: 'flex items-center gap-3 p-3 rounded bg-indigo-600 hover:bg-indigo-700 transition-colors mb-1' }}
          >
            <Layers size={20} />
            <span>Activities</span>
          </Link>
          <Link
            to="/analytics"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition-colors mb-1"
            activeProps={{ className: 'flex items-center gap-3 p-3 rounded bg-indigo-600 hover:bg-indigo-700 transition-colors mb-1' }}
          >
            <BarChart3 size={20} />
            <span>Analytics</span>
          </Link>
        </nav>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
