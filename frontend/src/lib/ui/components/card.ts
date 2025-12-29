import { colorCss } from "../foundations/color";
import { elevation } from "../foundations/elevation";
import { radius } from "../foundations/radius";
import { fontFamilies } from "../foundations/typography";

const cardSurface = {
  background: "var(--bg-surface-paper-secondary)",
  borderRadius: radius.md,
  padding: "1.5rem",
  borderColor: "rgba(123, 94, 58, 0.2)",
  borderWidth: "1px",
  borderStyle: "solid",
} as const;

const pageSurface = {
  background: "var(--bg-surface-paper)",
  borderRadius: radius.lg,
  padding: "2.25rem 2.5rem",
  shadow: elevation.soft,
} as const;

const secondarySurface = {
  background: colorCss.bg.surface.secondary,
  textColor: colorCss.text.ink.inverted,
} as const;

const recordCard = {
  container: {
    background: colorCss.bg.surface.paper.primary,
    borderColor: "rgba(123, 94, 58, 0.2)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: radius.md,
    padding: "1.5rem",
    hover: {
      shadow: elevation.soft,
      borderColor: colorCss.accent.primary,
    },
    focusRing: {
      width: "2px",
      color: "rgba(176, 138, 90, 0.4)",
      offset: "2px",
    },
  },
  header: {
    gap: "0.75rem",
    marginBottom: "0.75rem",
  },
  title: {
    fontSize: "1.05rem",
    fontWeight: 400,
    textColor: colorCss.text.ink.primary,
  },
  meta: {
    fontSize: "0.9rem",
    textColor: colorCss.text.ink.muted,
  },
  detailGrid: {
    minColumnWidth: "120px",
    gap: "0.5rem 1.25rem",
    marginBottom: "1rem",
  },
  detailLabel: {
    fontSize: "0.9rem",
    fontWeight: 500,
    textColor: colorCss.text.ink.secondary,
  },
  detailValue: {
    fontFamily: fontFamilies.ui,
    fontWeight: 600,
    textColor: colorCss.text.ink.primary,
  },
  notes: {
    background: "rgba(123, 94, 58, 0.08)",
    borderColor: colorCss.accent.primary,
    borderWidth: "3px",
    borderRadius: radius.sm,
    padding: "0.75rem",
    textColor: colorCss.text.ink.secondary,
    fontSize: "0.9rem",
    lineHeight: "1.4",
  },
} as const;

const recordListShell = {
  background: colorCss.bg.surface.paper.secondary,
  borderColor: "rgba(123, 94, 58, 0.2)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderRadius: radius.md,
  padding: "1.5rem",
} as const;

export { cardSurface, pageSurface, recordCard, recordListShell, secondarySurface };
export type CardSurfaceTokens = typeof cardSurface;
export type PageSurfaceTokens = typeof pageSurface;
const cardVariants = {
  flat: {
    borderColor: "transparent",
    shadow: "none",
  },
  empty: {
    borderStyle: "dashed",
    borderColor: "rgba(123, 94, 58, 0.35)",
    background: colorCss.bg.surface.paper.primary,
  },
} as const;

export { cardVariants };
export type CardVariantTokens = typeof cardVariants;
