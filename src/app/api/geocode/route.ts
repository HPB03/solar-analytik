import { NextRequest, NextResponse } from "next/server";
import { fetchSuggestions } from "@/modules/M1-geocoding/geocode";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Mapbox token not configured" }, { status: 500 });
  }

  try {
    const suggestions = await fetchSuggestions(query, token);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
