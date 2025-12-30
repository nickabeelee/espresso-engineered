const pointer = {
  hitTargetMin: "40px",
  dragThresholdPx: 4,
  hoverIntentMs: 80,
} as const;

export { pointer };
export type PointerTokens = typeof pointer;
