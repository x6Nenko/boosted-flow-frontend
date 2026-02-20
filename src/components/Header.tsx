import { Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Menu, Search, X, User, LogOut } from 'lucide-react'
import { commandPaletteStore } from '@/features/command-palette'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useLogout } from '@/features/auth/hooks'
import { Button } from '@/components/ui/button'
import { GlassContainer } from '@/components/primitives/glass-container'
import { NavLink, MobileNavLink } from '@/components/primitives/nav-link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

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
      className="gap-1 rounded-md max-sm:hidden"
    >
      <Search size={14} />
      <kbd className="text-xs">{isMac ? '⌘ + K' : 'Ctrl + K'}</kbd>
    </Button>
  );
}

export default function Header() {
  const { isAuthenticated } = useAuth();
  const logout = useLogout();
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
              <Button asChild variant="tertiary" className="px-0 font-medium">
                <NavLink to="/dashboard">Dashboard</NavLink>
              </Button>
              <Button asChild variant="tertiary" className="px-0 font-medium">
                <NavLink to="/activities">Activities</NavLink>
              </Button>
              <Button asChild variant="tertiary" className="px-0 font-medium">
                <NavLink to="/analytics">Analytics</NavLink>
              </Button>
            </>
          )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <SearchButton />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="max-md:hidden hover:text-cream"
                    aria-label="Profile menu"
                  >
                    <User size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    variant="destructive"
                    className='cursor-pointer'
                  >
                    <LogOut size={16} />
                    {logout.isPending ? 'Logging out...' : 'Log out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="tertiary" className="hidden md:block font-bold">
                <NavLink to="/login">Log in</NavLink>
              </Button>

              <Button asChild variant="primary" className="hidden md:inline-flex">
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu Button */}
          <Button
            onClick={() => setIsOpen(true)}
            variant="ghost"
            size="icon-sm"
            className="md:hidden hover:text-cream"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </Button>
        </div>
      </GlassContainer>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" showCloseButton={false} className="gap-0">
          <SheetHeader className="flex-row items-center justify-between border-b border-border">
            <SheetTitle>Menu</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" className="hover:text-cream" aria-label="Close menu">
                <X size={20} />
              </Button>
            </SheetClose>
          </SheetHeader>

          <nav className="flex-1 p-4">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2 h-full">
                <MobileNavLink to="/dashboard" onClick={() => setIsOpen(false)}>
                  Dashboard
                </MobileNavLink>
                <MobileNavLink to="/activities" onClick={() => setIsOpen(false)}>
                  Activities
                </MobileNavLink>
                <MobileNavLink to="/analytics" onClick={() => setIsOpen(false)}>
                  Analytics
                </MobileNavLink>
                <Button
                  onClick={() => {
                    logout.mutate();
                    setIsOpen(false);
                  }}
                  disabled={logout.isPending}
                  variant="secondary"
                  className="w-full mt-auto justify-start gap-2"
                >
                  <LogOut size={16} />
                  {logout.isPending ? 'Logging out...' : 'Log out'}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button asChild variant="tertiary" className="w-full font-bold">
                  <MobileNavLink to="/login" onClick={() => setIsOpen(false)}>
                    Log in
                  </MobileNavLink>
                </Button>
                <Button asChild variant="primary" className="w-full">
                  <Link to="/register" onClick={() => setIsOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
