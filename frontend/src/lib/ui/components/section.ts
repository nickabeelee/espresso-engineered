import { colorCss } from "../foundations/color";
import { spacing } from "../foundations/spacing";
import { textStyles } from "../foundations/typography";

const sectionBlock = {
  container: {
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
    textColor: colorCss.text.ink.secondary,
    fontSize: textStyles.headingSecondary.fontSize,
    fontFamily: textStyles.headingSecondary.fontFamily,
    fontWeight: textStyles.headingSecondary.fontWeight,
    lineHeight: textStyles.headingSecondary.lineHeight,
    dividerColor: colorCss.border.subtle,
    dividerHeight: "1px",
    iconColor: colorCss.text.ink.secondary,
    iconSize: 18,
  },
  voice: {
    gap: spacing.xs,
    textColor: colorCss.text.ink.muted,
    fontSize: textStyles.voice.fontSize,
    fontFamily: textStyles.voice.fontFamily,
    fontWeight: textStyles.voice.fontWeight,
    lineHeight: textStyles.voice.lineHeight,
  },
  body: {
    gap: spacing.xl,
  },
} as const;

export { sectionBlock };
export type SectionBlockTokens = typeof sectionBlock;
