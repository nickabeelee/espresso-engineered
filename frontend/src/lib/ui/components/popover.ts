import { colorCss } from "../foundations/color";
import { radius } from "../foundations/radius";

const popover = {
  panel: {
    background: colorCss.bg.surface.paper.primary,
    borderColor: colorCss.border.subtle,
    borderWidth: "1px",
    borderStyle: "solid",
    radius: radius.md,
    padding: "1rem",
    shadow: colorCss.shadow.soft,
    width: "min(92vw, 360px)",
    minWidth: "12rem",
    maxWidth: "90vw",
  },
  offset: "0.5rem",
} as const;

export { popover };
export type PopoverTokens = typeof popover;
