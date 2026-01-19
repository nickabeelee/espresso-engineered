import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{html,js,ts,svelte}"],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        bg: {
          app: "var(--bg-app-base)",
          surface: {
            secondary: "var(--bg-surface-secondary)",
            paper: "var(--bg-surface-paper)",
            "paper-secondary": "var(--bg-surface-paper-secondary)"
          }
        },
        ink: {
          primary: "var(--text-ink-primary)",
          secondary: "var(--text-ink-secondary)",
          muted: "var(--text-ink-muted)",
          inverted: "var(--text-ink-inverted)",
          "inverted-muted": "var(--text-ink-inverted-muted)",
          placeholder: "var(--text-ink-placeholder)"
        },
        accent: {
          DEFAULT: "var(--accent-primary)",
          dark: "var(--accent-primary-dark)"
        }
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)"
      }
    }
  }
};

export default config;
