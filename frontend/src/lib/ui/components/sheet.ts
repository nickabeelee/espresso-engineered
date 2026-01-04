import { colorCss } from "../foundations/color";
import { elevation } from "../foundations/elevation";
import { radius } from "../foundations/radius";
import { gap } from "../foundations/spacing";

const sheet = {
  overlay: {
    background: "rgba(43, 33, 24, 0.55)",
  },
  panel: {
    background: colorCss.bg.surface.paper.primary,
    radius: radius.lg,
    padding: "1.5rem 1.5rem 2rem",
    paddingTop: "1.5rem",
    paddingX: "1.5rem",
    paddingBottom: "2rem",
    shadow: elevation.soft,
    width: "min(760px, 100%)",
    maxHeight: "88vh",
    mobile: {
      padding: "1.25rem 1rem 1.5rem",
      paddingTop: "1.25rem",
      paddingX: "1rem",
      paddingBottom: "1.5rem",
      maxHeight: "92vh",
    },
    desktop: {
      offsetTop: "6vh",
      maxHeight: "calc(100vh - 8vh)",
    },
  },
  header: {
    gap: gap.md,
  },
  title: {
    color: colorCss.text.ink.primary,
    size: "1.2rem",
  },
  subtitle: {
    color: colorCss.text.ink.muted,
    size: "0.9rem",
  },
} as const;

export { sheet };
export type SheetTokens = typeof sheet;
