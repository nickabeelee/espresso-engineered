import { colorCss } from "../foundations/color";
import { radius } from "../foundations/radius";
import { fontFamilies } from "../foundations/typography";

const alertBase = {
  borderRadius: radius.md,
  borderWidth: "1px",
  fontFamily: fontFamilies.ui,
} as const;

const alertVariants = {
  error: {
    background: "rgba(122, 62, 47, 0.12)",
    borderColor: "rgba(122, 62, 47, 0.25)",
    textColor: colorCss.semantic.error,
  },
  warning: {
    background: "rgba(138, 106, 62, 0.15)",
    borderColor: "rgba(138, 106, 62, 0.25)",
    textColor: colorCss.semantic.warning,
  },
  neutral: {
    background: "rgba(123, 94, 58, 0.12)",
    borderColor: "rgba(123, 94, 58, 0.25)",
    textColor: colorCss.text.ink.secondary,
  },
} as const;

const alertSizes = {
  sm: {
    padding: "0.5rem 0.75rem",
    fontSize: "0.85rem",
  },
  md: {
    padding: "0.75rem 1rem",
    fontSize: "0.9rem",
  },
  lg: {
    padding: "1rem 1.5rem",
    fontSize: "1rem",
  },
} as const;

const validationFeedback = {
  tooltip: {
    background: colorCss.bg.surface.paper.primary,
    borderColor: colorCss.semantic.error,
    shadow: "0 12px 24px rgba(43, 33, 24, 0.18)",
    padding: "0.5rem",
    radius: radius.sm,
  },
  list: {
    background: "rgba(122, 62, 47, 0.05)",
    borderColor: "rgba(122, 62, 47, 0.2)",
    padding: "0.75rem",
    radius: radius.sm,
  },
  text: {
    error: colorCss.semantic.error,
    success: colorCss.semantic.success,
    muted: colorCss.text.ink.muted,
  },
} as const;

export { alertBase, alertSizes, alertVariants, validationFeedback };
export type AlertBaseTokens = typeof alertBase;
export type AlertSizeTokens = typeof alertSizes;
export type AlertVariantTokens = typeof alertVariants;
export type ValidationFeedbackTokens = typeof validationFeedback;
