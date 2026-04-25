import { Platform, StyleSheet, type TextStyle } from "react-native";

export const scout = {
  playerA: "#3B82F6",
  playerB: "#F43F5E",
  reference: "#94A3B8",
} as const;

export const scoutAreaA = {
  areaChart: true as const,
  startFillColor: scout.playerA,
  endFillColor: scout.playerA,
  startOpacity: 0.2,
  endOpacity: 0,
};

export const scoutAreaB = {
  areaChart: true as const,
  startFillColor: scout.playerB,
  endFillColor: scout.playerB,
  startOpacity: 0.2,
  endOpacity: 0,
};

export const scoutAreaSingle = {
  areaChart: true as const,
  startFillColor: scout.playerA,
  endFillColor: scout.playerA,
  startOpacity: 0.2,
  endOpacity: 0,
};

export const font = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }) as string,
};

export type ColorSchemeName = "light" | "dark";

export interface SemanticColors {
  scheme: ColorSchemeName;
  screenBg: string;
  surface: string;
  card: string;
  sheet: string;
  text: string;
  label: string;
  muted: string;
  border: string;
  borderStrong: string;
  rules: string;
  axis: string;
  pillBg: string;
  pillText: string;
  pillActiveBg: string;
  pillActiveText: string;
  entityFocusBg: string;
  entityFocusBorder: string;
  statActiveBg: string;
  statActiveBorder: string;
  statActiveText: string;
  inputBg: string;
  inputBorder: string;
  btnPrimaryBg: string;
  btnPrimaryText: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
  insightBg: string;
  insightBorder: string;
  presetBg: string;
  presetBorder: string;
  presetText: string;
  opponentPillBg: string;
  opponentPillBorder: string;
  opponentPillText: string;
  modalBtnBg: string;
  filterIconBorder: string;
  handle: string;
}

const light: SemanticColors = {
  scheme: "light",
  screenBg: "#f1f5f9",
  surface: "#ffffff",
  card: "#ffffff",
  sheet: "#ffffff",
  text: "#0f172a",
  label: "#475569",
  muted: "#64748b",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  rules: "#e2e8f0",
  axis: "#e2e8f0",
  pillBg: "#e2e8f0",
  pillText: "#334155",
  pillActiveBg: "#0f172a",
  pillActiveText: "#ffffff",
  entityFocusBg: "#eff6ff",
  entityFocusBorder: scout.playerA,
  statActiveBg: "#eff6ff",
  statActiveBorder: scout.playerA,
  statActiveText: scout.playerA,
  inputBg: "#ffffff",
  inputBorder: "#cbd5e1",
  btnPrimaryBg: scout.playerA,
  btnPrimaryText: "#ffffff",
  errorBg: "#fef2f2",
  errorBorder: "#fecaca",
  errorText: "#b91c1c",
  insightBg: "#f8fafc",
  insightBorder: "#e2e8f0",
  presetBg: "#eff6ff",
  presetBorder: "#bfdbfe",
  presetText: "#1d4ed8",
  opponentPillBg: "#eff6ff",
  opponentPillBorder: "#bfdbfe",
  opponentPillText: "#1e3a8a",
  modalBtnBg: "#f1f5f9",
  filterIconBorder: "#e2e8f0",
  handle: "#cbd5e1",
};

const dark: SemanticColors = {
  scheme: "dark",
  screenBg: "#0f172a",
  surface: "#1e293b",
  card: "#1e293b",
  sheet: "#1e293b",
  text: "#f8fafc",
  label: "#cbd5e1",
  muted: "#e2e8f0",
  border: "#334155",
  borderStrong: "#475569",
  rules: "#334155",
  axis: "#475569",
  pillBg: "#334155",
  pillText: "#e2e8f0",
  pillActiveBg: "#f8fafc",
  pillActiveText: "#0f172a",
  entityFocusBg: "#1e3a5f",
  entityFocusBorder: scout.playerA,
  statActiveBg: "#1e3a5f",
  statActiveBorder: scout.playerA,
  statActiveText: "#93c5fd",
  inputBg: "#0f172a",
  inputBorder: "#475569",
  btnPrimaryBg: scout.playerA,
  btnPrimaryText: "#ffffff",
  errorBg: "#450a0a",
  errorBorder: "#7f1d1d",
  errorText: "#fecaca",
  insightBg: "#0f172a",
  insightBorder: "#334155",
  presetBg: "#1e3a5f",
  presetBorder: "#3b82f6",
  presetText: "#bfdbfe",
  opponentPillBg: "#1e3a5f",
  opponentPillBorder: scout.playerA,
  opponentPillText: "#dbeafe",
  modalBtnBg: "#334155",
  filterIconBorder: "#475569",
  handle: "#64748b",
};

export function getSemantic(
  scheme: ColorSchemeName | null | undefined,
): SemanticColors {
  return scheme === "dark" ? dark : light;
}

export const playerNameText: TextStyle = {
  fontFamily: font.bold,
  fontWeight: "700",
  fontSize: 24,
  lineHeight: 30,
};

export const insightCompact = StyleSheet.create({
  panel: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  header: {
    marginBottom: 7,
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dismiss: {
    fontFamily: font.semibold,
    fontSize: 11,
    fontWeight: "700",
  },
  date: {
    fontFamily: font.semibold,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 7,
  },
  entity: {
    fontFamily: font.semibold,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 3,
  },
  sectionLabel: {
    fontFamily: font.semibold,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
    marginBottom: 3,
  },
  body: {
    fontFamily: font.medium,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
  },
  statLabel: {
    fontFamily: font.mono,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
    marginBottom: 1,
  },
  statValue: {
    fontFamily: font.mono,
    fontSize: 14,
    fontWeight: "700",
  },
  compareRow: {
    gap: 7,
    marginBottom: 8,
  },
  swatch: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 4,
  },
  vs: {
    fontFamily: font.regular,
    fontSize: 10,
    marginTop: 2,
    lineHeight: 13,
  },
  statCol: {
    minWidth: 40,
  },
});
