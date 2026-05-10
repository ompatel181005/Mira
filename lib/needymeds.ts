import data from "@/data/needymeds-paps.json";

export type PAP = {
  generic: string;
  brand: string | null;
  manufacturer: string;
  program_name: string;
  enrollment_url: string;
  notes: string;
};

export function findPAPs(generic: string): PAP[] {
  if (!generic) return [];
  const lower = generic.toLowerCase();
  return (data as PAP[]).filter(
    (p) => p.generic.toLowerCase() === lower || (p.brand || "").toLowerCase() === lower
  );
}
