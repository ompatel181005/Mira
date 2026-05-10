import { NextResponse } from "next/server";
import { pctOfFPL } from "@/lib/fpl";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { uninsured, usResident, householdSize, annualIncome, condition } = body as {
    uninsured: boolean;
    usResident: boolean;
    householdSize: number;
    annualIncome?: number;
    condition: "pregnant" | "er_visit" | "dialysis" | "other";
  };

  const pct = annualIncome != null ? pctOfFPL(annualIncome, householdSize || 1) : null;
  const incomeOk = pct == null ? null : pct <= 138;
  const conditionOk = ["pregnant", "er_visit", "dialysis"].includes(condition);

  const eligible = uninsured && usResident && (incomeOk ?? true) && conditionOk;

  return NextResponse.json({
    eligible,
    fpl_percent: pct,
    income_threshold: 138,
    state_application_url: "https://abe.illinois.gov",
    program_name: "Emergency Medical Services for noncitizens",
    required_documents: [
      "Proof of Illinois residence (utility bill, lease, or letter)",
      "Photo ID or passport (any country)",
      "Proof of income (recent pay stubs or letter from employer)",
      "Documentation of medical emergency (ER discharge papers, prenatal record, dialysis order)",
    ],
    notes:
      "Illinois Emergency Medicaid covers labor and delivery, ER visits, and dialysis regardless of immigration status, for those who would otherwise qualify for Medicaid except for citizenship.",
  });
}
