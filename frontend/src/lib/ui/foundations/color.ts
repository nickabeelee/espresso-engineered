const colorHex = {
  bg: {
    app: {
      base: "#402B15",
    },
    surface: {
      secondary: "#715C3B",
      paper: {
        primary: "#E4D6BF",
        secondary: "#D8C9AF",
      },
    },
  },
  text: {
    ink: {
      primary: "#2B2118",
      secondary: "#4A3A2C",
      muted: "#6A5A4A",
      placeholder: "#958573",
      inverted: "#D6C7AE",
      invertedMuted: "#B9AA92",
    },
  },
  accent: {
    primary: "#B08A5A",
    primaryDark: "#8E6C44",
  },
  semantic: {
    success: "#55624A",
    warning: "#8A6A3E",
    error: "#7A3E2F",
  },
  border: {
    subtle: "#C3B197",
    strong: "#9B8566",
  },
} as const;

const colorCss = {
  bg: {
    app: {
      base: "var(--bg-app-base)",
    },
    surface: {
      secondary: "var(--bg-surface-secondary)",
      paper: {
        primary: "var(--bg-surface-paper)",
        secondary: "var(--bg-surface-paper-secondary)",
      },
    },
  },
  text: {
    ink: {
      primary: "var(--text-ink-primary)",
      secondary: "var(--text-ink-secondary)",
      muted: "var(--text-ink-muted)",
      placeholder: "var(--text-ink-placeholder)",
      inverted: "var(--text-ink-inverted)",
      invertedMuted: "var(--text-ink-inverted-muted)",
    },
  },
  accent: {
    primary: "var(--accent-primary)",
    primaryDark: "var(--accent-primary-dark)",
  },
  semantic: {
    success: "var(--semantic-success)",
    warning: "var(--semantic-warning)",
    error: "var(--semantic-error)",
  },
  border: {
    subtle: "var(--border-subtle)",
    strong: "var(--border-strong)",
  },
  shadow: {
    soft: "var(--shadow-soft)",
  },
} as const;

export { colorCss, colorHex };
export type ColorHexTokens = typeof colorHex;
export type ColorCssTokens = typeof colorCss;
