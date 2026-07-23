# PhilInspect CRM design contract

Source: `Philinspect CRM` Figma file, read-only.

- File key: `PZQZcN7DmZT8oZ8KyXOWVr`
- Foundations node: `50:1184`
- Implementation target: Next.js 16, React 19, Tailwind CSS 4, Base UI
- Figma remains read-only. All changes are made in this repository.

## Source hierarchy

1. `01 - Foundations`
2. `02 - Atoms`
3. `03 - Molecules`
4. `04 - Organisms`
5. `05 - Templates`
6. `06 - Pages`

When values conflict, named Figma variables/styles override screenshots, and
component definitions override page-local approximations.

## Foundations

### Layout

- Reference desktop frame: `1440px`
- Application sidebar: `240px`
- Main content: `1200px`
- Desktop/content grids: `12 columns`
- Baseline: `8px`
- Foundation documentation padding: `64px 64px 96px`
- Foundation section gap: `48px`
- Standard component radius: `8px`

### Color

| Figma role | CSS token | Default |
| --- | --- | --- |
| `Surface/Canvas` | `--pi-surface-canvas` | `#FAFAFA` |
| `Surface/Raised` | `--pi-surface-raised` | `#FFFFFF` |
| `Content/Primary` | `--pi-content-primary` | `#0E0E0E` |
| `Content/Secondary` | `--pi-content-secondary` | `#52525B` |
| `Border/Default` | `--pi-border-default` | `#E5E5E5` |
| `Brand/Primary` | `--pi-brand-primary` | `#2563EB` |
| `Brand/Soft` | `--pi-brand-soft` | `#EAF3FF` |
| `Pipeline/Assessment` | `--pi-badge-purple` | `#7C3AED` at 12% |
| `Pipeline/Demo Proposal` | `--pi-badge-warning` | `#D97706` at 12% |
| `Status/Success` | `--pi-status-success` | `#183923` |
| `Status/Danger` | `--pi-status-danger` | `#A8121D` |

Product screens use Figma's `Default` mode. The `PhilInspect Dark Mode`
collection is supported as an alternate user preference, not the initial mode.

### Typography

`Family/UI` maps to the product's Geist UI stack. `Family/Mono` maps to Geist
Mono.

| Figma text style | Size / line | Weight | CSS class |
| --- | --- | --- | --- |
| `Page Title` | `14 / 18` | `600` | `.pi-page-title` |
| `Section Title` | `18 / 22` | `600` | `.pi-section-title` |
| `Body` | `12 / 16` | `400` | `.pi-body` |
| `Body Medium` | `12 / 16` | `500` | `.pi-body-medium` |
| `Body Strong` | `12 / 16` | `600` | `.pi-body-strong` |
| `UI Label` | `11 / 14` | `400` | `.pi-ui-label` |
| `Caption` | `10 / 14` | `400` | `.pi-caption` |
| `Eyebrow` | `9 / 12` | `500`, mono | `.pi-eyebrow` |

All extracted text styles use zero letter spacing.

## Component inventory

### Atoms

- SVG icons
- Buttons and icon buttons
- Tabs
- Badges and status labels
- Avatars
- Keyboard hints
- Overlay/backdrop

### Molecules

- Controls and search
- Tables and table cells
- Data display
- Search results
- Deal detail groups
- Operational-page patterns

### Organisms

- Navigation and tables
- Modals
- Product structures
- Deal detail
- Deals activity table
- Operational-page sections

### Templates and pages

- Overlays
- Deal detail
- Operational pages
- Dashboard
- Leads
- Deals board/list
- Deal active/resources
- Inbox and compose panel
- Revenue
- Bills
- Settings
- Audit logs

## Code rules

- Use semantic tokens; do not copy raw colors into feature components.
- Preserve Figma's compact typography and density.
- Use the 8px baseline and the documented 4px half-step only for atom-level
  alignment.
- Keep visual atoms presentational. Feature actions and data mutations remain in
  services/server actions.
- Interactive states require visible hover, focus, pressed, disabled, loading,
  invalid, and selected treatments where defined.
- Icon-only actions require accessible labels.
- Status meaning must not rely on color alone.
- Responsive replacements must preserve actions hidden from desktop layouts.

## Verification

- Render every component/variant on `/design-system`.
- Compare fixed-size screenshots with the relevant Figma frames.
- Verify at `1440x1000`, `1024x768`, `768x1024`, `390x844`, and `360x800`.
- Run lint, typecheck, unit tests, production build, and Playwright tests before
  staging deployment.
