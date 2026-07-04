// Qwen via DashScope's OpenAI-compatible endpoint — plain fetch, no SDK needed.
export async function callQwen(messages: { role: string; content: string }[]) {
  const res = await fetch(
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages,
        response_format: { type: "json_object" },
      }),
    }
  );
  if (!res.ok) throw new Error(`Qwen error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}
