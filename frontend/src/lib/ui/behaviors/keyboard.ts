const activationKeys = ["Enter", " "] as const;
const navigationKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"] as const;
const escapeKeys = ["Escape"] as const;

export { activationKeys, navigationKeys, escapeKeys };
export type ActivationKey = typeof activationKeys[number];
export type NavigationKey = typeof navigationKeys[number];
export type EscapeKey = typeof escapeKeys[number];
