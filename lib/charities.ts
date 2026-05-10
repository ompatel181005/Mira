import data from "@/data/cook-county-charities.json";

export type Charity = {
  name: string;
  type: string;
  address: string;
  phone: string;
  url: string;
  languages: string[];
  serves: string[];
  eligibility: string;
  country_focus: string | null;
  applies_to_conditions: string[];
  lat?: number;
  lng?: number;
};

export function loadCharities(): Charity[] {
  return data as Charity[];
}
