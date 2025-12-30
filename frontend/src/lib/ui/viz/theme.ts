import { colorCss } from "../foundations/color";
import { fontFamilies } from "../foundations/typography";
import { vizPalette } from "./palette";

const vizTheme = {
  background: colorCss.bg.surface.paper.primary,
  gridline: "rgba(123, 94, 58, 0.2)",
  axis: {
    labelColor: colorCss.text.ink.secondary,
    tickColor: colorCss.text.ink.muted,
    fontFamily: fontFamilies.ui,
    fontSize: "0.85rem",
  },
  tooltip: {
    background: colorCss.bg.surface.paper.primary,
    borderColor: "rgba(123, 94, 58, 0.2)",
    textColor: colorCss.text.ink.primary,
  },
  palette: vizPalette,
} as const;

export { vizTheme };
export type VizThemeTokens = typeof vizTheme;
