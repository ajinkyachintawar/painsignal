// NOTE: HeyGen needs a public audio_url for a custom voice. ElevenLabs' TTS endpoint
// returns raw audio bytes, not a URL, so true ElevenLabs-voice lip-sync needs an upload
// step (e.g. Supabase Storage) in between. Default path below uses HeyGen's own voice
// catalog (no hosting needed) so the pipeline works end-to-end without that extra hop.

export async function generateVideo(scriptText: string) {
  const genRes = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.HEYGEN_API_KEY as string,
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: process.env.HEYGEN_AVATAR_ID,
            avatar_style: "normal",
          },
          voice: {
            type: "text",
            input_text: scriptText,
            voice_id: process.env.HEYGEN_VOICE_ID,
          },
        },
      ],
      dimension: { width: 1280, height: 720 },
    }),
  });
  if (!genRes.ok) throw new Error(`HeyGen error ${genRes.status}: ${await genRes.text()}`);
  const { data } = await genRes.json();
  return data.video_id as string;
}

export async function pollVideoStatus(videoId: string, timeoutMs = 300_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const statusRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { "X-Api-Key": process.env.HEYGEN_API_KEY as string },
    });
    const { data } = await statusRes.json();
    if (data.status === "completed") return data.video_url as string;
    if (data.status === "failed") throw new Error("HeyGen render failed");
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("HeyGen render timed out");
}

export async function renderReplyVideo(scriptText: string) {
  const videoId = await generateVideo(scriptText);
  return pollVideoStatus(videoId);
}

// Single, fast status check — for use inside short-lived serverless functions,
// where blocking for the full 2-3 minute render would hit the platform's execution
// timeout. Callers poll this repeatedly instead of us polling internally.
export async function checkVideoOnce(videoId: string): Promise<{ status: "pending" | "completed" | "failed"; videoUrl?: string }> {
  const statusRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-Api-Key": process.env.HEYGEN_API_KEY as string },
  });
  const { data } = await statusRes.json();
  if (data.status === "completed") return { status: "completed", videoUrl: data.video_url as string };
  if (data.status === "failed") return { status: "failed" };
  return { status: "pending" };
}
