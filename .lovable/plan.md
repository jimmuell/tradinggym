

## Unified Theme System with Correct Text Colors

### Problem
All pages and components use hardcoded dark-theme colors (`text-white`, `bg-[#131722]`, `text-gray-400`, etc.). When the user switches to Light or System theme, these hardcoded colors will look wrong — white text on a white background, dark backgrounds ignoring the theme, etc.

### Solution
Replace all hardcoded color classes with Tailwind's theme-aware CSS variable classes (`text-foreground`, `bg-background`, `bg-card`, `text-muted-foreground`, etc.) that automatically adapt based on the `.dark` class. Also replace the Dark Mode toggle + Chart Theme dropdown with a single **Theme** selector (Dark / Light / System).

### Changes

**1. `src/contexts/SettingsContext.tsx`**
- Remove `darkMode` / `setDarkMode`
- Add `theme: 'dark' | 'light' | 'system'` with `setTheme`
- Resolve effective theme using `matchMedia('prefers-color-scheme: dark')` for system
- Listen for OS theme changes when set to system
- Keep `chartTheme` for future chart-specific styling

**2. `src/pages/Settings.tsx`**
- Remove the Dark Mode toggle row entirely
- Replace "Chart Theme" dropdown with "Theme" dropdown: Dark, Light, System
- Replace all hardcoded colors with theme-aware classes:
  - `bg-[#131722]` → `bg-background`
  - `bg-[#1e222d]` → `bg-card`
  - `border-[#2a2e39]` → `border-border`
  - `text-white` → `text-foreground`
  - `text-gray-400/500` → `text-muted-foreground`

**3. `src/pages/Profile.tsx`**
- Same color class replacements as Settings

**4. `src/pages/Dashboard.tsx`**
- Replace hardcoded colors with theme-aware classes

**5. `src/layouts/DashboardLayout.tsx`**
- Replace `bg-[#131722]`, `bg-[#1e222d]`, `border-[#2a2e39]` with theme variables

**6. `src/components/dashboard/AppSidebar.tsx`**
- Replace hardcoded sidebar colors with `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`, etc.

**7. `src/index.css`**
- Light theme variables are already defined and correct
- Dark theme variables are already defined
- No changes needed

### Color Mapping Reference

| Hardcoded | Theme-aware replacement |
|-----------|------------------------|
| `bg-[#131722]` | `bg-background` |
| `bg-[#1e222d]` | `bg-card` |
| `border-[#2a2e39]` | `border-border` |
| `text-white` | `text-foreground` |
| `text-gray-300` | `text-foreground` |
| `text-gray-400` | `text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-600` | `text-muted-foreground` |

