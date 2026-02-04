import { Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { BarChart3, Home, Layers, Menu, Search, X } from 'lucide-react'
import { commandPaletteStore } from '@/features/command-palette'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { GlassContainer } from '@/components/primitives/glass-container'
import { NavLink, MobileNavLink } from '@/components/primitives/nav-link'

function SearchButton() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const nav = navigator as any;
    const isMacPlatform = nav.userAgentData?.platform === 'macOS' || nav.userAgent.includes('Mac');
    setIsMac(isMacPlatform);
  }, []);

  return (
    <Button
      type="button"
      onClick={() => commandPaletteStore.open()}
      variant="ghost"
      size="sm"
      className="gap-1 rounded-full"
    >
      <Search size={14} />
      <kbd className="text-xs">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
    </Button>
  );
}

export default function Header() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Navbar Container with Glass Effect */}
      <GlassContainer className="mx-auto mt-6 w-full max-w-[1200px] px-5 py-3.5 flex items-center justify-between sticky top-6 z-50">
        {/* Left Side: Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="text-cream">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" stroke-dasharray="12 12" transform="rotate(30 12 12)" />
              <path d="M10 12H14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">Boosted Flow</span>
        </Link>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/activities">Activities</NavLink>
              <NavLink to="/analytics">Analytics</NavLink>
            </>
          )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <SearchButton />
          ) : (
            <>
              <NavLink
                to="/login"
                className="hidden sm:block"
              >
                Log in
              </NavLink>

              <Button asChild variant="primary">
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu Button */}
          <Button
            onClick={() => setIsOpen(true)}
            variant="ghost"
            size="icon-sm"
            className="md:hidden hover:text-white"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </Button>
        </div>
      </GlassContainer>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-background border-r border-border shadow-xl z-50 transform transition-transform duration-200 flex flex-col md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-semibold text-foreground">Menu</span>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon-sm"
            className="hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </Button>
        </div>

        <nav className="flex-1 p-4">
          {isAuthenticated ? (
            <>
              <MobileNavLink to="/dashboard" icon={<Home size={20} />} onClick={() => setIsOpen(false)}>
                Dashboard
              </MobileNavLink>
              <MobileNavLink to="/activities" icon={<Layers size={20} />} onClick={() => setIsOpen(false)}>
                Activities
              </MobileNavLink>
              <MobileNavLink to="/analytics" icon={<BarChart3 size={20} />} onClick={() => setIsOpen(false)}>
                Analytics
              </MobileNavLink>
            </>
          ) : (
            <div className="space-y-2">
              <Button asChild variant="ghost" className="w-full hover:text-white">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  Log in
                </Link>
              </Button>
              <Button asChild variant="primary" className="w-full">
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  Get Started
                </Link>
              </Button>
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
