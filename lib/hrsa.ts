import data from "@/data/hrsa-fqhcs-illinois.json";
import { haversineMiles } from "./distance";

export type Facility = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  services: string[];
  languages: string[];
  sliding_scale: boolean;
  accepts_uninsured: boolean;
  source: "FQHC" | "Nonprofit Hospital" | "Free Clinic";
  charity_care_policy_url?: string | null;
};

export function loadFQHCs(): Facility[] {
  return (data as Facility[]).map((f) => ({ ...f, source: "FQHC" }));
}

export function nearby(
  facilities: Facility[],
  lat: number,
  lng: number,
  maxMiles = 25
): (Facility & { distance_miles: number })[] {
  return facilities
    .map((f) => ({ ...f, distance_miles: haversineMiles(lat, lng, f.lat, f.lng) }))
    .filter((f) => f.distance_miles <= maxMiles)
    .sort((a, b) => a.distance_miles - b.distance_miles);
}
