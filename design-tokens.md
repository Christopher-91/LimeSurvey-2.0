# LimeSurvey Design System Tokens

Extracted from the LimeSurvey core admin theme (`Sea_Green`), public survey theme (`fruity_twentythree`), and authentication layout.

## 1. CSS Custom Properties (:root)

```css
:root {
  /* ==========================================================================
     Color Palette
     ========================================================================== */
  /* Primary & Brand Accent */
  --ls-color-primary: #14ae5c;
  --ls-color-primary-hover: #11964f;
  --ls-color-primary-active: #0e8042;
  --ls-color-primary-subtle: #e8f7ef;
  
  /* Accent & Action */
  --ls-color-action: #4200ff;
  --ls-color-action-hover: #3500cc;
  --ls-color-focus: #3bffb7;
  --ls-color-aubergine: #25003e;
  --ls-color-zucchini: #003e24;

  /* Secondary & Accents */
  --ls-color-grape: #8146f6;
  --ls-color-grape-light: #d3c5fa;
  --ls-color-grape-75: rgba(123, 97, 255, 0.4);
  --ls-color-grape-90: rgba(123, 97, 255, 0.9);
  --ls-color-orange: #ffba68;
  --ls-color-orange-light: #fff1e0;
  --ls-color-banana: #ffe872;
  --ls-color-blueberry: #a3c8ff;
  --ls-color-litschi: #ff9aa2;

  /* Semantic Status Colors */
  --ls-color-success: #4dd753;
  --ls-color-warning: #ffe046;
  --ls-color-danger: #ff515f;
  --ls-color-info: #8146f6;

  /* Grayscale (Cool Neutral Scale) */
  --ls-color-white: #ffffff;
  --ls-color-black: #000000;
  --ls-color-g-100: #f9f9fb; /* Canvas / Page Background */
  --ls-color-g-200: #eeeff7; /* Light Surface / Hover Background */
  --ls-color-g-300: #dddee8; /* Subtle Borders */
  --ls-color-g-400: #d3d5da; /* Card & Input Borders */
  --ls-color-g-600: #9094a7; /* Secondary Text & Muted Icons */
  --ls-color-g-700: #6e748c; /* Form Labels */
  --ls-color-g-750: #515567; /* Secondary Headings */
  --ls-color-g-800: #333641; /* Navbar & Dark Sidebar Background */
  --ls-color-g-900: #1e1e1e; /* Primary Heading & Body Text */

  /* Text & Link Colors */
  --ls-color-text-primary: var(--ls-color-g-900);
  --ls-color-text-secondary: var(--ls-color-g-600);
  --ls-color-text-muted: var(--ls-color-g-700);
  --ls-color-text-inverse: var(--ls-color-white);
  --ls-color-link: #2d7a53;
  --ls-color-link-hover: #1b4b33;

  /* ==========================================================================
     Typography
     ========================================================================== */
  --ls-font-sans: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --ls-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;

  --ls-font-size-xs: 0.75rem;    /* 12px */
  --ls-font-size-sm: 0.875rem;   /* 14px */
  --ls-font-size-base: 1rem;     /* 16px */
  --ls-font-size-md: 1.125rem;   /* 18px */
  --ls-font-size-lg: 1.25rem;    /* 20px */
  --ls-font-size-xl: 1.5rem;     /* 24px */
  --ls-font-size-2xl: 2rem;      /* 32px */
  --ls-font-size-3xl: 3.3rem;    /* 52.8px (Login & Display Titles) */

  --ls-font-weight-light: 300;
  --ls-font-weight-normal: 400;
  --ls-font-weight-medium: 500;
  --ls-font-weight-semibold: 600;
  --ls-font-weight-bold: 700;

  --ls-line-height-tight: 1.25;
  --ls-line-height-normal: 1.5;
  --ls-line-height-relaxed: 1.75;

  /* ==========================================================================
     Spacing & Layout
     ========================================================================== */
  --ls-space-1: 0.25rem;  /* 4px */
  --ls-space-2: 0.5rem;   /* 8px */
  --ls-space-3: 0.75rem;  /* 12px */
  --ls-space-4: 1rem;     /* 16px */
  --ls-space-5: 1.25rem;  /* 20px */
  --ls-space-6: 1.5rem;   /* 24px */
  --ls-space-8: 2rem;     /* 32px */
  --ls-space-10: 2.5rem;  /* 40px */
  --ls-space-12: 3rem;    /* 48px */
  --ls-space-16: 4rem;    /* 64px */

  --ls-container-max: 1200px;
  --ls-container-padding: 1rem;

  /* ==========================================================================
     Borders & Radii
     ========================================================================== */
  --ls-radius-xs: 2px;
  --ls-radius-sm: 4px;   /* Standard Inputs, Buttons, & Badges */
  --ls-radius-md: 6px;
  --ls-radius-lg: 8px;   /* Cards & Modals */
  --ls-radius-xl: 12px;
  --ls-radius-full: 9999px; /* Segmented Toggles & Pill Badges */

  --ls-border-width: 1px;
  --ls-border-color: var(--ls-color-g-400);
  --ls-border-color-focus: var(--ls-color-g-900);
  --ls-border-color-input: var(--ls-color-g-900);

  /* ==========================================================================
     Shadows & Elevation
     ========================================================================== */
  --ls-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --ls-shadow-overview: 0px 2px 6px rgba(0, 0, 0, 0.2);
  --ls-shadow-offset: 8px 8px var(--ls-color-g-200);
  --ls-shadow-offset-hover: 8px 8px var(--ls-color-grape-light);
  --ls-shadow-offset-sm: 4px 4px var(--ls-color-g-200);
  --ls-shadow-btn-focus: 4px 4px 0px rgba(123, 97, 255, 0.4);
  --ls-shadow-btn-hover: 0px 0px 0px 3px rgba(123, 97, 255, 0.4);
  --ls-shadow-elevation: 0 10px 25px -5px rgba(66, 0, 255, 0.15);

  /* ==========================================================================
     Component Specific Measurements
     ========================================================================== */
  /* Buttons */
  --ls-btn-height-sm: 24px;
  --ls-btn-height-md: 36px;
  --ls-btn-height-lg: 44px;
  --ls-btn-height-xl: 52px;
  --ls-btn-padding-x: 16px;
  --ls-btn-font-weight: 500;

  /* Inputs */
  --ls-input-height: 40px;
  --ls-input-padding-y: 10px;
  --ls-input-padding-x: 12px;

  /* Navbar & Sidebar */
  --ls-navbar-height: 60px;
  --ls-sidebar-width: 260px;
  --ls-sidebar-collapsed-width: 64px;

  /* ==========================================================================
     Transitions & Animations
     ========================================================================== */
  --ls-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --ls-transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --ls-transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 2. Responsive Breakpoints

| Breakpoint | Minimum Width | Typical Target |
|------------|---------------|----------------|
| `xs`       | `< 576px`     | Mobile portrait |
| `sm`       | `576px`       | Mobile landscape / small tablets |
| `md`       | `768px`       | Tablets (iPad vertical) |
| `lg`       | `992px`       | Laptops / small desktop |
| `xl`       | `1200px`      | Standard desktop display |
| `xxl`      | `1400px`      | Large widescreen monitors |

## 3. UI Component Specifications

### Buttons
- **Primary**: Background `var(--ls-color-primary)` (`#14AE5C`), text `#ffffff`, border-radius `4px`, height `36px` (or `44px` on forms), font-weight `500`. On hover, background deepens to `#11964F`.
- **Secondary / Outline**: Background `transparent`, border `1px solid var(--ls-color-g-600)`, text `var(--ls-color-g-900)`.
- **Focus Ring**: `4px 4px 0px rgba(123, 97, 255, 0.4)` (LimeSurvey signature offset focus ring).

### Input Fields
- **Border**: `1px solid var(--ls-color-g-900)` (LimeSurvey high-contrast default) or `var(--ls-color-g-400)` default state with `var(--ls-color-g-900)` on active focus.
- **Padding**: `10px 12px`.
- **Border Radius**: `4px`.
- **Label**: Font size `14px`, font weight `500`, color `var(--ls-color-g-700)`, margin-bottom `6px`.

### Cards & Panels
- **Background**: `#ffffff`.
- **Border**: `1px solid var(--ls-color-g-400)`.
- **Border Radius**: `8px`.
- **Box Shadow**: `0px 2px 6px rgba(0, 0, 0, 0.08)` or offset shadow `8px 8px var(--ls-color-g-200)`.

### Segmented Voter/Admin Toggle (Phase 5 Requirement)
- **Container**: Pill background `var(--ls-color-g-200)`, padding `4px`, border-radius `9999px`, display `inline-flex`.
- **Options**: Two equal buttons (`Voter Login` and `Admin Login`), padding `8px 20px`, font size `14px`, font weight `500`.
- **Active Sliding Pill**: Background `var(--ls-color-white)`, shadow `0 2px 4px rgba(0,0,0,0.1)`, text `var(--ls-color-primary)` (`#14AE5C`), border-radius `9999px`, transition `all 250ms ease-in-out`.
