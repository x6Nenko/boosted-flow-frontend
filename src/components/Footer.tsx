import { Link } from '@tanstack/react-router'

export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[1200px] px-4 max-sm:px-2 py-6 flex items-center justify-between gap-4 border-t border-border/20 mt-auto">
      <p className="text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Boosted Flow
      </p>
      <Link to="/legal" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
        Legal & Policies
      </Link>
    </footer>
  )
}
