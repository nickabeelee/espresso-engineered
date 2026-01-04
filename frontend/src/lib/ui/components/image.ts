import { radius } from "../foundations/radius";

const imageSizes = {
  thumbnail: {
    width: 96,
    height: 96,
    fit: "cover",
    quality: 70,
  },
  card: {
    width: 200,
    height: 200,
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

const imageFrame = {
  background: "rgba(123, 94, 58, 0.06)",
  borderColor: "rgba(123, 94, 58, 0.2)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderRadius: radius.md,
  placeholder: {
    background: "rgba(123, 94, 58, 0.04)",
    borderStyle: "dashed",
  },
} as const;

export { imageFrame, imageSizes };
export type ImageSizeTokens = typeof imageSizes;
export type ImageFrameTokens = typeof imageFrame;
