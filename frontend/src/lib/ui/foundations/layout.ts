const layout = {
  page: {
    maxWidth: "980px",
    padding: {
      desktop: "2rem 2rem 3.5rem",
      mobile: "1.5rem 1rem 2.5rem",
    },
  },
  surface: {
    padding: {
      desktop: "2.25rem 2.5rem",
      mobile: "1.5rem",
    },
  },
  nav: {
    padding: {
      desktop: "1.25rem 2rem",
      mobile: "1rem 1.25rem",
    },
  },
  contentWidth: {
    reading: "720px",
    discovery: "980px",
  },
} as const;

export { layout };
export type LayoutTokens = typeof layout;
