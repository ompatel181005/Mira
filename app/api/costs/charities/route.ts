import { NextResponse } from "next/server";
import { loadCharities } from "@/lib/charities";
import { geocode } from "@/lib/geocode";
import { haversineMiles } from "@/lib/distance";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { zip, condition, country } = (await req.json().catch(() => ({}))) as {
    zip?: string;
    condition?: string;
    country?: string;
  };

  const charities = loadCharities();
  let center: { lat: number; lng: number } | null = null;
  if (zip && /^\d{5}$/.test(zip)) {
    center = await geocode(zip);
  }

  let ranked = charities.map((c) => {
    let score = 0;
    let dist: number | null = null;
    if (center && c.lat && c.lng) {
      dist = haversineMiles(center.lat, center.lng, c.lat, c.lng);
      score -= dist; // closer is better
    }
    if (country && c.country_focus && c.country_focus.toLowerCase().includes(country.toLowerCase())) {
      score += 100;
    }
    if (condition && c.applies_to_conditions?.some((x) => x.toLowerCase().includes(condition.toLowerCase()))) {
      score += 50;
    }
    return { ...c, distance_miles: dist == null ? null : Math.round(dist * 10) / 10, _score: score };
  });

  ranked.sort((a, b) => b._score - a._score);
  return NextResponse.json({ results: ranked.slice(0, 15) });
}
