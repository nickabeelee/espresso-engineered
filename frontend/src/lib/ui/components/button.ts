import { colorCss } from "../foundations/color";
import { motion } from "../foundations/motion";
import { radius } from "../foundations/radius";
import { fontFamilies, fontSizes, lineHeights } from "../foundations/typography";

const buttonBase = {
  minHeight: "40px",
  padding: "0.45rem 1.1rem",
  gap: "0.5rem",
  borderWidth: "1px",
  borderStyle: "solid",
  borderRadius: radius.md,
  fontFamily: fontFamilies.ui,
  fontSize: "0.95rem",
  lineHeight: lineHeights.snug,
  transition: `background ${motion.duration.fast} ${motion.easing.standard}, border-color ${motion.duration.fast} ${motion.easing.standard}`,
} as const;

const buttonVariants = {
  neutral: {
    borderColor: colorCss.border.subtle,
    textColor: colorCss.text.ink.secondary,
    hover: {
      background: "rgba(74, 58, 44, 0.2)",
      borderColor: "rgba(74, 58, 44, 0.4)",
    },
    active: {
      background: "rgba(74, 58, 44, 0.28)",
    },
  },
  accent: {
    borderColor: colorCss.accent.primary,
    textColor: colorCss.accent.primary,
    hover: {
      background: "rgba(176, 138, 90, 0.26)",
      borderColor: "rgba(176, 138, 90, 0.7)",
    },
    active: {
      background: "rgba(176, 138, 90, 0.34)",
    },
  },
  success: {
    borderColor: colorCss.semantic.success,
    textColor: colorCss.semantic.success,
    hover: {
      background: "rgba(85, 98, 74, 0.28)",
      borderColor: "rgba(85, 98, 74, 0.65)",
    },
    active: {
      background: "rgba(85, 98, 74, 0.36)",
    },
  },
  danger: {
    borderColor: colorCss.semantic.error,
    textColor: colorCss.semantic.error,
    hover: {
      background: "rgba(122, 62, 47, 0.28)",
      borderColor: "rgba(122, 62, 47, 0.65)",
    },
    active: {
      background: "rgba(122, 62, 47, 0.36)",
    },
  },
  quietOnDark: {
    borderColor: colorCss.text.ink.invertedMuted,
    textColor: colorCss.text.ink.inverted,
    hover: {
      background: "rgba(214, 199, 174, 0.16)",
      borderColor: "rgba(214, 199, 174, 0.4)",
    },
    active: {
      background: "rgba(214, 199, 174, 0.24)",
    },
  },
} as const;

const buttonFocusRing = {
  width: "2px",
  color: colorCss.accent.primary,
  offset: "2px",
} as const;

const buttonDisabled = {
  opacity: 0.55,
} as const;

const buttonSizes = {
  sm: {
    minHeight: "36px",
    padding: "0.35rem 0.85rem",
    fontSize: "0.9rem",
  },
  md: {
    minHeight: "40px",
    padding: "0.45rem 1.1rem",
    fontSize: "0.95rem",
  },
  lg: {
    minHeight: "46px",
    padding: "0.6rem 1.25rem",
    fontSize: "1rem",
  },
} as const;

export { buttonBase, buttonDisabled, buttonFocusRing, buttonSizes, buttonVariants };
export type ButtonBaseTokens = typeof buttonBase;
export type ButtonVariantTokens = typeof buttonVariants;
export type ButtonSizeTokens = typeof buttonSizes;
