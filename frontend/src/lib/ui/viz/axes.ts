import { colorCss } from "../foundations/color";
import { fontFamilies } from "../foundations/typography";

const axisDefaults = {
  stroke: "rgba(123, 94, 58, 0.3)",
  tickSize: 4,
  tickPadding: 6,
  label: {
    fontFamily: fontFamilies.ui,
    fontSize: "0.85rem",
    color: colorCss.text.ink.secondary,
  },
  tickLabel: {
    fontFamily: fontFamilies.ui,
    fontSize: "0.8rem",
    color: colorCss.text.ink.muted,
  },
} as const;

export { axisDefaults };
export type AxisDefaults = typeof axisDefaults;
