import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'NewsAPI key not configured. Add NEWSAPI_KEY to .env' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?category=health&language=en&pageSize=21&apiKey=${apiKey}`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("NewsAPI error:", res.status, text);
      return NextResponse.json(
        { error: "Failed to fetch health news" },
        { status: 502 }
      );
    }

    const data = await res.json();

    const articles = (data.articles || []).map((a: any) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      image: a.urlToImage,
      source: a.source?.name,
      publishedAt: a.publishedAt,
    }));

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Trends fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch health news" },
      { status: 500 }
    );
  }
}
