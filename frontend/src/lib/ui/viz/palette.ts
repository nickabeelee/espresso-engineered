import { colorHex } from "../foundations/color";

const vizPalette = {
  primary: colorHex.accent.primary,
  neutral: colorHex.text.ink.secondary,
  success: colorHex.semantic.success,
  warning: colorHex.semantic.warning,
  error: colorHex.semantic.error,
  categorical: [
    colorHex.accent.primary,
    colorHex.semantic.success,
    colorHex.semantic.warning,
    colorHex.semantic.error,
    colorHex.text.ink.secondary,
  ],
} as const;

export { vizPalette };
export type VizPaletteTokens = typeof vizPalette;
