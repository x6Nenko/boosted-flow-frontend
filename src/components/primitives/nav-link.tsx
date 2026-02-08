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
          "text-sm text-muted-foreground hover:text-foreground transition-colors duration-200",
          className
        )}
        activeProps={{
          className: cn(
            "text-sm text-foreground transition-colors duration-200",
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
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
}

const MobileNavLink = React.forwardRef<HTMLAnchorElement, MobileNavLinkProps>(
  ({ children, className, activeClassName, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        className={cn(
          "flex items-center py-3 rounded-lg transition-colors duration-200 text-sm text-muted-foreground hover:text-foreground",
          className
        )}
        activeProps={{
          className: cn(
            "flex items-center py-3 rounded-lg transition-colors duration-200 text-sm text-foreground",
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
MobileNavLink.displayName = "MobileNavLink";

export { NavLink, MobileNavLink };
