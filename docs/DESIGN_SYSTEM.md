# Design System Reference

## 1. Layout & Spacing
**Core Rule:** Major divisions use `gap-6` (24px). Related items use `gap-2` to `gap-4`.

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Tight icon+text pairs, legend items |
| `gap-1.5` | 6px | Compact icon+text pairs |
| `gap-2` | 8px | Icon+text pairs, button groups, form clusters |
| `gap-3` | 12px | Logo with text, tight card content |
| `gap-4` | 16px | Card internal spacing, form sections |
| `gap-6` | 24px | **Major layout** (Navbar, Sidebar, Page Sections) |
| `gap-8` | 32px | Large page sections |
| `mb-4` | 16px | Section headers (H2 spacing) |
| `mb-2` | 8px | Label to input spacing |

## 2. Layering (Z-Index)
**Strict Hierarchy:** Base < Dropdowns < Overlays < Navbar/Modals < Toast

| Token | Value | Component |
|-------|-------|-----------|
| `z-0` | 0 | Base content layer |
| `z-10` | 10 | Suggestion dropdowns, tooltips |
| `z-50` | 50 | **Sticky Navbar**, Modals, Overlays, Popovers |
| `z-60` | 60 | **Mobile Sidebar** (above overlays) |
| `z-100` | 100 | Toasts, Critical Alerts |

## 3. Typography & Semantics
**Font:** Inter (default). Text color defaults to `foreground`.

| Role | Token | Usage |
|------|-------|-------|
| **H1** | `text-2xl font-bold` | Page roots only. Pair with `mb-6`. |
| **H2** | `text-base font-semibold` | Section headers, card titles. Pair with `mb-4`. |
| **Body** | `text-base` | Default content. |
| **Small** | `text-sm` | Secondary info, timestamps. |
| **Muted** | `text-sm text-muted-foreground` | Labels, hints, disabled states. Pair with `mb-2`. |
| **Compact** | `text-xs` | Group headings, keyboard shortcuts, tiny labels. |

## 4. Surfaces & Cards
**Glassmorphism Rule:** Use `backdrop-blur` only on floating elements.

| Type | Classes | Usage |
|------|---------|-------|
| **Surface Card** | `rounded-xl border border-border bg-card p-6` | **Default.** Content-heavy sections, forms, metric cards. |
| **Glass Card** | `rounded-2xl border border-border bg-surface-low/80 backdrop-blur-md p-6` | Floating navs, toasts, overlays. |

## 5. Buttons & Actions

| Variant | Usage | Color Token |
|---------|-------|-------------|
| **primary** | High-intent conversion (Save, Upgrade, Get Started) | White Glass |
| **action** | Core app functionality (Start/Stop, Add Task) | Brand Cream |
| **secondary** | Non-critical path (Settings, Cancel) | Muted Surface |
| **ghost** | Icon buttons, subtle actions | Transparent |
| **outline** | Alternative actions | Border only |

* **Auth Pages:** Use **Monochrome White** for all buttons/links. No Brand Cream until inside the app.
* **Ghost Hover:** Defaults to Cream (`accent-foreground`). Use `hover:text-white` on dark landing pages.

## 6. Iconography
Source: `lucide-react`. Default stroke: `2px`.

| Size | Stroke | Usage |
|------|--------|-------|
| `14px` | 2px | Compact actions, search triggers |
| `16px` | 2px | Standard buttons, form inputs |
| `20px` | 2px | **Navigation**, mobile menu |
| `24px` | 1.5px | Feature icons, cards |
| `48px` | 1.5px | Hero icons, streak indicators |

## 7. Animation & Motion
**Rule:** Feedback < 200ms. Transitions < 300ms.

| Token | Value | Usage |
|-------|-------|-------|
| `duration-150` | 150ms | Micro-interactions (toggles, checks) |
| `duration-200` | 200ms | Hover states, color transitions, mobile sidebar |
| `duration-300` | 300ms | Modal entry, page transitions |
| `ease-out` | cubic-bezier(0, 0, 0.2, 1) | Standard for incoming elements |
| `ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | Symmetric transitions (toggles) |

## 8. Border Radius Hierarchy

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-xl` | 12px | Cards, containers, major sections |
| `rounded-lg` | 8px | List items, interactive rows |
| `rounded-md` | 4px | Inputs, small buttons, badges |
| `rounded-sm` | 2px | Heatmap cells, tiny elements |
| `rounded-full` | 9999px | Pills, avatars, circular buttons |

## 9. Primitives Reference
*New primitives must use `cn()` for class merging and `forwardRef` for DOM refs.*

* **GlassContainer:** Floating wrapper. `bg-surface-low/80 backdrop-blur-md border border-border rounded-2xl`.
* **NavLink:** Navigation link with active state handling.
* **MobileNavLink:** Uses `lucide` icons + text. Closes sidebar on click.

## Design Tokens

**Semantic mapping:**
- `--background` - App background
- `--foreground` - Primary text
- `--card` - Surface card background
- `--popover` - Dropdown/popover background
- `--primary` - Primary action (cream)
- `--secondary` - Secondary surface
- `--muted` - Muted surface
- `--accent` - Hover/accent states
- `--border` - Border color
- `--input` - Input border
- `--ring` - Focus ring

**Feature tokens:**
- `--color-distraction` - Destructive / distraction flash. Pattern: `text-destructive/80 bg-destructive/5`
- `--color-clean` - Positive state / 0 distractions. Pattern: `text-clean/80 bg-clean/5`
- `--color-flow` - Active timer glow (cream)
- `--color-streak` - Streak indicator (orange)
