import { NextRequest, NextResponse } from "next/server";
import { analyzeRoof } from "@/modules/M2-roof-analysis/roofAnalyzer";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = parseFloat(sp.get("lat") ?? "");
  const lng = parseFloat(sp.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  try {
    const data = await analyzeRoof(lat, lng);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Roof analysis failed" }, { status: 500 });
  }
}
