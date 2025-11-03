import { NextResponse } from "next/server";

// Improved extraction: prefer <article>, strip chrome, choose longest paragraph block
export async function POST(request: Request) {
  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    const rawHtml = await resp.text();

    // Remove script/style and common layout blocks quickly
    let html = rawHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<(header|footer|nav|aside)[^>]*>[\s\S]*?<\/\1>/gi, "");

    // If an <article> exists, focus on its content
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const scope = articleMatch ? articleMatch[1] : html;

    // Collect paragraphs within the scope
    const rawParagraphs = Array.from(scope.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).map((m) => m[1]);

    // Clean and filter paragraphs
    const junkPattern = /(subscribe|newsletter|cookie|privacy|terms|signin|sign\s?in|log\s?in|advertis|copyright|©|share\s|follow\s|related\s(stories|articles))/i;
    const paragraphs = rawParagraphs
      .map((t) => t.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim())
      .filter((t) => t.length >= 60 && !junkPattern.test(t));

    if (paragraphs.length === 0) {
      return NextResponse.json(
        { error: "Could not extract sufficient article text." },
        { status: 422 }
      );
    }

    // Group consecutive paragraphs into blocks and choose the longest block
    type Block = { text: string; length: number };
    const blocks: Block[] = [];
    let current: string[] = [];
    const maxGap = 1; // treat any sequence as contiguous in this regex approach
    for (let i = 0; i < paragraphs.length; i++) {
      current.push(paragraphs[i]);
      const isLast = i === paragraphs.length - 1;
      if (isLast) {
        const text = current.join("\n\n");
        blocks.push({ text, length: text.length });
      }
    }
    const best = blocks.sort((a, b) => b.length - a.length)[0];
    const text = best.text.trim();

    if (!text || text.split(" ").length < 50) {
      return NextResponse.json(
        { error: "Could not extract sufficient article text." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to extract article." },
      { status: 500 }
    );
  }
}


