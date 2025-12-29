const formatDefaults = {
  number: {
    decimals: 1,
  },
  percent: {
    decimals: 0,
    multiplier: 100,
  },
  date: {
    locale: "en-US",
    options: { year: "numeric", month: "short", day: "numeric" } as const,
  },
} as const;

export { formatDefaults };
export type FormatDefaults = typeof formatDefaults;
