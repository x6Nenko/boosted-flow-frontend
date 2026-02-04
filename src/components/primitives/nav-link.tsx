import { Link, type LinkProps } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import * as React from "react";

interface NavLinkProps extends Omit<LinkProps, "className" | "activeProps"> {
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ children, className, activeClassName, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        className={cn(
          "text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200",
          className
        )}
        activeProps={{
          className: cn(
            "text-[15px] font-medium text-foreground transition-colors duration-200",
            activeClassName
          ),
        }}
        {...props}
      >
        {children}
      </Link>
    );
  }
);
NavLink.displayName = "NavLink";

interface MobileNavLinkProps extends Omit<LinkProps, "className" | "activeProps"> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
}

const MobileNavLink = React.forwardRef<HTMLAnchorElement, MobileNavLinkProps>(
  ({ children, icon, className, activeClassName, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors mb-1 text-foreground",
          className
        )}
        activeProps={{
          className: cn(
            "flex items-center gap-3 p-3 rounded-lg bg-accent transition-colors mb-1 text-accent-foreground",
            activeClassName
          ),
        }}
        {...props}
      >
        {icon}
        <span>{children}</span>
      </Link>
    );
  }
);
MobileNavLink.displayName = "MobileNavLink";

export { NavLink, MobileNavLink };
