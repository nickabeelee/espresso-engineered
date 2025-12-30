import { colorCss } from "../foundations/color";
import { radius } from "../foundations/radius";

const upload = {
  surface: {
    background: colorCss.bg.surface.paper.secondary,
    borderColor: colorCss.border.subtle,
    radius: radius.md,
  },
  prompt: {
    textColor: colorCss.text.ink.primary,
    mutedColor: colorCss.text.ink.muted,
  },
  area: {
    padding: "2rem",
    minHeight: "120px",
    hoverBackground: "rgba(176, 138, 90, 0.12)",
    hoverBorder: colorCss.accent.primary,
  },
  spinner: {
    borderColor: colorCss.border.subtle,
    accentColor: colorCss.accent.primary,
    size: "24px",
  },
  image: {
    maxWidth: "200px",
    maxHeight: "150px",
  },
} as const;

export { upload };
export type UploadTokens = typeof upload;
