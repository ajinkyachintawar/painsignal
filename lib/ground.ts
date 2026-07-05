// Retrieval step for diagnosis: searches the web for real documentation, changelogs,
// or prior resolutions of this specific problem, so the diagnose prompt can reason
// from actual source material instead of purely the model's general pretrained
// knowledge. Best-effort — returns "" on failure so triage still proceeds ungrounded.

// Crude but generic boilerplate detector: real prose has a high ratio of unique
// tokens to total tokens; extraction failures (repeated CSS/nav junk from JS-heavy
// pages like Discourse forums) have very low uniqueness.
function looksLikeRealProse(text: string): boolean {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length < 20) return false;
  const unique = new Set(tokens.map((t) => t.toLowerCase()));
  return unique.size / tokens.length > 0.3;
}

export async function fetchGroundingContext(
  companyName: string,
  complaintSummary: string,
  excludeUrl?: string
): Promise<string> {
  try {
    const exaRes = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.EXA_API_KEY as string,
      },
      body: JSON.stringify({
        query: `${companyName} ${complaintSummary} documentation OR changelog OR resolved OR fix`,
        numResults: 5,
        type: "neural",
        contents: { text: true },
      }),
    });
    if (!exaRes.ok) return "";
    const data = await exaRes.json();
    const results = (data.results ?? []) as { url: string; text?: string }[];
    return results
      .filter((r) => r.url !== excludeUrl)
      .filter((r) => r.text && looksLikeRealProse(r.text))
      .slice(0, 3)
      .map((r) => `Source: ${r.url}\n${(r.text ?? "").slice(0, 800)}`)
      .join("\n\n---\n\n");
  } catch {
    return "";
  }
}
