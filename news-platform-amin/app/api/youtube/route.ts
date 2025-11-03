import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const theme = searchParams.get("theme");

  try {
    let url = `${API_BASE}/api/youtube/videos`;
    if (theme) {
      url = `${API_BASE}/api/youtube/topic?theme=${encodeURIComponent(theme)}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to fetch YouTube videos." },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching YouTube videos:", err);
    return NextResponse.json(
      { error: "Unexpected error fetching YouTube videos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoUrl, action } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL is required." },
        { status: 400 }
      );
    }

    const endpoint = action === 'summarize' ? 'summary' : 'transcribe';
    const url = `${API_BASE}/api/youtube/${endpoint}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ video_url: videoUrl }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || `Failed to ${action} video.` },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(`Error processing YouTube video:`, err);
    return NextResponse.json(
      { error: "Unexpected error processing video." },
      { status: 500 }
    );
  }
}