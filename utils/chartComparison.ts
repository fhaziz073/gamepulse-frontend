import type { lineDataItem } from "gifted-charts-core";
import {
    absenceMarkerForLineItem,
    type AbsenceAxisColors,
} from "./chartAbsenceMarkers";

export type ChartPointInput = {
  label: string;
  value?: number | null;
  isoDate?: string;
  opponentName?: string;
  gameScoreLine?: string;
  gamePossessions?: number;
  trueShootingPct?: number;
  chartAbsence?: "dnp" | "inactive";
};

export type CompareRow = {
  label: string;
  isoDate: string;
  valueA?: number;
  valueB?: number;
  opponentA?: string;
  opponentB?: string;
  scoreLineA?: string;
  scoreLineB?: string;
  tsPctA?: number;
  tsPctB?: number;
};

export type AlignedComparison = {
  data: lineDataItem[];
  data2: lineDataItem[];
  rows: CompareRow[];
  alignment: "calendar_union";
  sharedDateCount: number;
};

const shortDate = (iso: string): string => {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
};

const sortChronologically = (points: ChartPointInput[]): ChartPointInput[] => {
  if (points.length === 0) return [];
  if (points.every((p) => p.isoDate)) {
    return [...points].sort((x, y) =>
      String(x.isoDate).localeCompare(String(y.isoDate)),
    );
  }
  return [...points];
};

function lineItemForUnion(
  label: string,
  point: ChartPointInput | undefined,
  absenceAxis?: AbsenceAxisColors,
): lineDataItem {
  const hasY =
    point &&
    point.value !== null &&
    point.value !== undefined &&
    typeof point.value === "number" &&
    Number.isFinite(point.value);
  if (!hasY) {
    const extra = point?.chartAbsence
      ? absenceMarkerForLineItem(point.chartAbsence, label, absenceAxis)
      : {};
    return {
      label,
      value: undefined as unknown as number,
      hideDataPoint: true,
      ...extra,
    } as lineDataItem;
  }
  return {
    label,
    value: point.value as number,
    hideDataPoint: false,
  };
}

export function alignTwoSeriesForComparison(
  a: ChartPointInput[],
  b: ChartPointInput[],
  metaA: ChartPointInput[] = a,
  metaB: ChartPointInput[] = b,
  absenceAxis?: AbsenceAxisColors,
): AlignedComparison {
  const sa = sortChronologically(a);
  const sb = sortChronologically(b);
  const mapA = new Map<string, ChartPointInput>();
  for (const p of sa) {
    if (p.isoDate) mapA.set(p.isoDate, p);
  }
  const mapB = new Map<string, ChartPointInput>();
  for (const p of sb) {
    if (p.isoDate) mapB.set(p.isoDate, p);
  }

  const metaMapA = new Map<string, ChartPointInput>();
  for (const p of sortChronologically(metaA)) {
    if (p.isoDate) metaMapA.set(p.isoDate, p);
  }
  const metaMapB = new Map<string, ChartPointInput>();
  for (const p of sortChronologically(metaB)) {
    if (p.isoDate) metaMapB.set(p.isoDate, p);
  }

  const dates = [...new Set([...mapA.keys(), ...mapB.keys()])].sort((x, y) =>
    x.localeCompare(y),
  );

  const rows: CompareRow[] = [];
  const data: lineDataItem[] = [];
  const data2: lineDataItem[] = [];

  for (const iso of dates) {
    const pa = mapA.get(iso);
    const pb = mapB.get(iso);
    const ma = metaMapA.get(iso);
    const mb = metaMapB.get(iso);
    const lab = shortDate(iso);
    rows.push({
      label: lab,
      isoDate: iso,
      valueA:
        pa &&
        pa.value !== null &&
        typeof pa.value === "number" &&
        Number.isFinite(pa.value)
          ? pa.value
          : undefined,
      valueB:
        pb &&
        pb.value !== null &&
        typeof pb.value === "number" &&
        Number.isFinite(pb.value)
          ? pb.value
          : undefined,
      opponentA: pa?.opponentName,
      opponentB: pb?.opponentName,
      scoreLineA: pa?.gameScoreLine,
      scoreLineB: pb?.gameScoreLine,
      tsPctA: ma?.trueShootingPct,
      tsPctB: mb?.trueShootingPct,
    });
    data.push(lineItemForUnion(lab, pa, absenceAxis));
    data2.push(lineItemForUnion(lab, pb, absenceAxis));
  }

  return {
    data,
    data2,
    rows,
    alignment: "calendar_union",
    sharedDateCount: dates.length,
  };
}
