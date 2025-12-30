import { colorCss } from "../foundations/color";
import { spacing } from "../foundations/spacing";
import { fontFamilies } from "../foundations/typography";

const emptyState = {
  container: {
    padding: spacing["2xl"],
    minHeight: "200px",
  },
  content: {
    gap: spacing.xl,
    maxWidth: "400px",
  },
  icon: {
    color: colorCss.text.ink.muted,
    opacity: 0.6,
    size: {
      sm: "32px",
      md: "48px",
      lg: "64px",
    },
  },
  title: {
    fontFamily: fontFamilies.ui,
    fontWeight: 600,
    color: colorCss.text.ink.primary,
    size: {
      sm: "1.1rem",
      md: "1.25rem",
      lg: "1.5rem",
    },
  },
  description: {
    fontFamily: fontFamilies.ui,
    color: colorCss.text.ink.muted,
    lineHeight: "1.5",
    size: {
      sm: "0.9rem",
      md: "1rem",
      lg: "1.1rem",
    },
  },
  actions: {
    gap: "0.75rem",
  },
  illustration: {
    opacity: 0.8,
    maxWidth: {
      sm: "150px",
      md: "200px",
      lg: "250px",
    },
  },
} as const;

export { emptyState };
export type EmptyStateTokens = typeof emptyState;
