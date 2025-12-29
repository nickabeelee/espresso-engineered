import { colorCss } from "../foundations/color";
import { motion } from "../foundations/motion";
import { radius } from "../foundations/radius";
import { fontFamilies } from "../foundations/typography";

const editableCard = {
  container: {
    background: colorCss.bg.surface.paper.primary,
    borderColor: colorCss.border.subtle,
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: radius.md,
    padding: "1rem",
    transition: `border-color ${motion.duration.fast}`,
  },
  state: {
    editing: {
      borderColor: colorCss.accent.primary,
      shadow: "0 0 0 2px rgba(176, 138, 90, 0.1)",
    },
    newCard: {
      borderColor: colorCss.accent.primary,
      borderStyle: "dashed",
      background: colorCss.bg.surface.paper.secondary,
      marginBottom: "1.5rem",
    },
    newEditing: {
      borderStyle: "solid",
      background: colorCss.bg.surface.paper.primary,
      marginBottom: "1.5rem",
    },
  },
  header: {
    gap: "1rem",
    marginBottom: "0.75rem",
  },
  title: {
    fontFamily: fontFamilies.ui,
    fontSize: "1rem",
    fontWeight: 500,
    textColor: colorCss.text.ink.primary,
  },
  info: {
    fontFamily: fontFamilies.ui,
    fontSize: "0.8rem",
    textColor: colorCss.text.ink.secondary,
  },
  owner: {
    textColor: colorCss.text.ink.muted,
    highlightColor: colorCss.semantic.success,
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  actions: {
    gap: "0.5rem",
    editActionsGap: "0.25rem",
  },
  statusPill: {
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
  error: {
    background: "rgba(122, 62, 47, 0.1)",
    borderColor: "rgba(122, 62, 47, 0.3)",
    textColor: colorCss.semantic.error,
    borderRadius: radius.sm,
    padding: "0.5rem 0.75rem",
    fontFamily: fontFamilies.ui,
    fontSize: "0.9rem",
  },
  detailGrid: {
    gap: "0.75rem",
  },
  detail: {
    label: {
      fontFamily: fontFamilies.ui,
      fontSize: "0.8rem",
      fontWeight: 500,
      textColor: colorCss.text.ink.secondary,
    },
    value: {
      fontFamily: fontFamilies.content,
      fontSize: "0.9rem",
      textColor: colorCss.text.ink.primary,
    },
    empty: {
      fontFamily: fontFamilies.ui,
      fontStyle: "italic",
      textColor: colorCss.text.ink.muted,
    },
  },
  input: {
    fontFamily: fontFamilies.ui,
    fontSize: "0.9rem",
    textColor: colorCss.text.ink.primary,
    background: colorCss.bg.surface.paper.primary,
    borderColor: colorCss.border.subtle,
    borderWidth: "1px",
    borderRadius: radius.sm,
    padding: "0.4rem 0.6rem",
    focusRing: "0 0 0 2px rgba(176, 138, 90, 0.1)",
  },
  section: {
    dividerColor: "rgba(123, 94, 58, 0.2)",
    title: {
      fontFamily: fontFamilies.ui,
      fontSize: "0.9rem",
      fontWeight: 600,
      textColor: colorCss.text.ink.secondary,
    },
  },
} as const;

const editableCardVariants = {
  compact: {
    detailMinColumnWidth: "120px",
  },
  standard: {
    detailMinColumnWidth: "200px",
  },
  dense: {
    detailMinColumnWidth: "160px",
    detailGap: "0.5rem",
  },
} as const;

export { editableCard, editableCardVariants };
export type EditableCardTokens = typeof editableCard;
export type EditableCardVariantTokens = typeof editableCardVariants;
