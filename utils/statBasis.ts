export type StatBasis = "raw" | "adjusted";

export type ChartPointWithMeta = {
  label: string;
  value: number | null;
  isoDate?: string;
  opponentName?: string;
  gameScoreLine?: string;
  gamePossessions?: number;
  trueShootingPct?: number;
  chartAbsence?: "dnp" | "inactive";
};

export function applyStatBasisToPoints<T extends ChartPointWithMeta>(
  points: T[],
  basis: StatBasis,
): T[] {
  if (basis !== "adjusted") return points;
  return points.map((p) => {
    if (p.value === null || typeof p.value !== "number") {
      return p;
    }
    const poss = p.gamePossessions;
    if (typeof poss !== "number" || !Number.isFinite(poss) || poss <= 0) {
      return p;
    }
    const next = (p.value / poss) * 100;
    if (!Number.isFinite(next)) return p;
    return { ...p, value: next };
  });
}

export function applyStatBasisToSeriesList<T extends ChartPointWithMeta>(
  seriesList: { seriesName: string; points: T[] }[] | undefined,
  basis: StatBasis,
): { seriesName: string; points: T[] }[] | undefined {
  if (!seriesList) return undefined;
  return seriesList.map((s) => ({
    ...s,
    points: applyStatBasisToPoints(s.points, basis),
  }));
}
