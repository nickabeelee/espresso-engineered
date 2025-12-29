const motionDuration = {
  fast: "120ms",
  medium: "260ms",
  slow: "180ms",
} as const;

const motionEasing = {
  standard: "ease",
} as const;

const motion = {
  duration: motionDuration,
  easing: motionEasing,
  preset: {
    subtle: `opacity ${motionDuration.fast} ${motionEasing.standard}`,
    slideIn: `transform ${motionDuration.slow} ${motionEasing.standard}`,
    fadeIn: `opacity ${motionDuration.slow} ${motionEasing.standard}`,
  },
} as const;

export { motion, motionDuration, motionEasing };
export type MotionDurationTokens = typeof motionDuration;
export type MotionEasingTokens = typeof motionEasing;
export type MotionTokens = typeof motion;
