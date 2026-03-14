import { NextRequest, NextResponse } from "next/server";
import { fetchSolarData } from "@/modules/M3-solar-data/pvgisClient";
import { fetchCurrentWeather } from "@/modules/M3-solar-data/weatherClient";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = parseFloat(sp.get("lat") ?? "");
  const lng = parseFloat(sp.get("lng") ?? "");
  const tilt = parseFloat(sp.get("tilt") ?? "32");
  const azimuth = parseFloat(sp.get("azimuth") ?? "0");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  try {
    const [solar, weather] = await Promise.all([
      fetchSolarData({ lat, lng, tilt, azimuth }),
      fetchCurrentWeather(lat, lng),
    ]);

    return NextResponse.json({ ...solar, currentWeather: weather });
  } catch {
    return NextResponse.json({ error: "Solar data fetch failed" }, { status: 500 });
  }
}
