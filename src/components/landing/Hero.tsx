import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { NavLink } from '@/components/primitives/nav-link';

export default function Hero() {
  return (
    <div className="mt-32 text-center max-w-4xl mx-auto relative px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cream/5 blur-[120px] rounded-full -z-10" />

      <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
        Your shortcut to everything.
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
        A collection of powerful productivity tools all within an extendable launcher. Fast, ergonomic and reliable.
      </p>

      <div className="flex items-center justify-center gap-4">
        <Button asChild variant="primary" size="lg">
          <Link to="/register">Get Started</Link>
        </Button>
        <Button asChild variant="tertiary" className="font-bold">
          <NavLink to="/login">Log in</NavLink>
        </Button>
      </div>
    </div>
  );
}
