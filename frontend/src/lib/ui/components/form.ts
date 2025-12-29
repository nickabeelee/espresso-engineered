import { radius } from "../foundations/radius";
import { spacing } from "../foundations/spacing";
import { fontSizes, fontFamilies, lineHeights } from "../foundations/typography";
import { colorCss } from "../foundations/color";

const formLayout = {
  fieldGap: spacing.lg,
  stackGap: spacing.xl,
  inlineGap: spacing.md,
} as const;

const formLabel = {
  fontFamily: fontFamilies.ui,
  fontSize: "0.95rem",
  lineHeight: lineHeights.snug,
  fontWeight: 600,
  textColor: colorCss.text.ink.secondary,
} as const;

const formHelperText = {
  fontFamily: fontFamilies.ui,
  fontSize: "0.85rem",
  lineHeight: lineHeights.snug,
  fontWeight: 400,
  textColor: colorCss.text.ink.muted,
} as const;

const formSection = {
  title: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSizes.lg,
    fontWeight: 500,
    textColor: colorCss.text.ink.secondary,
    borderColor: colorCss.border.subtle,
    borderWidth: "1px",
  },
} as const;

const fieldGroup = {
  gap: spacing.sm,
} as const;

const editableField = {
  label: formLabel,
  input: {
    padding: "0.75rem",
    fontSize: fontSizes.md,
    borderColor: colorCss.border.subtle,
    borderWidth: "1px",
    borderRadius: radius.sm,
    focusRing: "0 0 0 2px rgba(176, 138, 90, 0.2)",
  },
  helper: formHelperText,
  error: {
    fontFamily: fontFamilies.ui,
    fontSize: "0.85rem",
    fontWeight: 500,
    textColor: colorCss.semantic.error,
  },
  disabled: {
    background: colorCss.bg.surface.paper.secondary,
    textColor: colorCss.text.ink.muted,
  },
} as const;

const readOnlyField = {
  label: formLabel,
  value: {
    fontFamily: fontFamilies.ui,
    fontSize: "1.1rem",
    fontWeight: 600,
    textColor: colorCss.text.ink.primary,
  },
  container: {
    padding: spacing.lg,
    background: colorCss.bg.surface.paper.secondary,
    borderColor: "rgba(123, 94, 58, 0.2)",
    borderWidth: "1px",
    borderRadius: radius.md,
  },
} as const;

const validationLayout = {
  messageGap: spacing.xs,
  summaryPadding: spacing.sm,
  summaryBorderRadius: radius.sm,
} as const;

export {
  editableField,
  fieldGroup,
  formHelperText,
  formLabel,
  formLayout,
  formSection,
  readOnlyField,
  validationLayout,
};
export type FormLayoutTokens = typeof formLayout;
export type FormLabelTokens = typeof formLabel;
export type ValidationLayoutTokens = typeof validationLayout;
