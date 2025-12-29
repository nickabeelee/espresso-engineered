import { colorCss } from "../foundations/color";
import { motion } from "../foundations/motion";
import { radius } from "../foundations/radius";
import { fontFamilies, fontSizes, lineHeights } from "../foundations/typography";

const inputBase = {
  fontFamily: fontFamilies.ui,
  fontSize: fontSizes.md,
  lineHeight: lineHeights.snug,
  background: colorCss.bg.surface.paper.primary,
  textColor: colorCss.text.ink.primary,
  borderColor: colorCss.border.subtle,
  borderWidth: "1px",
  borderStyle: "solid",
  borderRadius: radius.sm,
  padding: "0.6rem 0.75rem",
  transition: `border-color ${motion.duration.fast} ${motion.easing.standard}, box-shadow ${motion.duration.fast} ${motion.easing.standard}`,
} as const;

const inputPlaceholder = {
  textColor: colorCss.text.ink.placeholder,
} as const;

const inputFocus = {
  borderColor: colorCss.accent.primary,
  ring: "0 0 0 2px rgba(176, 138, 90, 0.2)",
} as const;

const inputDisabled = {
  background: colorCss.bg.surface.paper.secondary,
  textColor: colorCss.text.ink.muted,
} as const;

const textarea = {
  minHeight: "120px",
  resize: "vertical",
} as const;

const select = {
  indicatorColor: colorCss.text.ink.secondary,
} as const;

export { inputBase, inputDisabled, inputFocus, inputPlaceholder, select, textarea };
export type InputBaseTokens = typeof inputBase;
export type InputFocusTokens = typeof inputFocus;
export type TextareaTokens = typeof textarea;
export type SelectTokens = typeof select;
