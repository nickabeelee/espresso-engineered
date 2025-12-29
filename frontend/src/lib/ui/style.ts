type StyleValue = string | number | null | undefined;

type StyleMap = Record<string, StyleValue>;

function toStyleString(styles: StyleMap): string {
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
}

function toCssVars(prefix: string, tokens: StyleMap): StyleMap {
  const sanitizedPrefix = prefix.startsWith("--") ? prefix : `--${prefix}`;
  const vars: StyleMap = {};

  Object.entries(tokens).forEach(([key, value]) => {
    vars[`${sanitizedPrefix}-${key}`] = value;
  });

  return vars;
}

export { toCssVars, toStyleString };
export type { StyleMap, StyleValue };
