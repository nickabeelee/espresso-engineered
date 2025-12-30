import { colorCss } from "../foundations/color";
import { radius } from "../foundations/radius";

const noticeBase = {
  borderRadius: radius.md,
  padding: "0.85rem 1rem",
  borderWidth: "1px",
  borderStyle: "solid",
  fontSize: "0.9rem",
} as const;

const noticeVariants = {
  error: {
    background: "rgba(122, 62, 47, 0.12)",
    borderColor: "rgba(122, 62, 47, 0.25)",
    textColor: colorCss.semantic.error,
  },
  success: {
    background: "rgba(85, 98, 74, 0.15)",
    borderColor: "rgba(85, 98, 74, 0.25)",
    textColor: colorCss.semantic.success,
  },
  warning: {
    background: "rgba(138, 106, 62, 0.15)",
    borderColor: "rgba(138, 106, 62, 0.25)",
    textColor: colorCss.semantic.warning,
  },
  neutral: {
    background: "rgba(123, 94, 58, 0.12)",
    borderColor: "rgba(123, 94, 58, 0.25)",
    textColor: colorCss.text.ink.secondary,
  },
} as const;

export { noticeBase, noticeVariants };
export type NoticeBaseTokens = typeof noticeBase;
export type NoticeVariantTokens = typeof noticeVariants;
