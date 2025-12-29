import { colorCss } from "../foundations/color";
import { radius } from "../foundations/radius";
import { fontFamilies } from "../foundations/typography";

const selector = {
  trigger: {
    padding: "0.6rem 0.75rem",
    borderColor: colorCss.border.subtle,
    background: colorCss.bg.surface.paper.primary,
    textColor: colorCss.text.ink.primary,
    radius: radius.sm,
    fontSize: "1rem",
    focusRing: "2px solid rgba(176, 138, 90, 0.4)",
    focusOffset: "2px",
    disabledBackground: colorCss.bg.surface.paper.secondary,
  },
  panel: {
    background: colorCss.bg.surface.paper.primary,
    borderColor: colorCss.border.subtle,
    radius: radius.md,
    shadow: "0 18px 40px rgba(43, 33, 24, 0.22)",
    padding: "0.75rem",
  },
  option: {
    padding: "0.5rem 0.6rem",
    radius: radius.sm,
    textColor: colorCss.text.ink.primary,
    hoverBackground: "rgba(214, 199, 174, 0.24)",
    hoverBorder: "rgba(123, 94, 58, 0.25)",
    titleSize: "0.85rem",
  },
  meta: {
    textColor: colorCss.text.ink.muted,
    fontSize: "0.85rem",
    secondarySize: "0.78rem",
  },
  empty: {
    textColor: colorCss.text.ink.muted,
  },
  detailCard: {
    background: colorCss.bg.surface.paper.secondary,
    borderColor: colorCss.border.subtle,
    radius: radius.md,
    padding: "1rem",
  },
  detailTitle: {
    fontFamily: fontFamilies.ui,
    fontSize: "1.1rem",
    textColor: colorCss.text.ink.primary,
  },
  pill: {
    radius: "999px",
    fontSize: "0.8rem",
    fontWeight: 500,
  },
} as const;

export { selector };
export type SelectorTokens = typeof selector;
