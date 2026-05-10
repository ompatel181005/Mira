import { NextResponse } from "next/server";
import { brandToGeneric } from "@/lib/rxnorm";
import { drugInfo } from "@/lib/openfda";
import { nadacAlternatives, nadacLookup } from "@/lib/nadac";
import { findPAPs } from "@/lib/needymeds";
import { costPlusLookup } from "@/lib/costplus";

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

  const costPlus = await costPlusLookup(generic || name);
  const nadac = generic ? nadacLookup(generic) : null;
  const nadacOptions = nadac ? [] : nadacAlternatives(generic || lower, 3);
  const paps = generic ? findPAPs(generic) : [];

  const genericSlug = generic ? slug(generic) : slug(name);
  const lowestNadac = nadacOptions.reduce(
    (lowest, row) => (!lowest || row.price_per_unit < lowest.price_per_unit ? row : lowest),
    null as (typeof nadacOptions)[number] | null
  );
  const nadacPrice = nadac
    ? `$${nadac.price_per_unit.toFixed(2)} / ${nadac.unit}`
    : lowestNadac
      ? `From $${lowestNadac.price_per_unit.toFixed(2)} / ${lowestNadac.unit}`
      : null;
  const nadacNotes = nadac
    ? "National average wholesale (CMS)"
    : nadacOptions.length > 0
      ? `National average wholesale options: ${nadacOptions
          .map((row) => `${row.generic} ($${row.price_per_unit.toFixed(2)} / ${row.unit})`)
          .join(", ")}`
      : "National average wholesale (CMS)";

  const sources = [
    ...(costPlus
      ? [
          {
            source: "Cost Plus Drugs",
            price: `${costPlus.unit_price} / unit`,
            notes: `${costPlus.medication_name} ${costPlus.strength} ${costPlus.form}; shipping and fees may apply`,
            action_label: "View on Cost Plus Drugs",
            url: costPlus.url,
          },
        ]
      : []),
    {
      source: "NADAC reference",
      price: nadacPrice,
      notes: nadacNotes,
      action_label: null,
      url: null,
    },
  ];

  const externalChecks = [
    ...(!costPlus
      ? [
          {
            source: "Cost Plus Drugs",
            status: "Not listed",
            notes: "This medication was not found in the Cost Plus Drugs public formulary.",
            action_label: "Search Cost Plus Drugs",
            url: "https://www.costplusdrugs.com/medications/",
          },
        ]
      : []),
    {
      source: "GoodRx",
      status: "External coupon check",
      notes: "GoodRx requires live pharmacy coupon data, so MIRA links out instead of showing a stale estimate.",
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
    externalChecks,
    paps,
    zip: zip || null,
  });
}
