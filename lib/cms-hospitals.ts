import data from "@/data/cook-county-hospitals.json";
import type { Facility } from "./hrsa";

export type Hospital = Facility & {
  ownership: "Voluntary non-profit" | "Government" | "Proprietary";
  charity_care_policy_url: string;
  charity_care_application_url?: string;
  income_threshold_full?: number;
  income_threshold_partial?: number;
  required_documents?: string[];
  has_er?: boolean;
};

export function loadHospitals(): Hospital[] {
  return (data as Hospital[]).map((h) => ({ ...h, source: "Nonprofit Hospital" }));
}
