const imageSizes = {
  thumbnail: {
    width: 96,
    height: 96,
    fit: "cover",
    quality: 70,
  },
  card: {
    width: 160,
    height: 160,
    fit: "cover",
    quality: 75,
  },
  detail: {
    width: 960,
    height: 720,
    fit: "contain",
    quality: 80,
  },
} as const;

export { imageSizes };
export type ImageSizeTokens = typeof imageSizes;
