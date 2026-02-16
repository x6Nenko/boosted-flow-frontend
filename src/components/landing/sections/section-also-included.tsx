import { useInView } from '@/components/landing/shared/hooks';
import { Timer, RotateCcw, Flame, Search, Star, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const FEATURES = [
  { icon: Timer, label: 'Stopwatch' },
  { icon: RotateCcw, label: 'Pomodoro' },
  { icon: Flame, label: 'Streaks' },
  { icon: Search, label: '⌘K palette' },
  { icon: Star, label: 'Session notes' },
  { icon: Brain, label: 'ADHD-friendly' },
];

export function SectionAlsoIncluded() {
  const { ref, isInView } = useInView(0.15);

  return (
    <section ref={ref} className="py-32 px-4">
      <div className="max-w-lg mx-auto">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground/40 mb-12 text-center">
          Also included
        </p>

        <div className="grid grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.label}
              className={cn(
                'flex flex-col items-center gap-3 transition-all duration-500',
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
              style={{ transitionDelay: isInView ? `${i * 80}ms` : '0ms' }}
            >
              <div className="w-14 h-14 rounded-xl border border-border bg-card/50 flex items-center justify-center">
                <feature.icon size={24} strokeWidth={1.5} className="text-cream/80" />
              </div>
              <span className="text-xs text-muted-foreground">{feature.label}</span>
            </div>
          ))}
        </div>

        <p
          className={cn(
            'text-sm text-muted-foreground/40 text-center mt-12 transition-all duration-700',
            isInView ? 'opacity-100' : 'opacity-0'
          )}
          style={{ transitionDelay: isInView ? '600ms' : '0ms' }}
        >
          No screenshots. No GPS. No manager dashboards. No surveillance.
        </p>
      </div>
    </section>
  );
}
