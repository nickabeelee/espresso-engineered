export function parseAllowedOriginSuffixes(
  envValue: string | undefined = process.env.ALLOWED_ORIGIN_SUFFIXES
): string[] {
  if (!envValue) {
    return [];
  }

  return envValue
    .split(',')
    .map((suffix) => suffix.trim().toLowerCase())
    .filter(Boolean);
}

export function isOriginAllowed(
  origin: string | undefined | null,
  allowedSuffixes: string[]
): boolean {
  if (!origin) {
    return true;
  }

  let hostname: string;
  try {
    hostname = new URL(origin.toLowerCase()).hostname;
  } catch {
    return false;
  }

  if (!hostname) {
    return false;
  }

  return allowedSuffixes.some((suffix) => {
    if (!suffix) {
      return false;
    }

    if (hostname.endsWith(suffix)) {
      return true;
    }

    // Allow exact apex match when suffixes include a leading dot.
    if (suffix.startsWith('.') && hostname === suffix.slice(1)) {
      return true;
    }

    return false;
  });
}
