const spacing = {
  none: "0",
  xs: "0.25rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  "2xl": "2rem",
  "3xl": "2.5rem",
  "4xl": "3rem",
} as const;

const gap = {
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
} as const;

const layoutSpacing = {
  card: {
    padding: "1.5rem",
    gap: "0.75rem",
  },
  section: {
    gap: "1.5rem",
    titleGap: "1rem",
  },
  list: {
    itemGap: "1rem",
    clusterGap: "1.5rem",
  },
} as const;

export { gap, layoutSpacing, spacing };
export type SpacingTokens = typeof spacing;
export type GapTokens = typeof gap;
export type LayoutSpacingTokens = typeof layoutSpacing;
