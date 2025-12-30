import { colorCss } from "../foundations/color";
import { elevation } from "../foundations/elevation";
import { radius } from "../foundations/radius";

const loadingIndicator = {
  overlay: {
    background: "rgba(0, 0, 0, 0.5)",
    blur: "2px",
  },
  card: {
    background: colorCss.bg.surface.paper.primary,
    radius: radius.md,
    shadow: elevation.soft,
    padding: "1rem",
  },
  spinner: {
    border: "rgba(176, 138, 90, 0.2)",
    accent: colorCss.accent.primary,
  },
  text: {
    color: colorCss.text.ink.secondary,
  },
  progress: {
    background: "rgba(123, 94, 58, 0.2)",
    fill: colorCss.accent.primary,
  },
} as const;

const syncStatus = {
  indicator: {
    background: colorCss.bg.surface.paper.secondary,
    borderColor: colorCss.border.subtle,
    radius: radius.lg,
    padding: "0.5rem 0.75rem",
  },
  detailCard: {
    background: colorCss.bg.surface.paper.primary,
    borderColor: colorCss.border.subtle,
    radius: radius.md,
    padding: "0.75rem",
    shadow: elevation.soft,
  },
  label: {
    color: colorCss.text.ink.muted,
  },
  value: {
    color: colorCss.text.ink.primary,
  },
} as const;

export { loadingIndicator, syncStatus };
export type LoadingIndicatorTokens = typeof loadingIndicator;
export type SyncStatusTokens = typeof syncStatus;
