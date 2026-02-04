import { cn } from "@/lib/utils";
import * as React from "react";

interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlassContainer = React.forwardRef<HTMLDivElement, GlassContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-surface-low/80 backdrop-blur-md border border-border rounded-2xl",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassContainer.displayName = "GlassContainer";

export { GlassContainer };
