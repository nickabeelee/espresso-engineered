import { colorCss } from "../foundations/color";
import { fontFamilies, fontSizes } from "../foundations/typography";

const chipBase = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  borderWidth: "1px",
  borderStyle: "solid",
  fontFamily: fontFamilies.ui,
  fontWeight: 600,
  fontSize: fontSizes.xs,
} as const;

const chipSizes = {
  sm: {
    padding: "0.2rem 0.5rem",
  },
  md: {
    padding: "0.25rem 0.6rem",
  },
} as const;

const chipVariants = {
  neutral: {
    background: "rgba(123, 94, 58, 0.12)",
    textColor: colorCss.text.ink.secondary,
    borderColor: "rgba(123, 94, 58, 0.25)",
  },
  accent: {
    background: "rgba(176, 138, 90, 0.18)",
    textColor: colorCss.accent.primary,
    borderColor: "rgba(176, 138, 90, 0.35)",
  },
  success: {
    background: "rgba(85, 98, 74, 0.18)",
    textColor: colorCss.semantic.success,
    borderColor: "rgba(85, 98, 74, 0.35)",
  },
  warning: {
    background: "rgba(138, 106, 62, 0.18)",
    textColor: colorCss.semantic.warning,
    borderColor: "rgba(138, 106, 62, 0.35)",
  },
  error: {
    background: "rgba(122, 62, 47, 0.18)",
    textColor: colorCss.semantic.error,
    borderColor: "rgba(122, 62, 47, 0.35)",
  },
} as const;

const chipGroup = {
  gap: "0.5rem",
} as const;

export { chipBase, chipGroup, chipSizes, chipVariants };
export type ChipBaseTokens = typeof chipBase;
export type ChipSizeTokens = typeof chipSizes;
export type ChipVariantTokens = typeof chipVariants;
export type ChipGroupTokens = typeof chipGroup;
