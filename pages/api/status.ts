import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    exa: Boolean(process.env.EXA_API_KEY),
    groq: Boolean(process.env.GROQ_API_KEY),
    heygen: Boolean(process.env.HEYGEN_API_KEY && process.env.HEYGEN_AVATAR_ID && process.env.HEYGEN_VOICE_ID),
  });
}
