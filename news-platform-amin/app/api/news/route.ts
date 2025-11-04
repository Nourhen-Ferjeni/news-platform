import { NextResponse } from "next/server";

// GET /api/news?q=technology&pageSize=10
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "technology OR world OR business";
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

  const apiKey = process.env.NEWSAPI_KEY || "8ac582cde6c241fdb71e5835fe4c201a";
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing NEWSAPI_KEY in environment." },
      { status: 500 }
    );
  }

  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - 7);

  const params = new URLSearchParams({
    q,
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    language: "en",
    sortBy: "publishedAt",
    pageSize: String(pageSize),
    apiKey,
  });

  const url = `https://newsapi.org/v2/everything?${params.toString()}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to fetch news." },
        { status: res.status }
      );
    }
    return NextResponse.json({ articles: data.articles || [] });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error fetching news." },
      { status: 500 }
    );
  }
}


