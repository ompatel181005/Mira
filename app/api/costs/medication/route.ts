import { NextResponse } from "next/server";
import { brandToGeneric } from "@/lib/rxnorm";
import { drugInfo } from "@/lib/openfda";
import { nadacLookup } from "@/lib/nadac";
import { findPAPs } from "@/lib/needymeds";

export const runtime = "nodejs";

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  const { name, zip } = (await req.json().catch(() => ({}))) as { name?: string; zip?: string };
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const lower = name.toLowerCase().trim();
  const local = nadacLookup(lower);
  let generic = local?.generic || null;
  let rxcui: string | null = null;
  let info: Awaited<ReturnType<typeof drugInfo>> = { purpose: null, manufacturer: null };

  if (!generic) {
    const rx = await brandToGeneric(name);
    generic = rx.generic ? rx.generic.toLowerCase() : null;
    rxcui = rx.rxcui;
  }

  if (generic) {
    info = await drugInfo(generic);
  }

  const nadac = generic ? nadacLookup(generic) : null;
  const paps = generic ? findPAPs(generic) : [];

  const genericSlug = generic ? slug(generic) : slug(name);

  const sources = [
    {
      source: "Cost Plus Drugs",
      price: null,
      notes: "Mail-order, transparent pricing",
      action_label: "View on costplusdrugs.com",
      url: `https://costplusdrugs.com/medications/?search=${encodeURIComponent(generic || name)}`,
    },
    {
      source: "NADAC reference",
      price: nadac ? `$${nadac.price_per_unit.toFixed(2)} / ${nadac.unit}` : null,
      notes: "National average wholesale (CMS)",
      action_label: null,
      url: null,
    },
    {
      source: "GoodRx",
      price: null,
      notes: "Live coupon prices in your area",
      action_label: "Check on GoodRx",
      url: `https://www.goodrx.com/${genericSlug}`,
    },
  ];

  return NextResponse.json({
    input: name,
    generic,
    rxcui,
    purpose: info.purpose,
    sources,
    paps,
    zip: zip || null,
  });
}
