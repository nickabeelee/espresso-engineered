import { fontFamilies } from "../foundations/typography";
import { colorCss } from "../foundations/color";

const legendDefaults = {
  itemGap: "0.5rem",
  rowGap: "0.35rem",
  markerSize: "0.6rem",
  label: {
    fontFamily: fontFamilies.ui,
    fontSize: "0.85rem",
    color: colorCss.text.ink.secondary,
  },
} as const;

export { legendDefaults };
export type LegendDefaults = typeof legendDefaults;
