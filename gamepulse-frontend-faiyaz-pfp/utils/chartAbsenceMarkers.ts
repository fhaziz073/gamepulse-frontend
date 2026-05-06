import type { lineDataItem } from "gifted-charts-core";
import { createElement } from "react";
import { Text, View } from "react-native";

export type ChartAbsence = "dnp" | "inactive";

export type AbsenceAxisColors = {
  dateColor: string;
  badgeColor: string;
};

const DNP_LINE = {
  showVerticalLine: true as const,
  verticalLineHeight: 28,
  verticalLineColor: "#94a3b8",
  verticalLineThickness: 2,
};

export function absenceMarkerForLineItem(
  absence: ChartAbsence | undefined,
  dateLabel: string,
  axis?: AbsenceAxisColors,
): Partial<lineDataItem> {
  if (!absence) return {};
  const badge = absence === "inactive" ? "OUT" : "DNP";
  if (!axis) {
    return { ...DNP_LINE };
  }
  return {
    ...DNP_LINE,
    labelComponent: () =>
      createElement(
        View,
        {
          style: {
            width: "100%",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingLeft: 6,
            paddingRight: 2,
          },
        },
        createElement(
          Text,
          {
            style: { fontSize: 10, color: axis.dateColor, textAlign: "right" },
            numberOfLines: 1,
          },
          dateLabel,
        ),
        createElement(
          Text,
          {
            style: {
              fontSize: 8,
              fontWeight: "700",
              color: axis.badgeColor,
              marginTop: 2,
              textAlign: "right",
            },
            numberOfLines: 1,
          },
          badge,
        ),
      ),
  };
}
