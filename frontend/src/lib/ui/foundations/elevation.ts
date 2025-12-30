const elevation = {
  soft: "0 18px 40px rgba(43, 33, 24, 0.22)",
  hover: "0 18px 40px rgba(43, 33, 24, 0.22)",
  focus: "0 0 0 2px rgba(176, 138, 90, 0.4)",
} as const;

export { elevation };
export type ElevationTokens = typeof elevation;
