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

## Spacing Guidelines

### Spacing Scale Reference

| Token | Value | Common Usage |
|-------|-------|--------------|
| `gap-1` | 4px | Tight icon+text pairs, legend items |
| `gap-1.5` | 6px | Compact related elements |
| `gap-2` | 8px | Button groups, form field clusters |
| `gap-3` | 12px | Logo with text, tight card content |
| `gap-4` | 16px | Card internal spacing, form sections |
| `gap-6` | 24px | **Major layout sections** (navbar items, page sections) |
| `gap-8` | 32px | Large page sections |

### Decision Rules

1. **Major layout divisions** → `gap-6` (24px)
2. **Related component groups** → `gap-2` to `gap-4` (8-16px)
3. **Icon + text pairs** → `gap-1` to `gap-1.5` (4-6px)
4. **Section margins** → `mb-4` (16px) for headers, `mb-2` (8px) for tight spacing

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

## Implementation Tips

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

| Variant | Usage | Color |
|---------|-------|-------|
| **primary** | High-intent conversion (Get Started, Upgrade, Save) | White Glass |
| **action** | Core app functionality (Start/Stop, Add Task) | Brand Cream |
| **secondary** | Non-critical path (Cancel, Settings) | Muted Surface |
| **ghost** | Icon buttons, subtle actions | Transparent |
| **outline** | Alternative actions | Border only |

**Color tokens:**
- `--color-white` (#FCFCFA) - Primary/high-emphasis
- `--color-cream` (#FFF4BD) - Action/brand
- `--color-surface-med` (#1A191A) - Secondary/muted

**Contextual Overrides:**
Ghost buttons default to cream hover (`accent-foreground`). For landing page CTAs, override to white:

```tsx
// Landing page - white hover
<Button variant="ghost" className="hover:text-white">
  Log in
</Button>

// App context - cream hover (default)
<Button variant="ghost">
  Cancel
</Button>
```

### Auth Page Color Strategy

Auth pages (login, register, forgot-password, reset-password) use **monochrome white** instead of brand cream to create a clean, focused experience before users enter the app.

**Pattern:**
- Submit buttons: `variant="primary"` (white glass)
- Text links: `text-white hover:text-white/80`
- Cream color introduced only after authentication (inside the app)

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
