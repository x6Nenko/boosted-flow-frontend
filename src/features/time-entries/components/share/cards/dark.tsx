import type { ShareCardProps } from '../types';
import { Stars, distractionLabel } from '../shared';

export function DarkCard({ data }: ShareCardProps) {
  return (
    <div className="w-full mx-auto rounded-xl bg-card p-6 text-center border border-border">
      {/* <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-6">
        Session Complete
      </p> */}

      <h2 className="text-xl font-bold text-foreground truncate mb-1">{data.activityName}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {data.date} · {data.timeRange}
      </p>

      <p className="text-5xl font-bold font-mono text-primary tracking-tight mb-6">
        {data.duration}
      </p>

      <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        {data.rating !== null && (
          <Stars rating={data.rating} filled="text-primary" empty="text-muted" />
        )}
        <span>{distractionLabel(data.distractionCount)}</span>
      </div>

      <div className="mt-4 pt-2 border-t border-border w-40 mx-auto">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
          Boosted Flow
        </span>
      </div>
    </div>
  );
}
