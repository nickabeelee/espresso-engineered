import { colorCss } from "../foundations/color";
import { elevation } from "../foundations/elevation";

const focusRing = {
  color: colorCss.accent.primary,
  width: "2px",
  offset: "2px",
  shadow: elevation.focus,
} as const;

const focusWithin = {
  borderColor: colorCss.accent.primary,
  ring: "0 0 0 2px rgba(176, 138, 90, 0.2)",
} as const;

export { focusRing, focusWithin };
export type FocusRingTokens = typeof focusRing;
export type FocusWithinTokens = typeof focusWithin;
