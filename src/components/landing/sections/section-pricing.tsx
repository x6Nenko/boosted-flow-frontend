import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useInView } from '@/components/landing/shared/hooks';
import { cn } from '@/lib/utils';

const INCLUDES = [
  'Activities & Sessions',
  'Stopwatch & Pomodoro timers',
  'Intention & Reflection notes',
  'Distraction tracking',
  'Heatmap, streaks & analytics',
  'All new upcoming features',
];

export function SectionPricing() {
  const { ref, isInView } = useInView(0.15);

  return (
    <section ref={ref} className="py-32 px-4">
      <div className="max-w-sm mx-auto">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground/80 mb-16 text-center">
          Pricing
        </p>

        {/* Glow card */}
        <div className="relative">
          {/* Cream glow behind card */}
          <div className="absolute -inset-4 bg-cream/5 blur-[60px] rounded-3xl pointer-events-none" />

          <h2 className="text-2xl text-center md:text-3xl font-bold text-foreground mb-8">
            Everything in.{' '} <br />
            <span className="text-muted-foreground">One price.</span>
          </h2>

          <div
            className={cn(
              'relative rounded-2xl border border-cream/15 bg-card/60 backdrop-blur-sm p-8 transition-all duration-700',
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-base font-semibold text-foreground">Yearly plan</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-cream/10 text-cream border border-cream/20">
                50% off — Launch sale
              </span>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold font-mono tracking-tighter text-foreground">$12</span>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">/year</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground/80 mt-2">
                <span className="line-through">$24</span>
                <span className="mx-1.5 text-border">·</span>
                $1/mo during launch
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-8">
              {INCLUDES.map((feature, i) => (
                <li
                  key={feature}
                  className={cn(
                    'flex items-center gap-2.5 text-sm text-muted-foreground transition-all duration-500',
                    isInView ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{ transitionDelay: isInView ? `${200 + i * 60}ms` : '0ms' }}
                >
                  <Check size={14} className="text-cream/60 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button asChild variant="primary" size="lg" className="w-full">
              <Link to="/register">Start 14-day free trial</Link>
            </Button>
            <p className="text-xs text-muted-foreground/50 text-center mt-3">
              No credit card required
            </p>
          </div>
        </div>

        {/* Student note */}
        {/* <p
          className={cn(
            'text-sm text-muted-foreground/40 text-center mt-10 transition-all duration-700',
            isInView ? 'opacity-100' : 'opacity-0'
          )}
          style={{ transitionDelay: isInView ? '500ms' : '0ms' }}
        >
          Student? Contact{' '}
          <a href="mailto:support@boosted-flow.com" className="underline hover:text-foreground transition-colors duration-150">
            support@boosted-flow.com
          </a>{' '}
          for extra 25% discount ($9/yr)
        </p> */}
      </div>
    </section>
  );
}
