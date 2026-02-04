# Design System Documentation

## Folder Structure

```
src/
└── components/
    ├── ui/              <-- Standard shadcn components (Button, Input, etc.)
    ├── primitives/      <-- Custom atoms (GlassContainer, NavLink, Logo)
    ├── layout/          <-- Structural pieces (Navbar, Sidebar, Footer)
    └── features/        <-- Domain-specific logic (Timer, DistractionList)
```

## Available Primitives

### GlassContainer
Floating container with glassmorphism effect.

```tsx
import { GlassContainer } from "@/components/primitives/glass-container"

<GlassContainer className="px-5 py-3">
  Content
</GlassContainer>
```

**Base styles:** `bg-surface-low/80 backdrop-blur-md border border-border rounded-2xl`

### NavLink
Navigation link with active state handling.

```tsx
import { NavLink } from "@/components/primitives/nav-link"

<NavLink to="/dashboard">Dashboard</NavLink>
```

### MobileNavLink
Mobile navigation link with icon support.

```tsx
import { MobileNavLink } from "@/components/primitives/nav-link"
import { Home } from "lucide-react"

<MobileNavLink to="/dashboard" icon={<Home size={20} />}>
  Dashboard
</MobileNavLink>
```

## Senior Implementation Tips

### Use cn for Flexibility
All primitives use the `cn` utility for style composition. This allows runtime overrides without breaking base styles.

```tsx
import { cn } from "@/lib/utils"

// Base styles + override
<GlassContainer className="max-w-[1200px] mx-auto">
  Content
</GlassContainer>
```

### Keep Logic Pure
Primitives should be "dumb" visual components only. No domain logic.

**Good:** `NavLink` just handles active states and styling.  
**Bad:** `NavLink` checking if user is in "Focus Mode".

Domain-specific logic belongs in `features/` or `layout/`.

### Button Strategy

**Primary (Cream):** Default actions, forms, general CTAs  
**Primary + White Glow:** High-emphasis conversion points (navbar Sign Up)  
**Ghost:** Secondary actions, icon buttons  
**Outline:** Alternative actions on dark backgrounds

Primary color is defined in `styles.css` as `--color-cream` (#FFF4BD).

### Design Tokens

All styling uses CSS custom properties from `styles.css`:

- `--color-black`: #080708 (background)
- `--color-cream`: #FFF4BD (primary action)
- `--color-white`: #FCFCFA (foreground)
- `--color-surface-low`: #111011 (containers)
- `--color-surface-med`: #1A191A (hover states)
- `--color-border-subtle`: #222122 (borders)
- `--color-text-muted`: #737373 (secondary text)

## Component Patterns

### Glass Navbar Pattern
```tsx
<GlassContainer className="sticky top-6 z-50 flex items-center justify-between">
  <Logo />
  <nav className="hidden md:flex gap-6">
    <NavLink to="/">Home</NavLink>
  </nav>
  <Actions />
</GlassContainer>
```

### Mobile Sidebar Pattern
Use `MobileNavLink` with icons for mobile navigation. Close sidebar via `onClick` handler.

## Adding New Primitives

1. Create file in `components/primitives/`
2. Use `React.forwardRef` for ref forwarding
3. Extend `React.HTMLAttributes` for standard props
4. Use `cn()` for className composition
5. Export as named export
6. Set `displayName` for debugging
