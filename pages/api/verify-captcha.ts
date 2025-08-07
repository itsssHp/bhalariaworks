// ✅ For Pages Router API route — must export default function
import type { NextApiRequest, NextApiResponse } from "next";

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ verified: boolean; score: number }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ verified: false, score: 0 });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ verified: false, score: 0 });
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY!;
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }).toString(),
      }
    );

    const data: RecaptchaResponse = await response.json();
    const verified = data.success && data.score >= 0.5;

    return res.status(200).json({ verified, score: data.score });
  } catch (error) {
    console.error("Captcha verification error:", error);
    return res.status(500).json({ verified: false, score: 0 });
  }
}
