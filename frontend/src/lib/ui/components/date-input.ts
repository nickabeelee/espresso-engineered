import { colorCss } from "../foundations/color";
import { motion } from "../foundations/motion";
import { radius } from "../foundations/radius";
import { fontFamilies, fontSizes, lineHeights } from "../foundations/typography";
import { inputBase, inputDisabled, inputFocus, inputPlaceholder } from "./input";

const dateInput = {
  container: {
    gap: "0.35rem",
  },
  header: {
    gap: "0.5rem",
  },
  label: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.sm,
    fontWeight: 600,
    lineHeight: lineHeights.snug,
    textColor: colorCss.text.ink.secondary,
  },
  helper: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.xs,
    fontWeight: 400,
    lineHeight: lineHeights.snug,
    textColor: colorCss.text.ink.muted,
  },
  field: {
    gap: "0.5rem",
  },
  input: {
    ...inputBase,
    placeholderColor: inputPlaceholder.textColor,
    focusBorderColor: inputFocus.borderColor,
    focusRing: inputFocus.ring,
    disabledBackground: inputDisabled.background,
    disabledTextColor: inputDisabled.textColor,
    iconPadding: "2.5rem",
  },
  icon: {
    color: colorCss.text.ink.muted,
    hoverColor: colorCss.text.ink.primary,
    background: colorCss.bg.surface.paper.primary,
    hoverBackground: colorCss.bg.surface.paper.secondary,
    borderColor: "transparent",
    size: "1.1rem",
    radius: radius.xs,
    transition: `color ${motion.duration.fast} ${motion.easing.standard}, background ${motion.duration.fast} ${motion.easing.standard}`,
  },
  action: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.sm,
    fontWeight: 600,
    lineHeight: lineHeights.snug,
    textColor: colorCss.text.ink.primary,
    background: colorCss.bg.surface.paper.secondary,
    borderColor: colorCss.border.subtle,
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: radius.sm,
    padding: "0.45rem 0.75rem",
    transition: `background ${motion.duration.fast} ${motion.easing.standard}, border-color ${motion.duration.fast} ${motion.easing.standard}`,
    hoverBackground: colorCss.bg.surface.paper.primary,
  },
} as const;

export { dateInput };
export type DateInputTokens = typeof dateInput;
