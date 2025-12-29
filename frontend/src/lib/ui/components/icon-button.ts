import { buttonBase, buttonFocusRing, buttonVariants } from "./button";

const iconButtonBase = {
  ...buttonBase,
  minWidth: "40px",
  padding: "0.45rem",
} as const;

const iconButtonIcon = {
  size: "18px",
} as const;

const iconButtonVariants = {
  accent: buttonVariants.accent,
  success: buttonVariants.success,
  danger: buttonVariants.danger,
  neutral: buttonVariants.neutral,
  onDark: {
    neutral: buttonVariants.quietOnDark,
    accent: {
      borderColor: buttonVariants.accent.borderColor,
      textColor: buttonVariants.accent.textColor,
      hover: {
        background: "rgba(176, 138, 90, 0.28)",
        borderColor: "rgba(176, 138, 90, 0.7)",
      },
      active: {
        background: "rgba(176, 138, 90, 0.36)",
      },
    },
    success: {
      borderColor: buttonVariants.success.borderColor,
      textColor: "var(--text-ink-inverted)",
      hover: {
        background: "rgba(85, 98, 74, 0.32)",
        borderColor: "rgba(85, 98, 74, 0.75)",
      },
      active: {
        background: "rgba(85, 98, 74, 0.4)",
      },
    },
    danger: {
      borderColor: buttonVariants.danger.borderColor,
      textColor: "var(--text-ink-inverted)",
      hover: {
        background: "rgba(122, 62, 47, 0.34)",
        borderColor: "rgba(122, 62, 47, 0.75)",
      },
      active: {
        background: "rgba(122, 62, 47, 0.42)",
      },
    },
  },
} as const;

const iconButtonStates = {
  selected: {
    ring: "0 0 0 2px rgba(176, 138, 90, 0.2)",
  },
  pressed: {
    scale: 0.98,
  },
} as const;

export { iconButtonBase, iconButtonIcon, iconButtonStates, iconButtonVariants, buttonFocusRing };
export type IconButtonBaseTokens = typeof iconButtonBase;
export type IconButtonVariantTokens = typeof iconButtonVariants;
export type IconButtonStateTokens = typeof iconButtonStates;
