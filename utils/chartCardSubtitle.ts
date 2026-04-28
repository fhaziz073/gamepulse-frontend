import { StatBasis } from "./statBasis";

export function buildChartCardSubtitle(
  statDisplayName: string,
  basis: StatBasis,
  rangeLabel: string,
): string {
  const name = statDisplayName.trim();
  const lower = name.toLowerCase();
  const impliesPer100 =
    lower.includes("per 100") ||
    lower.includes("/100") ||
    /\/\s*100\b/i.test(name);

  let core: string;
  if (basis === "raw") {
    core = `${name} per game`;
  } else if (impliesPer100) {
    core = name;
  } else {
    core = `${name} per 100 Possessions`;
  }
  return `${core} · ${rangeLabel}`;
}
