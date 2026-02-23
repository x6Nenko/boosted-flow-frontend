import { cn } from '@/lib/utils';

export function Stars({
  rating,
  filled,
  empty,
  className,
}: {
  rating: number;
  filled: string;
  empty: string;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-0.5', className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? filled : empty}>
          ★
        </span>
      ))}
    </div>
  );
}

export function distractionLabel(count: number) {
  return `${count} ${count === 1 ? 'distraction' : 'distractions'}`;
}

/** Always format with English month names regardless of browser locale */
export function formatDateEn(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
