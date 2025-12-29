import { colorCss } from "../foundations/color";
import { radius } from "../foundations/radius";
import { fontFamilies } from "../foundations/typography";

const tooltipDefaults = {
  background: colorCss.bg.surface.paper.primary,
  borderColor: "rgba(123, 94, 58, 0.2)",
  borderRadius: radius.sm,
  padding: "0.5rem 0.75rem",
  text: {
    fontFamily: fontFamilies.ui,
    fontSize: "0.85rem",
    color: colorCss.text.ink.primary,
  },
  shadow: "0 12px 24px rgba(43, 33, 24, 0.18)",
} as const;

export { tooltipDefaults };
export type TooltipDefaults = typeof tooltipDefaults;
