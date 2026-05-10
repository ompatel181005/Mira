// 2026 federal poverty guidelines (48 contiguous states + DC). Hard-coded for hackathon.
// Source pattern: HHS publishes annually; values here are projected/illustrative.

const FPL_2026: Record<number, number> = {
  1: 15600,
  2: 21100,
  3: 26600,
  4: 32100,
  5: 37600,
  6: 43100,
  7: 48600,
  8: 54100,
};

export function fpl(householdSize: number): number {
  const n = Math.max(1, Math.min(householdSize, 8));
  if (householdSize > 8) {
    return FPL_2026[8] + (householdSize - 8) * 5500;
  }
  return FPL_2026[n];
}

export function pctOfFPL(annualIncome: number, householdSize: number): number {
  const base = fpl(householdSize);
  if (base <= 0) return 0;
  return Math.round((annualIncome / base) * 100);
}
