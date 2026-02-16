import { Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

function useMockTimer() {
  const [seconds, setSeconds] = useState(9433); // Start at 02:37:13
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function SectionHero() {
  const time = useMockTimer();

  return (
    <section className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] relative px-4">
      {/* Cream glow behind timer */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cream/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Tiny label */}
      <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground/80 mb-4">
        Currently tracking
      </p>

      {/* Activity name */}
      {/* <p className="text-base text-muted-foreground mb-4">
        Deep work — <span className="text-foreground">Portfolio redesign</span>
      </p> */}

      {/* Stats */}
      <div className="flex items-center gap-6 mb-8">
        {/* Rating */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-card/50">
          <div className="flex">
            {[1, 2, 3, 4].map((i) => (
              <Star key={i} size={12} className="text-primary fill-primary" />
            ))}
            <Star size={12} className="text-muted-foreground/30" />
          </div>
          <span className="text-xs text-muted-foreground">4.2 avg</span>
        </div>

        {/* Distractions */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-card/50">
          <div className="w-1.5 h-1.5 rounded-full bg-clean/60" />
          <span className="text-xs text-muted-foreground">2 distractions</span>
        </div>
      </div>

      {/* The Clock */}
      <div className="relative mb-16">
        <h1 className="text-7xl sm:text-8xl md:text-[10rem] font-mono font-medium tracking-tighter tabular-nums text-foreground leading-none select-none">
          {time}
        </h1>
        {/* Subtle pulse dot */}
        <div className="absolute -right-4 top-4 md:-right-6 md:top-6">
          <div className="w-2.5 h-2.5 rounded-full bg-cream animate-pulse" />
        </div>
      </div>

      {/* Tagline */}
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground/80 mb-10 leading-[1.1]">
        Track what
        <span className="bg-clip-text text-transparent bg-linear-to-r from-cream to-cream/60"> matters</span>.
      </h1>

      {/* CTA */}
      <Button asChild variant="primary" size="lg" className="px-8">
        <Link to="/register">Start tracking</Link>
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        Solo devs <span className="mx-1.5 text-border">·</span> Freelancers <span className="mx-1.5 text-border">·</span> ADHD brains
      </p>
    </section>
  );
}
