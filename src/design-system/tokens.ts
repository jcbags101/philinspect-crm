export const colorRoles = {
  surfaceCanvas: "var(--pi-surface-canvas)",
  surfaceRaised: "var(--pi-surface-raised)",
  surfaceSidebar: "var(--pi-surface-sidebar)",
  surfaceSubtle: "var(--pi-surface-subtle)",
  contentPrimary: "var(--pi-content-primary)",
  contentSecondary: "var(--pi-content-secondary)",
  contentInverse: "var(--pi-content-inverse)",
  borderDefault: "var(--pi-border-default)",
  brandPrimary: "var(--pi-brand-primary)",
  brandSoft: "var(--pi-brand-soft)",
  badgeNeutral: "var(--pi-badge-neutral)",
  badgePurple: "var(--pi-badge-purple)",
  badgeWarning: "var(--pi-badge-warning)",
  statusSuccess: "var(--pi-status-success)",
  statusDanger: "var(--pi-status-danger)",
} as const;

export const textStyles = {
  pageTitle: "pi-page-title",
  sectionTitle: "pi-section-title",
  body: "pi-body",
  bodyMedium: "pi-body-medium",
  bodyStrong: "pi-body-strong",
  uiLabel: "pi-ui-label",
  caption: "pi-caption",
  eyebrow: "pi-eyebrow",
} as const;

export const layoutTokens = {
  referenceDesktopWidth: 1440,
  sidebarWidth: 240,
  contentWidth: 1200,
  columns: 12,
  baseline: 8,
} as const;

export type ColorRole = keyof typeof colorRoles;
export type TextStyle = keyof typeof textStyles;
