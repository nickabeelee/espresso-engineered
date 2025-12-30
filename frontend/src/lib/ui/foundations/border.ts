const border = {
  width: {
    hairline: "1px",
    focus: "2px",
  },
  style: {
    solid: "solid",
    dashed: "dashed",
  },
} as const;

export { border };
export type BorderTokens = typeof border;
