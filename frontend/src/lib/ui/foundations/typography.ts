const fontFamilies = {
  content: '"Libre Baskerville", "Times New Roman", serif',
  ui: '"IBM Plex Sans", system-ui, -apple-system, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
} as const;

const fontSizes = {
  xs: "0.75rem",
  sm: "0.875rem",
  md: "1rem",
  lg: "1.125rem",
  xl: "1.5rem",
  h1: "1.85rem",
  h2: "1.5rem",
  h3: "1.25rem",
  h4: "1.1rem",
} as const;

const lineHeights = {
  tight: "1.3",
  snug: "1.5",
  relaxed: "1.6",
  roomy: "1.7",
} as const;

const letterSpacing = {
  normal: "0",
  voice: "0.02em",
} as const;

const textStyles = {
  voice: {
    fontFamily: fontFamilies.content,
    fontSize: "0.95rem",
    lineHeight: lineHeights.roomy,
    letterSpacing: letterSpacing.voice,
    fontStyle: "normal",
  },
  body: {
    fontFamily: fontFamilies.content,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.relaxed,
    fontWeight: 400,
  },
  headingPrimary: {
    fontFamily: fontFamilies.content,
    fontSize: fontSizes.h1,
    fontWeight: 400,
    lineHeight: lineHeights.snug,
  },
  headingSecondary: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.h2,
    fontWeight: 500,
    lineHeight: lineHeights.snug,
  },
  headingTertiary: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.h3,
    fontWeight: 500,
    lineHeight: lineHeights.snug,
  },
  headingQuaternary: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.h4,
    fontWeight: 500,
    lineHeight: lineHeights.snug,
  },
  label: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.sm,
    fontWeight: 500,
    lineHeight: lineHeights.snug,
  },
  helper: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.sm,
    fontWeight: 400,
    lineHeight: lineHeights.snug,
  },
  placeholder: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.sm,
    fontWeight: 400,
    lineHeight: lineHeights.snug,
  },
} as const;

export { fontFamilies, fontSizes, letterSpacing, lineHeights, textStyles };
export type FontFamilies = typeof fontFamilies;
export type FontSizes = typeof fontSizes;
export type LineHeights = typeof lineHeights;
export type LetterSpacing = typeof letterSpacing;
export type TextStyles = typeof textStyles;
