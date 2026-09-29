# Aperture Operations

## Brand & Style

Aperture Operations is a high-end minimal design system for the high-velocity, visual-centric world of photography operations. The interface prioritizes the photographer's work through a reductive UI that stays out of the way until needed.

The visual direction is **Modern Minimalism** with a focus on functional clarity. It follows a gallery-inspired approach with wide margins, generous whitespace, and precise typography. The aesthetic is professional and airy, avoiding decorative flourishes so that photographic previews and operational status remain the focal points. The intended emotional response is calm control and systematic precision.

## Design Tokens

### Colors

```yaml
colors:
  surface: "#f8f9fa"
  surface-dim: "#d9dadb"
  surface-bright: "#f8f9fa"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f3f4f5"
  surface-container: "#edeeef"
  surface-container-high: "#e7e8e9"
  surface-container-highest: "#e1e3e4"
  on-surface: "#191c1d"
  on-surface-variant: "#434656"
  inverse-surface: "#2e3132"
  inverse-on-surface: "#f0f1f2"
  outline: "#747688"
  outline-variant: "#c4c5d9"
  surface-tint: "#124af0"
  primary: "#0040e0"
  on-primary: "#ffffff"
  primary-container: "#2e5bff"
  on-primary-container: "#efefff"
  inverse-primary: "#b8c3ff"
  secondary: "#5f5e5e"
  on-secondary: "#ffffff"
  secondary-container: "#e5e2e1"
  on-secondary-container: "#656464"
  tertiary: "#993100"
  on-tertiary: "#ffffff"
  tertiary-container: "#c24100"
  on-tertiary-container: "#ffece6"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#dde1ff"
  primary-fixed-dim: "#b8c3ff"
  on-primary-fixed: "#001356"
  on-primary-fixed-variant: "#0035be"
  secondary-fixed: "#e5e2e1"
  secondary-fixed-dim: "#c8c6c5"
  on-secondary-fixed: "#1c1b1b"
  on-secondary-fixed-variant: "#474646"
  tertiary-fixed: "#ffdbcf"
  tertiary-fixed-dim: "#ffb59b"
  on-tertiary-fixed: "#380d00"
  on-tertiary-fixed-variant: "#812800"
  background: "#f8f9fa"
  on-background: "#191c1d"
  surface-variant: "#e1e3e4"
```

The palette is predominantly monochromatic so the UI remains visually quiet behind photography content.

- **Primary:** Electric blue is reserved for primary actions such as Create, Send, and Save, plus critical active states.
- **Surface:** Soft gray layers establish hierarchy from white canvases to deep charcoal inverse surfaces.
- **Accents:** Vibrant status colors are used sparingly to represent shoot lifecycle stages and improve scanning in dense lists.
- **Background:** Use pure white or near-white `#f8f9fa` to preserve the airy professional feel.

### Typography

Use **Geist** for its systematic, utilitarian precision. When Geist is unavailable, use Inter as the fallback. Hierarchy should rely on meaningful weight contrast as well as size.

```yaml
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: 700
    lineHeight: 56px
    letterSpacing: 0
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: 0
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: 600
    lineHeight: 32px
    letterSpacing: 0
  title-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 700
    lineHeight: 16px
    letterSpacing: 0.05em
```

- **Headlines:** Use semibold weights and restrained tracking to ground the page.
- **Body:** Preserve generous line heights, approximately 1.6x, for long administrative workflows.
- **Labels:** Use uppercase labels with increased tracking for metadata and status headers.
- **Letter spacing:** Keep letter spacing at `0` unless a token explicitly defines tracking, such as `label-caps`.

### Shape

```yaml
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
```

Use a soft but architectural shape language:

- Standard buttons and small cards use `0.25rem` (`4px`).
- Large content containers and dashboard widgets use `0.5rem` (`8px`).
- Status badges and toggle switches use `full` rounding to distinguish interactive status elements from structural containers.

### Spacing

```yaml
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  touch-target-min: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
```

## Layout & Spacing

Use a fluid grid based on an 8px rhythm.

- **Mobile:** Use one column with 24px side margins. Prioritize bottom-of-screen actions for one-handed use in the field.
- **Desktop:** Use a 12-column grid with a maximum width of 1440px. Center content and use generous 24px gutters to prevent crowding.
- **Touch targets:** Interactive controls, list items, toggles, and buttons must have a minimum height of 48px.
- **Responsive behavior:** Preserve stable dimensions for toolbars, rows, controls, and media previews so labels and states do not shift the layout.

## Elevation & Depth

Create hierarchy with tonal layers and ambient shadows rather than heavy decoration.

- **Level 0, background:** White or `#f8f9fa` base canvas.
- **Level 1, cards:** Soft white surfaces with a diffused `0 4px 20px` shadow at approximately 4% black opacity.
- **Level 2, overlays and modals:** Increased `0 12px 40px` shadow at approximately 8% black opacity.
- **Outlines:** Use 1px borders in soft gray, approximately `#e9ecef`, for form fields and secondary containers. Prefer outlines over shadows when structural clarity is sufficient.

## Components

### Buttons

- **Primary:** Electric blue background, white text, minimum height 48px. Use for primary actions such as Create, Send, and Save.
- **Secondary:** Transparent background with a 1px deep-charcoal border.
- **Ghost:** No background or border. Use for secondary actions such as Cancel and Back.
- Keep button labels concise and ensure text remains inside the control at all viewport sizes.

### Status Badges

Use small, pill-shaped components. Apply a 10-15% opacity background tint of the status color and high-contrast text in the same hue. Badges should be scannable without competing with photographic content.

### Cards

Cards are organizational units, not decorative containers. Use soft white surfaces and Level 1 ambient shadow instead of visible borders. Apply `stack-md` spacing to content inside a card.

Do not nest cards inside cards. Use full-width bands or unframed layouts for page-level sections.

### Input Fields

Place labels above fields. Provide large accessible tap areas and a minimum 48px control height. Use a light gray border at rest and transition the border to Electric Blue on focus. Focus states must remain visible without relying on color alone.

### Lists

Photography operations require dense but readable information. Separate rows with thin 1px dividers and use at least 16px vertical padding per row. Keep row actions stable and ensure the entire interactive row meets the 48px touch-target minimum.

### Action Sheets

On mobile, use bottom-anchored action sheets instead of centered modals to support one-handed operation for photographers on the move. Keep the primary action close to the bottom edge while respecting device safe areas.

## Usage Principles

1. Photography and operational status are the visual priority; interface chrome should remain quiet.
2. Use Electric Blue intentionally for primary actions and active states, not as general decoration.
3. Prefer whitespace, tonal surfaces, and typography over ornamental elements.
4. Keep dense operational information scannable through labels, dividers, consistent spacing, and restrained status colors.
5. Maintain accessible contrast, visible focus states, and 48px minimum touch targets across responsive layouts.
