const elevation = {
  soft: "0 12px 24px rgba(43, 33, 24, 0.18)",
  hover: "0 12px 24px rgba(43, 33, 24, 0.18)",
  focus: "0 0 0 2px rgba(176, 138, 90, 0.4)",
} as const;

export { elevation };
export type ElevationTokens = typeof elevation;
