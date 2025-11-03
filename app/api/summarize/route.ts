import { NextResponse } from "next/server";

// Summarize text using Hugging Face Inference API (DistilBART)
export async function POST(request: Request) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing HUGGINGFACE_API_KEY in environment." },
      { status: 500 }
    );
  }

  // Prepare fallback variables accessible in catch
  let simpleBullets = "";
  try {
    const { text, max_length = 150, min_length = 50 } = (await request.json()) as {
      text?: string;
      max_length?: number;
      min_length?: number;
    };

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    // Truncate overly long inputs to keep within common model limits
    const normalized = text.replace(/\s+/g, " ").trim();
    // Keep inputs modest to avoid long generation on free tiers
    const truncated = normalized.length > 1200 ? normalized.slice(0, 1200) : normalized;

    // Prepare a simple extractive fallback (first 5 sentences)
    const simpleSentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20)
      .slice(0, 5);
    simpleBullets = simpleSentences.map((s) => `• ${s}`).join("\n");

    // Abort after 30 seconds to avoid hanging requests
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let hfRes: Response;
    try {
      hfRes = await fetch(
        "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6?wait_for_model=true",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            inputs: truncated,
            parameters: {
              max_length: Math.min(Number(max_length) || 120, 120),
              min_length: Math.min(Number(min_length) || 40, 60),
              do_sample: false,
            },
          }),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!hfRes.ok) {
      const err = await hfRes.text();
      // If model is loading or rate limited, surface a friendly message
      // Return extractive fallback instead of failing hard
      return NextResponse.json({ summary: simpleBullets, fallback: true });
    }

    const out = (await hfRes.json()) as Array<{ summary_text: string }> | { error?: string };
    // HF can return an array of objects with summary_text
    const summaryText = Array.isArray(out) ? out[0]?.summary_text : (out as any)?.summary_text;
    if (!summaryText) {
      return NextResponse.json({ summary: simpleBullets, fallback: true });
    }

    // Convert to bullet points
    const bullets = summaryText
      .split(/(?<=[.!?])\s+/)
      .filter((s: string) => s && s.trim().length > 5)
      .map((s: string) => `• ${s.trim()}`)
      .join("\n");

    return NextResponse.json({ summary: bullets });
  } catch (e) {
    // On timeout or any error, return extractive fallback
    return NextResponse.json({ summary: simpleBullets, fallback: true });
  }
}


