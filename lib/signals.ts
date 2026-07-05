export type Signal = {
  id: string;
  source: string;
  author: string;
  text: string;
  productContext: string;
};

type ExaResult = {
  id?: string;
  url: string;
  author?: string;
  text?: string;
};

const SOURCE_LABELS: Record<string, string> = {
  "reddit.com": "Reddit",
  "news.ycombinator.com": "Hacker News",
  "github.com": "GitHub",
};

function labelForUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return SOURCE_LABELS[host] ?? host;
  } catch {
    return "Web";
  }
}

const MAX_TEXT_LENGTH = 2000;

export function toSignal(result: ExaResult, productContext: string): Signal {
  const rawText = result.text ?? "";
  const text =
    rawText.length > MAX_TEXT_LENGTH ? rawText.slice(0, MAX_TEXT_LENGTH) + "…" : rawText;

  return {
    id: result.id ?? result.url,
    source: labelForUrl(result.url),
    author: result.author ?? "unknown",
    text,
    productContext,
  };
}
