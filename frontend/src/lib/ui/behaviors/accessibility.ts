const accessibility = {
  reducedMotionQuery: "(prefers-reduced-motion: reduce)",
  highContrastQuery: "(prefers-contrast: more)",
  ariaLive: {
    polite: "polite",
    assertive: "assertive",
  },
} as const;

export { accessibility };
export type AccessibilityTokens = typeof accessibility;
