const radius = {
  xs: "4px",
  sm: "6px",
  md: "10px",
  lg: "16px",
  pill: "999px",
} as const;

export { radius };
export type RadiusTokens = typeof radius;
