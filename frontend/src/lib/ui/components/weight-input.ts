import { colorCss } from "../foundations/color";
import { motion } from "../foundations/motion";
import { radius } from "../foundations/radius";
import { fontFamilies, fontSizes, lineHeights } from "../foundations/typography";

const weightInput = {
  container: {
    gap: "0.5rem",
  },
  label: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.sm,
    fontWeight: 600,
    textColor: colorCss.text.ink.secondary,
  },
  helper: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.xs,
    textColor: colorCss.text.ink.muted,
  },
  controls: {
    gap: "0.5rem",
  },
  input: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.snug,
    textColor: colorCss.text.ink.primary,
    background: colorCss.bg.surface.paper.primary,
    borderColor: colorCss.border.subtle,
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: radius.sm,
    padding: "0.55rem 0.7rem",
    focusBorderColor: colorCss.accent.primary,
    focusRing: "0 0 0 2px rgba(176, 138, 90, 0.2)",
    transition: `border-color ${motion.duration.fast} ${motion.easing.standard}, box-shadow ${motion.duration.fast} ${motion.easing.standard}`,
    disabledBackground: colorCss.bg.surface.paper.secondary,
    disabledTextColor: colorCss.text.ink.muted,
  },
  select: {
    minWidth: "5rem",
  },
  preset: {
    background: "rgba(123, 94, 58, 0.12)",
    textColor: colorCss.text.ink.secondary,
    borderColor: colorCss.border.subtle,
    hoverBackground: "rgba(123, 94, 58, 0.2)",
    hoverBorderColor: colorCss.border.strong,
    fontSize: fontSizes.xs,
    fontWeight: 500,
    padding: "0.25rem 0.5rem",
    borderRadius: radius.sm,
    gap: "0.25rem",
  },
} as const;

export { weightInput };
export type WeightInputTokens = typeof weightInput;
