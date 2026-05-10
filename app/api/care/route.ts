import { NextResponse } from "next/server";
import { geocode } from "@/lib/geocode";
import { loadFQHCs, nearby } from "@/lib/hrsa";
import { loadHospitals } from "@/lib/cms-hospitals";
import { detectEmergency } from "@/lib/emergency";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const zip: string = (body.zip || "").toString();
  const symptoms: string = (body.symptoms || "").toString();
  const language: string = (body.language || "en").toString();
  const insurance: string = (body.insurance || "").toString();
  const circumstances: string[] = Array.isArray(body.circumstances) ? body.circumstances : [];

  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "Invalid ZIP" }, { status: 400 });
  }

  const center = await geocode(zip);
  if (!center) {
    return NextResponse.json({ error: "Could not geocode ZIP" }, { status: 422 });
  }

  const fqhcs = nearby(loadFQHCs(), center.lat, center.lng, 25).map((f) => ({
    ...f,
    source: "FQHC" as const,
  }));
  const hospitals = nearby(loadHospitals(), center.lat, center.lng, 25).map((h) => ({
    ...h,
    source: "Nonprofit Hospital" as const,
  }));

  const isPregnant = circumstances.includes("pregnant");
  const isChildren = circumstances.includes("children");
  const emergency =
    circumstances.includes("emergency") || !!detectEmergency(symptoms, language);

  let combined: any[] = [...fqhcs, ...hospitals];

  // Tag-based prioritization
  combined = combined.map((f) => {
    const services: string[] = (f.services || []).map((s: string) => s.toLowerCase());
    let score = 0;
    if ((isPregnant || isChildren) &&
      services.some((s) => /obstet|pediatr|wic|ob.?gyn/.test(s))) {
      score += 5;
    }
    if (emergency && f.has_er) score += 100;
    return { ...f, _score: score };
  });

  combined.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return a.distance_miles - b.distance_miles;
  });

  const top = combined.slice(0, 12).map((f) => ({
    name: f.name,
    address: f.address,
    lat: f.lat,
    lng: f.lng,
    phone: f.phone,
    distance_miles: Math.round(f.distance_miles * 10) / 10,
    services: f.services || [],
    languages: f.languages || [],
    sliding_scale: !!f.sliding_scale,
    accepts_uninsured: !!f.accepts_uninsured,
    source: f.source,
    has_er: !!f.has_er,
    charity_care_policy_url: f.charity_care_policy_url || null,
  }));

  return NextResponse.json({
    center,
    zip,
    insurance,
    emergency,
    results: top,
  });
}
