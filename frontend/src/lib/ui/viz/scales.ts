const scaleDefaults = {
  linear: {
    nice: true,
    clamp: false,
  },
  band: {
    paddingInner: 0.2,
    paddingOuter: 0.1,
    align: 0.5,
  },
  time: {
    nice: true,
  },
} as const;

export { scaleDefaults };
export type ScaleDefaults = typeof scaleDefaults;
