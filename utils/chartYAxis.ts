/** Stat keys as used in the app (e.g. activeStat) or uppercase labels (PTS, AST, …). */
export type StatAxisKey = string;

function tickIntervalForStatType(statType: StatAxisKey): number {
  const key = statType.trim().toUpperCase();
  if (key === "PTS") return 5;
  if (key === "AST" || key === "REB" || key === "STL") return 2;
  return 5;
}

export type AxisConfiguration = {
  /** Tick values from 0 through domain.max, inclusive, spaced by `stepValue`. */
  tickValues: number[];
  domain: { min: number; max: number };
  /** Upper bound of the Y scale (gifted-charts `maxValue`). */
  maxValue: number;
  /** Distance between ticks (gifted-charts `stepValue`). */
  stepValue: number;
};

/**
 * Y-axis scale for line charts: interval depends on stat (PTS → 5; AST/REB/STL → 2).
 * Domain max is the smallest multiple of that interval that covers data and optional reference cap.
 */
export function getAxisConfiguration(
  statType: StatAxisKey,
  dataMax: number,
  options?: { referenceCap?: number },
): AxisConfiguration {
  const interval = tickIntervalForStatType(statType);
  const data = Number.isFinite(dataMax) ? dataMax : 0;
  const ref =
    options?.referenceCap != null &&
    Number.isFinite(options.referenceCap) &&
    options.referenceCap > 0
      ? options.referenceCap
      : 0;
  const cap = Math.max(data, ref);
  const domainMax = Math.max(interval, Math.ceil(cap / interval) * interval);
  const tickValues: number[] = [];
  for (let v = 0; v <= domainMax; v += interval) {
    tickValues.push(v);
  }
  return {
    tickValues,
    domain: { min: 0, max: domainMax },
    maxValue: domainMax,
    stepValue: interval,
  };
}
