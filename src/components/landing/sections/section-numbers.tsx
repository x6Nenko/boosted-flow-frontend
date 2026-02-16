import { useInView, useCountUp } from '@/components/landing/shared/hooks';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SectionNumbers() {
  const { ref, isInView } = useInView(0.2);

  const rating = useCountUp(4.2, 2000, isInView, 1);
  const distractions = useCountUp(1.3, 2000, isInView, 1);
  const sessions = useCountUp(47, 2000, isInView, 0);

  return (
    <>
      <section ref={ref} className="py-32 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground/80 mb-16 text-center">
            What you'll learn about yourself
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 text-center">
            <div
              className={cn(
                'transition-all duration-700',
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
            >
              <p className="text-6xl md:text-7xl font-bold font-mono tracking-tighter text-foreground tabular-nums">
                {rating.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground mt-3">avg focus rating</p>
            </div>

            <div
              className={cn(
                'transition-all duration-700',
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
              style={{ transitionDelay: isInView ? '200ms' : '0ms' }}
            >
              <p className="text-6xl md:text-7xl font-bold font-mono tracking-tighter text-foreground tabular-nums">
                {distractions.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground mt-3">avg distractions</p>
            </div>

            <div
              className={cn(
                'transition-all duration-700',
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
              style={{ transitionDelay: isInView ? '400ms' : '0ms' }}
            >
              <p className="text-6xl md:text-7xl font-bold font-mono tracking-tighter text-foreground tabular-nums">
                {Math.round(sessions)}
              </p>
              <p className="text-sm text-muted-foreground mt-3">sessions this month</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-32 px-4 text-center">
        <p className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Know yourself.{' '}
          <span className="text-muted-foreground">Not your timesheet.</span>
        </p>
        <p className="text-sm text-muted-foreground/50 mb-10">
          Designer for you. Not your boss.
        </p>
        <Button asChild variant="primary" size="lg" className="px-8">
          <Link to="/register">Boost your flow</Link>
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          No bullshit <span className="mx-1.5 text-border">·</span> Dead simple
        </p>
      </section>
    </>
  );
}
