import { colorCss } from "../foundations/color";
import { motion } from "../foundations/motion";
import { radius } from "../foundations/radius";
import { fontFamilies } from "../foundations/typography";

const summaryCard = {
  container: {
    background: colorCss.bg.surface.paper.primary,
    borderColor: "rgba(123, 94, 58, 0.2)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: radius.md,
    padding: "1rem",
    transition: `box-shadow ${motion.duration.fast}, border-color ${motion.duration.fast}`,
  },
  state: {
    hover: {
      shadow: "0 18px 40px rgba(43, 33, 24, 0.22)",
      borderColor: colorCss.accent.primary,
    },
    focus: {
      ring: "2px solid rgba(176, 138, 90, 0.4)",
      offset: "2px",
    },
  },
  header: {
    gap: "0.75rem",
    marginBottom: "0.75rem",
  },
  kicker: {
    fontFamily: fontFamilies.ui,
    fontSize: "0.75rem",
    textColor: colorCss.text.ink.muted,
  },
  title: {
    fontFamily: fontFamilies.ui,
    fontSize: "1.05rem",
    fontWeight: 600,
    textColor: colorCss.text.ink.primary,
  },
  meta: {
    fontFamily: fontFamilies.ui,
    fontSize: "0.9rem",
    textColor: colorCss.text.ink.muted,
  },
  actions: {
    gap: "0.5rem",
  },
  detailGrid: {
    minColumnWidth: "140px",
    gap: "0.5rem 1.25rem",
  },
  detailLabel: {
    fontFamily: fontFamilies.ui,
    fontSize: "0.8rem",
    fontWeight: 500,
    textColor: colorCss.text.ink.muted,
  },
  detailValue: {
    fontFamily: fontFamilies.ui,
    fontSize: "0.9rem",
    fontWeight: 600,
    textColor: colorCss.text.ink.primary,
  },
  emptyValue: {
    fontFamily: fontFamilies.ui,
    fontSize: "0.9rem",
    fontStyle: "italic",
    textColor: colorCss.text.ink.muted,
  },
  statusPill: {
    fontFamily: fontFamilies.ui,
    fontSize: "0.7rem",
    fontWeight: 600,
    borderRadius: "999px",
    padding: "0.2rem 0.5rem",
    variants: {
      success: {
        background: "rgba(85, 98, 74, 0.18)",
        textColor: colorCss.semantic.success,
      },
      warning: {
        background: "rgba(138, 106, 62, 0.18)",
        textColor: colorCss.semantic.warning,
      },
      error: {
        background: "rgba(122, 62, 47, 0.18)",
        textColor: colorCss.semantic.error,
      },
    },
  },
} as const;

export { summaryCard };
export type SummaryCardTokens = typeof summaryCard;
