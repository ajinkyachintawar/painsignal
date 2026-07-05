import type { CSSProperties } from "react";

// Lets us port the design's raw CSS-string styles directly into React without
// hand-translating hundreds of dynamically computed strings into style objects.
export function css(str: string): CSSProperties {
  const style: Record<string, string> = {};
  for (const decl of str.split(";")) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (!prop || !value) continue;
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    style[camel] = value;
  }
  return style as CSSProperties;
}
