import { motion } from "../foundations/motion";

const transitions = {
  fade: `opacity ${motion.duration.slow} ${motion.easing.standard}`,
  slide: `transform ${motion.duration.slow} ${motion.easing.standard}`,
  hover: `box-shadow ${motion.duration.fast} ${motion.easing.standard}, border-color ${motion.duration.fast} ${motion.easing.standard}`,
} as const;

export { transitions };
export type TransitionTokens = typeof transitions;
