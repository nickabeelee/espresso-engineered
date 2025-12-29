import { colorCss } from "../foundations/color";
import { radius } from "../foundations/radius";
import { fontFamilies } from "../foundations/typography";

const inlineCreator = {
  container: {
    background: colorCss.bg.surface.paper.secondary,
    borderColor: colorCss.accent.primary,
    borderWidth: "2px",
    radius: radius.md,
    padding: "1.5rem",
    margin: "0.5rem 0",
  },
  header: {
    marginBottom: "1rem",
    titleColor: colorCss.accent.primary,
    titleSize: "1.1rem",
  },
  closeButton: {
    color: colorCss.text.ink.muted,
    hoverColor: colorCss.semantic.error,
    size: "1.2rem",
  },
  errorBanner: {
    background: "rgba(122, 62, 47, 0.12)",
    borderColor: "rgba(122, 62, 47, 0.25)",
    textColor: colorCss.semantic.error,
    radius: radius.sm,
    padding: "0.75rem",
    fontSize: "0.9rem",
  },
  form: {
    gap: "1rem",
    rowGap: "1rem",
  },
  label: {
    fontFamily: fontFamilies.ui,
    fontWeight: 600,
    color: colorCss.text.ink.primary,
    fontSize: "0.9rem",
  },
  input: {
    padding: "0.5rem",
    borderColor: colorCss.border.subtle,
    radius: radius.sm,
    fontSize: "0.9rem",
    focusRing: "0 0 0 2px rgba(176, 138, 90, 0.2)",
    disabledBackground: colorCss.bg.surface.paper.secondary,
  },
  actions: {
    gap: "0.75rem",
  },
} as const;

export { inlineCreator };
export type InlineCreatorTokens = typeof inlineCreator;
