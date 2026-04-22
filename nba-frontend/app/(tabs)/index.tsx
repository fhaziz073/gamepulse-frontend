import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  useColorScheme,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import axios, { isAxiosError } from 'axios';
import { Calendar, DateData } from 'react-native-calendars';
import Constants from 'expo-constants';
import type { DataSet, lineDataItem } from 'gifted-charts-core';
import { absenceMarkerForLineItem } from '../../utils/chartAbsenceMarkers';
import { alignTwoSeriesForComparison } from '../../utils/chartComparison';
import { buildChartCardSubtitle } from '../../utils/chartCardSubtitle';
import { getAxisConfiguration } from '../../utils/chartYAxis';
import {
  applyStatBasisToSeriesList,
  type StatBasis,
} from '../../utils/statBasis';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import {
  font,
  getSemantic,
  insightCompact,
  playerNameText,
  scout,
  scoutAreaA,
  scoutAreaB,
  scoutAreaSingle,
  type SemanticColors,
} from '../../theme';

const SheetTextInput = Platform.OS === 'web' ? TextInput : BottomSheetTextInput;

const resolveApiBaseUrl = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://10.0.2.2:3000';
  }
  if (Platform.OS === 'ios' && !Constants.isDevice) {
    return 'http://127.0.0.1:3000';
  }
  return 'http://localhost:3000';
};

type Mode = 'player' | 'team';

type EntitySearchResult = {
  id: number;
  name: string;
  sub?: string;
};

type ChartPoint = {
  label: string;
  value: number | null;
  isoDate?: string;
  opponentName?: string;
  gameScoreLine?: string;
  gamePossessions?: number;
  trueShootingPct?: number;
  chartAbsence?: 'dnp' | 'inactive';
};

type VisualizationResponse = {
  seriesList: { seriesName: string; points: ChartPoint[] }[];
  threshold?: number;
};

type AppliedFilters = {
  startDate?: string;
  endDate?: string;
  upperBound?: number;
};

const toIsoDateLocal = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getPastMonthsRange = (months: number) => {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);
  return { startDate: toIsoDateLocal(start), endDate: toIsoDateLocal(end) };
};

const getCurrentSeasonRange = () => {
  const now = new Date();
  const seasonStartYear = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  return { startDate: `${seasonStartYear}-10-01`, endDate: toIsoDateLocal(now) };
};

const currentNbaSeasonYear = (): number => {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
};

const PLAYER_STATS = [
  { label: 'PTS', value: 'pts' },
  { label: 'AST', value: 'ast' },
  { label: 'REB', value: 'reb' },
  { label: 'STL', value: 'stl' },
];

const TEAM_STATS = [
  { label: 'PTS', value: 'pts' },
  { label: 'AST', value: 'ast' },
  { label: 'REB', value: 'reb' },
];

const PLAYER_DEFAULTS = {
  primary: { id: 237, name: 'LeBron James' } satisfies EntitySearchResult,
  secondary: { id: 115, name: 'Stephen Curry' } satisfies EntitySearchResult,
};

const TEAM_DEFAULTS = {
  primary: { id: 14, name: 'Los Angeles Lakers' } satisfies EntitySearchResult,
  secondary: { id: 10, name: 'Golden State Warriors' } satisfies EntitySearchResult,
};

const MIN_TOUCH = 44;
const SCREEN_PADDING = 16;

function tsEfficiencyBadgeStyle(ts: number): { bg: string; fg: string } {
  if (ts > 60) return { bg: '#bbf7d0', fg: '#14532d' };
  if (ts >= 50) return { bg: '#fef9c3', fg: '#854d0e' };
  return { bg: '#fecaca', fg: '#991b1b' };
}

function lineChartY(value: number | null | undefined): number | undefined {
  if (value === null || value === undefined || !Number.isFinite(value)) return undefined;
  return value;
}

export default function App() {
  const colorScheme = useColorScheme() ?? 'light';
  const sem = useMemo(() => getSemantic(colorScheme), [colorScheme]);
  const styles = useMemo(() => createStyles(sem), [sem]);

  const CHART_SPACING = 46;
  const CHART_INITIAL_SPACING = SCREEN_PADDING;
  const Y_AXIS_LABEL_WIDTH = 36;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const defaultRange = useMemo(() => getPastMonthsRange(1), []);
  const [lastResponse, setLastResponse] = useState<VisualizationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EntitySearchResult[]>([]);
  const [mode, setMode] = useState<Mode>('player');
  const [primaryEntity, setPrimaryEntity] = useState<EntitySearchResult>(PLAYER_DEFAULTS.primary);
  const [secondaryEntity, setSecondaryEntity] = useState<EntitySearchResult>(PLAYER_DEFAULTS.secondary);
  const [searchTarget, setSearchTarget] = useState<'primary' | 'secondary'>('primary');
  const [compareOn, setCompareOn] = useState(false);
  const [activeStat, setActiveStat] = useState('pts');
  const [searchError, setSearchError] = useState('');
  const [dataError, setDataError] = useState('');
  const [startDateInput, setStartDateInput] = useState(defaultRange.startDate);
  const [endDateInput, setEndDateInput] = useState(defaultRange.endDate);
  const [upperBoundInput, setUpperBoundInput] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultRange);
  const [calendarTarget, setCalendarTarget] = useState<'start' | 'end' | null>(null);
  const [showReferenceLine, setShowReferenceLine] = useState(false);
  const [statBasis, setStatBasis] = useState<StatBasis>('raw');
  const [singleSelectedIndex, setSingleSelectedIndex] = useState<number | null>(null);
  const [compareSelectedIndex, setCompareSelectedIndex] = useState<number | null>(null);
  const [opponentQuery, setOpponentQuery] = useState('');
  const [opponentResults, setOpponentResults] = useState<EntitySearchResult[]>([]);
  const [opponentSearchError, setOpponentSearchError] = useState('');
  const [opponentFilterTeam, setOpponentFilterTeam] = useState<EntitySearchResult | null>(null);
  const latestChartRequestId = useRef(0);
  const mainScrollRef = useRef<ScrollView>(null);
  const bottomSheetRef = useRef<React.ElementRef<typeof BottomSheet>>(null);
  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);
  const availableStats = useMemo(() => (mode === 'team' ? TEAM_STATS : PLAYER_STATS), [mode]);

  const seasonForApi = useMemo(
    () => ((!appliedFilters.startDate && !appliedFilters.endDate) ? currentNbaSeasonYear() : undefined),
    [appliedFilters.endDate, appliedFilters.startDate],
  );

  const isValidDateString = useCallback((value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime());
  }, []);

  const runOpponentTeamSearch = useCallback(async () => {
    const trimmed = opponentQuery.trim();
    if (!trimmed) {
      setOpponentSearchError('');
      return;
    }
    try {
      setOpponentSearchError('');
      const res = await axios.get<EntitySearchResult[]>(`${apiBaseUrl}/visualization/search`, {
        params: { q: trimmed, type: 'team' },
      });
      setOpponentResults(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? 'Team search failed'
        : 'Team search failed';
      setOpponentSearchError(message);
      console.error('Opponent team search error:', error);
    }
  }, [apiBaseUrl, opponentQuery]);

  const runSearch = useCallback(async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSearchError('');
      return;
    }

    try {
      setSearchError('');
      const res = await axios.get<EntitySearchResult[]>(
        `${apiBaseUrl}/visualization/search`,
        { params: { q: trimmedQuery, type: mode } },
      );
      setSearchResults(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? 'Search failed'
        : 'Search failed';
      setSearchError(message);
      console.error('Search error:', error);
    }
  }, [apiBaseUrl, mode, query]);

  const loadChart = useCallback(async () => {
    const stat = activeStat;
    const ids = compareOn ? [primaryEntity.id, secondaryEntity.id] : [primaryEntity.id];

    if (compareOn && primaryEntity.id === secondaryEntity.id) {
      setDataError('Choose two different players or teams to compare.');
      setLastResponse(null);
      return;
    }

    const requestId = ++latestChartRequestId.current;
    setLoading(true);
    try {
      setDataError('');
      const res = await axios.post<VisualizationResponse>(`${apiBaseUrl}/visualization`, {
        entityIds: ids,
        statKey: stat,
        filterParams: {
          dataSource: 'API',
          season: seasonForApi,
          isTeam: mode === 'team',
          ...(appliedFilters.startDate ? { startDate: appliedFilters.startDate } : {}),
          ...(appliedFilters.endDate ? { endDate: appliedFilters.endDate } : {}),
          ...(!compareOn && opponentFilterTeam
            ? { opponentTeamId: opponentFilterTeam.id }
            : {}),
        },
      });

      if (requestId !== latestChartRequestId.current) return;

      const list = res.data.seriesList ?? [];
      if (!list.length || !Array.isArray(list[0]?.points)) {
        setLastResponse(null);
        setDataError('No data found for the selected filters.');
        return;
      }

      if (compareOn && list.length < 2) {
        setLastResponse(null);
        setDataError('Could not load both series for comparison.');
        return;
      }

      setLastResponse(res.data);
      const firstPts = list[0].points;
      if (!firstPts.length) {
        setDataError('No games found in that date range for this selection.');
      } else if (compareOn) {
        const secondPts = list[1]?.points ?? [];
        if (!secondPts.length) {
          setDataError('No games in range for the second selection.');
        } else {
          setDataError('');
        }
      } else if (list.length === 2) {
        const secondPts = list[1]?.points ?? [];
        if (!secondPts.length) {
          setDataError('No head-to-head games in range for this opponent.');
        } else {
          setDataError('');
        }
      } else {
        setDataError('');
      }
    } catch (error) {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? 'Failed to load chart data'
        : 'Failed to load chart data';
      if (requestId !== latestChartRequestId.current) return;
      setDataError(message);
      setLastResponse(null);
      console.error('Load chart error:', error);
    } finally {
      if (requestId !== latestChartRequestId.current) return;
      setLoading(false);
    }
  }, [
    apiBaseUrl,
    mode,
    appliedFilters.endDate,
    appliedFilters.startDate,
    activeStat,
    compareOn,
    primaryEntity.id,
    secondaryEntity.id,
    seasonForApi,
    opponentFilterTeam,
  ]);

  useEffect(() => {
    setSearchResults([]);
    setQuery('');
    setSearchError('');
    setDataError('');
    setOpponentQuery('');
    setOpponentResults([]);
    setOpponentSearchError('');
    setOpponentFilterTeam(null);
    const defs = mode === 'player' ? PLAYER_DEFAULTS : TEAM_DEFAULTS;
    setPrimaryEntity(defs.primary);
    setSecondaryEntity(defs.secondary);
    setActiveStat('pts');
    setCompareOn(false);
    setSearchTarget('primary');
  }, [mode]);

  const selectAndApplyEntity = useCallback(
    (entity: EntitySearchResult) => {
      if (searchTarget === 'primary') {
        setPrimaryEntity(entity);
      } else {
        setSecondaryEntity(entity);
      }
      setQuery(entity.name);
      setSearchResults([]);
      setSearchError('');
      bottomSheetRef.current?.snapToIndex(0);
    },
    [searchTarget],
  );

  const onChangeMode = (nextMode: Mode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setActiveStat('pts');
    setSearchError('');
    setDataError('');
  };

  useEffect(() => {
    void loadChart();
  }, [loadChart]);

  useEffect(() => {
    setSingleSelectedIndex(null);
    setCompareSelectedIndex(null);
  }, [lastResponse, compareOn, activeStat, primaryEntity.id, secondaryEntity.id]);

  useEffect(() => {
    setStatBasis('raw');
  }, [mode, compareOn, activeStat, primaryEntity.id, secondaryEntity.id]);

  const chartResponse = useMemo((): VisualizationResponse | null => {
    if (!lastResponse?.seriesList) return lastResponse;
    return {
      ...lastResponse,
      seriesList: applyStatBasisToSeriesList(lastResponse.seriesList, statBasis)!,
    };
  }, [lastResponse, statBasis]);

  useEffect(() => {
    setOpponentFilterTeam(null);
    setOpponentResults([]);
    setOpponentQuery('');
    setOpponentSearchError('');
  }, [primaryEntity.id]);

  useEffect(() => {
    if (!compareOn) return;
    setOpponentFilterTeam(null);
    setOpponentResults([]);
    setOpponentQuery('');
    setOpponentSearchError('');
  }, [compareOn]);

  useEffect(() => {
    if (singleSelectedIndex === null && compareSelectedIndex === null) return;
    const id = setTimeout(() => {
      mainScrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
    return () => clearTimeout(id);
  }, [singleSelectedIndex, compareSelectedIndex]);

  const applyFilters = () => {
    const nextFilters: AppliedFilters = {};

    const normalizedStart = startDateInput.trim();
    const normalizedEnd = endDateInput.trim();
    const normalizedUpper = upperBoundInput.trim();

    if (normalizedStart) {
      if (!isValidDateString(normalizedStart)) {
        setDataError('Start date must be YYYY-MM-DD');
        return;
      }
      nextFilters.startDate = normalizedStart;
    }

    if (normalizedEnd) {
      if (!isValidDateString(normalizedEnd)) {
        setDataError('End date must be YYYY-MM-DD');
        return;
      }
      nextFilters.endDate = normalizedEnd;
    }

    if (nextFilters.startDate && nextFilters.endDate && nextFilters.startDate > nextFilters.endDate) {
      setDataError('Start date must be before or equal to end date');
      return;
    }

    if (normalizedUpper) {
      const parsedUpper = Number(normalizedUpper);
      if (Number.isNaN(parsedUpper) || parsedUpper <= 0) {
        setDataError('Upper bound must be a positive number');
        return;
      }
      nextFilters.upperBound = parsedUpper;
    }

    setDataError('');
    setAppliedFilters(nextFilters);
  };

  const singleSeriesPoints = useMemo(() => {
    if (compareOn) return [];
    return chartResponse?.seriesList?.[0]?.points ?? [];
  }, [chartResponse, compareOn]);

  const teamH2hDual = useMemo(
    () =>
      Boolean(
        !compareOn &&
          mode === 'team' &&
          opponentFilterTeam &&
          chartResponse?.seriesList?.length === 2 &&
          (chartResponse.seriesList[0].points?.length ?? 0) > 0,
      ),
    [compareOn, mode, opponentFilterTeam, chartResponse],
  );

  const absenceAxisColors = useMemo(
    () => ({ dateColor: sem.label, badgeColor: sem.muted }),
    [sem.label, sem.muted],
  );

  const singleChartHasAbsence = useMemo(
    () => singleSeriesPoints.some((p) => Boolean(p.chartAbsence)),
    [singleSeriesPoints],
  );

  const compareChartHasAbsence = useMemo(() => {
    if (!compareOn || !lastResponse?.seriesList || lastResponse.seriesList.length < 2) return false;
    const pts = [...lastResponse.seriesList[0].points, ...lastResponse.seriesList[1].points];
    return pts.some((p) => Boolean(p.chartAbsence));
  }, [compareOn, lastResponse]);

  const singleChartData = useMemo(
    () =>
      singleSeriesPoints.map((point, index) => {
        const { value: rawY, ...rest } = point;
        const dateLabel = point.label;
        const absenceAxis = mode === 'player' ? absenceAxisColors : undefined;
        return {
          ...rest,
          value: lineChartY(rawY),
          ...absenceMarkerForLineItem(point.chartAbsence, dateLabel, absenceAxis),
          dataPointColor: scout.playerA,
          focusedDataPointColor: scout.playerA,
          onPress: () => {
            setSingleSelectedIndex((prev) => (prev === index ? null : index));
          },
        };
      }),
    [singleSeriesPoints, mode, absenceAxisColors],
  );

  const comparisonAligned = useMemo(() => {
    if (!compareOn || !lastResponse?.seriesList || lastResponse.seriesList.length < 2) return null;
    const rawA = lastResponse.seriesList[0].points;
    const rawB = lastResponse.seriesList[1].points;
    const scaledA = chartResponse?.seriesList?.[0]?.points ?? rawA;
    const scaledB = chartResponse?.seriesList?.[1]?.points ?? rawB;
    return alignTwoSeriesForComparison(scaledA, scaledB, rawA, rawB, {
      dateColor: sem.label,
      badgeColor: sem.muted,
    });
  }, [lastResponse, chartResponse, compareOn, sem.label, sem.muted]);

  const compareDataSet = useMemo((): DataSet[] | null => {
    if (!comparisonAligned) return null;
    const withPress = (rows: lineDataItem[], focusedColor: string): lineDataItem[] =>
      rows.map((item, index) => ({
        ...item,
        onPress: () => {
          setCompareSelectedIndex((prev) => (prev === index ? null : index));
        },
        focusedDataPointColor: focusedColor,
        focusedDataPointRadius: 10,
      }));
    return [
      {
        data: withPress(comparisonAligned.data, scout.playerA),
        color: scout.playerA,
        thickness: 3,
        curved: true,
        dataPointsRadius: 7,
        dataPointsColor: scout.playerA,
        ...scoutAreaA,
      },
      {
        data: withPress(comparisonAligned.data2, scout.playerB),
        color: scout.playerB,
        thickness: 3,
        curved: true,
        dataPointsRadius: 7,
        dataPointsColor: scout.playerB,
        ...scoutAreaB,
      },
    ];
  }, [comparisonAligned]);

  const teamH2hDataSet = useMemo((): DataSet[] | null => {
    if (!teamH2hDual || !chartResponse?.seriesList || chartResponse.seriesList.length < 2) return null;
    const ptsA = chartResponse.seriesList[0].points;
    const ptsB = chartResponse.seriesList[1].points;
    const n = Math.min(ptsA.length, ptsB.length);
    const withPress = (rows: lineDataItem[], color: string): lineDataItem[] =>
      rows.map((item, index) => ({
        ...item,
        onPress: () => {
          setSingleSelectedIndex((prev) => (prev === index ? null : index));
        },
        focusedDataPointColor: color,
        focusedDataPointRadius: 10,
      }));
    const data = withPress(
      ptsA.slice(0, n).map((pt, i) => {
        const lab = pt.label || `G${i + 1}`;
        return {
          value: lineChartY(pt.value),
          label: lab,
          ...absenceMarkerForLineItem(pt.chartAbsence, lab, absenceAxisColors),
        };
      }),
      scout.playerA,
    );
    const data2 = withPress(
      ptsB.slice(0, n).map((pt, i) => {
        const lab = pt.label || `G${i + 1}`;
        return {
          value: lineChartY(pt.value),
          label: lab,
          ...absenceMarkerForLineItem(pt.chartAbsence, lab, absenceAxisColors),
        };
      }),
      scout.playerB,
    );
    return [
      {
        data,
        color: scout.playerA,
        thickness: 3,
        curved: true,
        dataPointsRadius: 7,
        dataPointsColor: scout.playerA,
        ...scoutAreaA,
      },
      {
        data: data2,
        color: scout.playerB,
        thickness: 3,
        curved: true,
        dataPointsRadius: 7,
        dataPointsColor: scout.playerB,
        ...scoutAreaB,
      },
    ];
  }, [teamH2hDual, chartResponse, absenceAxisColors]);

  const teamH2hHasAbsence = useMemo(() => {
    if (!teamH2hDual || !chartResponse?.seriesList || chartResponse.seriesList.length < 2) return false;
    return [...chartResponse.seriesList[0].points, ...chartResponse.seriesList[1].points].some((p) =>
      Boolean(p.chartAbsence),
    );
  }, [teamH2hDual, chartResponse]);

  const chartTitle = chartResponse?.seriesList?.[0]?.seriesName;
  const statDisplayName = useMemo(() => {
    const entry = availableStats.find((s) => s.value === activeStat);
    return entry?.label ?? activeStat.toUpperCase();
  }, [activeStat, availableStats]);

  const chartStatLabel = useMemo(() => {
    const base = statDisplayName;
    return statBasis === 'adjusted' ? `${base}/100` : base;
  }, [statDisplayName, statBasis]);

  const chartDataForAvg = useMemo(() => {
    if (compareOn) return [];
    if (teamH2hDual && chartResponse?.seriesList?.[1]) {
      return [...chartResponse.seriesList[0].points, ...chartResponse.seriesList[1].points];
    }
    return singleSeriesPoints;
  }, [compareOn, teamH2hDual, chartResponse, singleSeriesPoints]);

  const averageLineValue = useMemo(() => {
    if (compareOn && comparisonAligned) {
      const all = [...comparisonAligned.data, ...comparisonAligned.data2]
        .map((p) => p.value)
        .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
      if (!all.length) return 0;
      return all.reduce((acc, v) => acc + v, 0) / all.length;
    }
    if (!chartDataForAvg.length) return 0;
    const playable = chartDataForAvg.filter(
      (p) => typeof p.value === 'number' && Number.isFinite(p.value),
    );
    if (!playable.length) return 0;
    const vals = playable.map((p) => p.value as number);
    return vals.reduce((acc, v) => acc + v, 0) / vals.length;
  }, [chartDataForAvg, compareOn, comparisonAligned]);

  const referenceLineValue = useMemo(
    () => appliedFilters.upperBound ?? averageLineValue,
    [appliedFilters.upperBound, averageLineValue],
  );

  const rawDataMax = useMemo(() => {
    let values: number[] = [];
    if (compareOn && comparisonAligned) {
      values = [
        ...comparisonAligned.data.map((p) => p.value),
        ...comparisonAligned.data2.map((p) => p.value),
      ].filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
    } else if (teamH2hDual && chartResponse?.seriesList?.[1]) {
      values = [
        ...chartResponse.seriesList[0].points.map((p) => p.value),
        ...chartResponse.seriesList[1].points.map((p) => p.value),
      ].filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
    } else if (chartDataForAvg.length) {
      values = chartDataForAvg
        .map((point) => point.value)
        .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
    }
    if (!values.length) return 0;
    return Math.max(...values, 0);
  }, [chartDataForAvg, comparisonAligned, compareOn, chartResponse, teamH2hDual]);

  const chartYAxis = useMemo(
    () =>
      getAxisConfiguration(activeStat, rawDataMax, {
        referenceCap: showReferenceLine ? referenceLineValue : undefined,
      }),
    [activeStat, rawDataMax, showReferenceLine, referenceLineValue],
  );

  const giftedLineChartYAxisProps = useMemo(
    () => ({
      maxValue: chartYAxis.maxValue,
      stepValue: chartYAxis.stepValue,
      yAxisLabelWidth: Y_AXIS_LABEL_WIDTH,
      yAxisTextStyle: {
        fontSize: 10,
        fontFamily: font.mono,
        color: sem.label,
        textAlign: 'right' as const,
      },
      yAxisLabelContainerStyle: {
        alignItems: 'flex-end' as const,
        paddingRight: 0,
      },
      showYAxisIndices: true,
      yAxisIndicesWidth: 2,
      yAxisIndicesHeight: 2,
      yAxisIndicesColor: sem.axis,
    }),
    [chartYAxis.maxValue, chartYAxis.stepValue, sem.label, sem.axis],
  );

  const referenceLine1ChartConfig = useMemo(
    () => ({
      color: scout.reference,
      dashWidth: 4,
      dashGap: 4,
      ...(showReferenceLine
        ? {
            labelText:
              typeof appliedFilters.upperBound === 'number'
                ? `Ref: ${referenceLineValue.toFixed(1)}`
                : `Avg: ${referenceLineValue.toFixed(1)}`,
            labelTextStyle: {
              right: 4,
              top: -12,
              fontSize: 10,
              color: sem.muted,
              opacity: 0.72,
            },
          }
        : {}),
    }),
    [showReferenceLine, appliedFilters.upperBound, referenceLineValue, sem.muted],
  );

  const pointCount = compareOn
    ? (comparisonAligned?.data.length ?? 0)
    : teamH2hDual
      ? (chartResponse?.seriesList?.[0]?.points.length ?? 0)
      : singleSeriesPoints.length;

  const chartHeight = useMemo(() => {
    const sixtyPctBlock = windowHeight * 0.6 - insets.top;
    const chromeEstimate = compareOn ? 300 : 258;
    const raw = Math.floor(sixtyPctBlock - chromeEstimate);
    return Math.max(200, Math.min(460, raw));
  }, [windowHeight, insets.top, compareOn]);

  const chartWidth = useMemo(() => {
    const contentWidth = Math.min(560, windowWidth);
    return Math.max(
      contentWidth - SCREEN_PADDING * 4,
      Math.max(pointCount, 6) * CHART_SPACING + Y_AXIS_LABEL_WIDTH + 32,
    );
  }, [windowWidth, pointCount, CHART_SPACING]);

  const filterSnapPoints = useMemo(() => ['14%', '48%', '90%'], []);

  const renderSheetBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={0} appearsOnIndex={1} opacity={0.4} pressBehavior={0} />
    ),
    [],
  );

  const formatRangeDate = useCallback((isoDate: string) => {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const chartRangeLabel = useMemo(() => {
    if (appliedFilters.startDate || appliedFilters.endDate) {
      const startText = appliedFilters.startDate ? formatRangeDate(appliedFilters.startDate) : 'Earliest';
      const endText = appliedFilters.endDate ? formatRangeDate(appliedFilters.endDate) : 'Latest';
      return `${startText} – ${endText}`;
    }

    const datedPoints = singleSeriesPoints.filter((point) => point.isoDate);
    if (datedPoints.length > 1) {
      const first = datedPoints[0].isoDate as string;
      const last = datedPoints[datedPoints.length - 1].isoDate as string;
      return `${formatRangeDate(first)} – ${formatRangeDate(last)}`;
    }

    return 'Season to date (API default)';
  }, [appliedFilters.endDate, appliedFilters.startDate, singleSeriesPoints, formatRangeDate]);

  const chartCardSubtitle = useMemo(
    () => buildChartCardSubtitle(statDisplayName, statBasis, chartRangeLabel),
    [statDisplayName, statBasis, chartRangeLabel],
  );

  const onCalendarSelect = (day: DateData) => {
    if (calendarTarget === 'start') setStartDateInput(day.dateString);
    if (calendarTarget === 'end') setEndDateInput(day.dateString);
    setCalendarTarget(null);
  };

  const parseUpperBoundOrUndefined = () => {
    const normalized = upperBoundInput.trim();
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    return Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed;
  };

  const applyPresetRange = (preset: 'pastMonth' | 'past3Months' | 'thisSeason') => {
    const nextRange =
      preset === 'pastMonth'
        ? getPastMonthsRange(1)
        : preset === 'past3Months'
          ? getPastMonthsRange(3)
          : getCurrentSeasonRange();

    setStartDateInput(nextRange.startDate);
    setEndDateInput(nextRange.endDate);
    setDataError('');
    const parsedUpper = parseUpperBoundOrUndefined();
    setAppliedFilters({
      ...nextRange,
      ...(parsedUpper ? { upperBound: parsedUpper } : {}),
    });
  };

  const swapCompareEntities = () => {
    const a = primaryEntity;
    setPrimaryEntity(secondaryEntity);
    setSecondaryEntity(a);
  };

  const compareDetail =
    compareOn &&
    comparisonAligned &&
    compareSelectedIndex !== null &&
    comparisonAligned.rows[compareSelectedIndex]
      ? comparisonAligned.rows[compareSelectedIndex]
      : null;

  const singleDetail =
    !compareOn &&
    !teamH2hDual &&
    singleSelectedIndex !== null &&
    singleSeriesPoints[singleSelectedIndex]
      ? singleSeriesPoints[singleSelectedIndex]
      : null;

  const teamH2hDetail =
    teamH2hDual &&
    singleSelectedIndex !== null &&
    chartResponse?.seriesList?.[0]?.points[singleSelectedIndex] &&
    chartResponse?.seriesList?.[1]?.points[singleSelectedIndex]
      ? {
          a: chartResponse.seriesList[0].points[singleSelectedIndex],
          b: chartResponse.seriesList[1].points[singleSelectedIndex],
          nameA: chartResponse.seriesList[0].seriesName,
          nameB: chartResponse.seriesList[1].seriesName,
        }
      : null;

  const keyboardOffset = Platform.OS === 'ios' ? insets.top + 8 : 0;
  const sheetCollapsedPad = Math.round(windowHeight * 0.14) + 32;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.mainShell}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={keyboardOffset}
        >
          <ScrollView
            ref={mainScrollRef}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: Math.max(insets.bottom, SCREEN_PADDING) + sheetCollapsedPad,
                paddingHorizontal: SCREEN_PADDING,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
          <View style={styles.headerRow}>
            <View style={styles.headerTitleBlock} accessibilityRole="header">
              <Text style={styles.header}>NBA Analytics</Text>
              <Text style={styles.rangeCaption} numberOfLines={2}>
                {chartRangeLabel}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.filterIconButton}
              onPress={() => bottomSheetRef.current?.snapToIndex(1)}
              accessibilityRole="button"
              accessibilityLabel="Search and chart filters"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="options-outline" size={26} color={sem.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'player' }}
              onPress={() => onChangeMode('player')}
              style={[styles.pill, mode === 'player' && styles.activePill]}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text style={[styles.pillText, mode === 'player' && styles.pillTextActive]}>Player</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'team' }}
              onPress={() => onChangeMode('team')}
              style={[styles.pill, mode === 'team' && styles.activePill]}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text style={[styles.pillText, mode === 'team' && styles.pillTextActive]}>Team</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.compareRow}>
            <Text style={styles.sectionLabel}>View</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: !compareOn }}
                onPress={() => {
                  setCompareOn(false);
                  setSearchError('');
                  setDataError('');
                }}
                style={[styles.pill, !compareOn && styles.activePill]}
              >
                <Text style={[styles.pillText, !compareOn && styles.pillTextActive]}>Single</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: compareOn }}
                onPress={() => {
                  setCompareOn(true);
                  setSearchError('');
                  setDataError('');
                }}
                style={[styles.pill, compareOn && styles.activePill]}
              >
                <Text style={[styles.pillText, compareOn && styles.pillTextActive]}>Compare</Text>
              </TouchableOpacity>
            </View>
          </View>

          {compareOn ? (
            <View style={styles.entityPickers}>
              <Text style={styles.sectionLabel}>Selections</Text>
              <TouchableOpacity
                style={[styles.entityCard, searchTarget === 'primary' && styles.entityCardFocused]}
                onPress={() => {
                  setSearchTarget('primary');
                  setQuery(primaryEntity.name);
                  setSearchError('');
                  bottomSheetRef.current?.snapToIndex(1);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Primary ${mode}, ${primaryEntity.name}`}
              >
                <View style={styles.entityBadge}>
                  <View style={[styles.dot, { backgroundColor: scout.playerA }]} />
                  <Text style={styles.entitySlot}>A</Text>
                </View>
                <View style={styles.entityTextCol}>
                  <Text style={styles.entityName} numberOfLines={2}>
                    {primaryEntity.name}
                  </Text>
                  {primaryEntity.sub ? <Text style={styles.entitySub}>{primaryEntity.sub}</Text> : null}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.entityCard, searchTarget === 'secondary' && styles.entityCardFocused]}
                onPress={() => {
                  setSearchTarget('secondary');
                  setQuery(secondaryEntity.name);
                  setSearchError('');
                  bottomSheetRef.current?.snapToIndex(1);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Secondary ${mode}, ${secondaryEntity.name}`}
              >
                <View style={styles.entityBadge}>
                  <View style={[styles.dot, { backgroundColor: scout.playerB }]} />
                  <Text style={styles.entitySlot}>B</Text>
                </View>
                <View style={styles.entityTextCol}>
                  <Text style={styles.entityName} numberOfLines={2}>
                    {secondaryEntity.name}
                  </Text>
                  {secondaryEntity.sub ? <Text style={styles.entitySub}>{secondaryEntity.sub}</Text> : null}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.swapBtn}
                onPress={swapCompareEntities}
                accessibilityRole="button"
                accessibilityLabel="Swap A and B"
              >
                <Text style={styles.swapBtnText}>Swap A ↔ B</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.compareRow}>
            <Text style={styles.sectionLabel}>Stat scale</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: statBasis === 'raw' }}
                onPress={() => setStatBasis('raw')}
                style={[styles.pill, statBasis === 'raw' && styles.activePill]}
              >
                <Text style={[styles.pillText, statBasis === 'raw' && styles.pillTextActive]}>Raw</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: statBasis === 'adjusted' }}
                onPress={() => setStatBasis('adjusted')}
                style={[styles.pill, statBasis === 'adjusted' && styles.activePill]}
              >
                <Text style={[styles.pillText, statBasis === 'adjusted' && styles.pillTextActive]}>
                  Per 100 poss.
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Statistic</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statRow}
            keyboardShouldPersistTaps="handled"
          >
            {availableStats.map((s) => (
              <TouchableOpacity
                key={s.value}
                onPress={() => setActiveStat(s.value)}
                style={[styles.statBtn, activeStat === s.value && styles.activeStat]}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Text style={[styles.statBtnText, activeStat === s.value && styles.statBtnTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.card}>
            {loading ? (
              <ActivityIndicator size="large" color={scout.playerA} style={{ marginVertical: 32 }} />
            ) : (
              <>
                {dataError ? (
                  <Text style={styles.errorText} accessibilityLiveRegion="polite">
                    {dataError}
                  </Text>
                ) : null}
                {compareOn && chartResponse?.seriesList && chartResponse.seriesList.length >= 2 ? (
                  <>
                    <Text style={styles.cardTitle}>Comparison</Text>
                    <Text style={styles.cardSubTitle}>{chartCardSubtitle}</Text>
                    <Text style={styles.tapHint}>Tap a point for stats, opponents, and final scores.</Text>
                    <View style={styles.legendRow}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, { backgroundColor: scout.playerA }]} />
                        <Text style={styles.legendText} numberOfLines={2}>
                          {chartResponse.seriesList[0].seriesName}
                        </Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, { backgroundColor: scout.playerB }]} />
                        <Text style={styles.legendText} numberOfLines={2}>
                          {chartResponse.seriesList[1].seriesName}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : teamH2hDual ? (
                  <>
                    <Text style={styles.cardTitle}>Head-to-head</Text>
                    <Text style={styles.cardSubTitle}>{chartCardSubtitle}</Text>
                    <Text style={styles.tapHint}>Tap a point for game details and final score.</Text>
                    <View style={styles.legendRow}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, { backgroundColor: scout.playerA }]} />
                        <Text style={styles.legendText} numberOfLines={2}>
                          {chartResponse?.seriesList?.[0]?.seriesName}
                        </Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, { backgroundColor: scout.playerB }]} />
                        <Text style={styles.legendText} numberOfLines={2}>
                          {chartResponse?.seriesList?.[1]?.seriesName}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.cardTitle}>{chartTitle ?? '—'}</Text>
                    <Text style={styles.cardSubTitle}>{chartCardSubtitle}</Text>
                    <Text style={styles.tapHint}>Tap a point for game details and final score.</Text>
                  </>
                )}

                {!compareOn && teamH2hDual && teamH2hDataSet ? (
                  <ScrollView
                    horizontal
                    nestedScrollEnabled
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingVertical: 4 }}
                  >
                    <View style={{ paddingVertical: 4, width: chartWidth, minHeight: chartHeight + 24 }}>
                      <LineChart
                        dataSet={teamH2hDataSet}
                        width={chartWidth}
                        height={chartHeight}
                        {...giftedLineChartYAxisProps}
                        initialSpacing={CHART_INITIAL_SPACING}
                        spacing={CHART_SPACING}
                        curved
                        isAnimated
                        renderDataPointsAfterAnimationEnds
                        interpolateMissingValues={false}
                        showValuesAsDataPointsText={false}
                        focusedDataPointIndex={singleSelectedIndex ?? -1}
                        focusTogether
                        showReferenceLine1={showReferenceLine}
                        referenceLine1Position={referenceLineValue}
                        referenceLine1Config={referenceLine1ChartConfig}
                        xAxisLabelTextStyle={{ fontSize: 10, fontFamily: font.regular, color: sem.label }}
                        xAxisLabelsHeight={teamH2hHasAbsence ? 44 : undefined}
                        rulesColor={sem.rules}
                        nestedScrollEnabled
                      />
                    </View>
                  </ScrollView>
                ) : null}

                {!compareOn && !teamH2hDual && singleSeriesPoints.length > 0 && (
                  <ScrollView
                    horizontal
                    nestedScrollEnabled
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingVertical: 4 }}
                  >
                    <View style={[styles.chartInteractiveWrap, { width: chartWidth, minHeight: chartHeight + 24 }]}>
                      <LineChart
                        data={singleChartData}
                        width={chartWidth}
                        height={chartHeight}
                        {...giftedLineChartYAxisProps}
                        initialSpacing={CHART_INITIAL_SPACING}
                        spacing={CHART_SPACING}
                        curved
                        isAnimated
                        thickness={3}
                        color={scout.playerA}
                        dataPointsColor={scout.playerA}
                        hideDataPoints={false}
                        dataPointsRadius={7}
                        dataPointsHeight={14}
                        dataPointsWidth={14}
                        dataPointsShape="circular"
                        showValuesAsDataPointsText={false}
                        interpolateMissingValues={false}
                        focusedDataPointIndex={singleSelectedIndex ?? -1}
                        focusedDataPointRadius={11}
                        focusedDataPointColor={scout.playerA}
                        focusTogether
                        {...scoutAreaSingle}
                        showReferenceLine1={showReferenceLine}
                        referenceLine1Position={referenceLineValue}
                        referenceLine1Config={referenceLine1ChartConfig}
                        xAxisLabelTextStyle={{ fontSize: 10, fontFamily: font.regular, color: sem.label }}
                        xAxisLabelsHeight={singleChartHasAbsence ? 44 : undefined}
                        rulesColor={sem.rules}
                        xAxisColor={sem.axis}
                        yAxisColor={sem.axis}
                        nestedScrollEnabled
                      />
                    </View>
                  </ScrollView>
                )}

                {!compareOn && singleDetail ? (
                  <View
                    style={[
                      insightCompact.panel,
                      { backgroundColor: sem.insightBg, borderColor: sem.insightBorder },
                    ]}
                  >
                    <View style={[insightCompact.header, styles.insightHeaderRow]}>
                      <Text style={[insightCompact.title, { color: sem.text }]}>Game details</Text>
                      <TouchableOpacity onPress={() => setSingleSelectedIndex(null)} hitSlop={12}>
                        <Text style={[insightCompact.dismiss, { color: sem.statActiveText }]}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[insightCompact.date, { color: sem.muted }]}>
                      {singleDetail.isoDate ? formatRangeDate(singleDetail.isoDate) : 'Selected game'}
                    </Text>
                    <Text style={[insightCompact.entity, playerNameText, { color: sem.text }]}>
                      {chartTitle ?? '—'}
                    </Text>
                    <View style={styles.insightStatRow}>
                      <Text style={[insightCompact.statLabel, { color: sem.label }]}>{chartStatLabel}</Text>
                      <Text style={[insightCompact.statValue, { color: sem.text }]}>
                        {typeof singleDetail.value === 'number' && Number.isFinite(singleDetail.value)
                          ? singleDetail.value.toFixed(1)
                          : '—'}
                      </Text>
                    </View>
                    {singleDetail.chartAbsence ? (
                      <Text style={[insightCompact.body, { color: sem.muted, marginBottom: 6 }]}>
                        {singleDetail.chartAbsence === 'inactive'
                          ? 'Inactive — did not play this game.'
                          : 'Did not play (DNP).'}
                      </Text>
                    ) : null}
                    {typeof singleDetail.trueShootingPct === 'number' &&
                    Number.isFinite(singleDetail.trueShootingPct) ? (
                      <View
                        style={[
                          styles.efficiencyBadge,
                          { backgroundColor: tsEfficiencyBadgeStyle(singleDetail.trueShootingPct).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.efficiencyBadgeText,
                            { color: tsEfficiencyBadgeStyle(singleDetail.trueShootingPct).fg },
                          ]}
                        >
                          Efficiency · TS% {singleDetail.trueShootingPct.toFixed(1)}%
                        </Text>
                      </View>
                    ) : null}
                    <Text style={[insightCompact.sectionLabel, { color: sem.label }]}>Opponent</Text>
                    <Text style={[insightCompact.body, { color: sem.text }]}>
                      {singleDetail.opponentName?.trim() || 'Opponent not available for this game.'}
                    </Text>
                    <Text style={[insightCompact.sectionLabel, { color: sem.label, marginTop: 6 }]}>
                      Final score
                    </Text>
                    <Text style={[insightCompact.body, { color: sem.text }]}>
                      {singleDetail.gameScoreLine?.trim() || 'Score not available from the API for this game.'}
                    </Text>
                  </View>
                ) : null}

                {!compareOn && teamH2hDetail ? (
                  <View
                    style={[
                      insightCompact.panel,
                      { backgroundColor: sem.insightBg, borderColor: sem.insightBorder },
                    ]}
                  >
                    <View style={[insightCompact.header, styles.insightHeaderRow]}>
                      <Text style={[insightCompact.title, { color: sem.text }]}>Game details</Text>
                      <TouchableOpacity onPress={() => setSingleSelectedIndex(null)} hitSlop={12}>
                        <Text style={[insightCompact.dismiss, { color: sem.statActiveText }]}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[insightCompact.date, { color: sem.muted }]}>
                      {teamH2hDetail.a.isoDate ? formatRangeDate(teamH2hDetail.a.isoDate) : 'Selected game'}
                    </Text>
                    <Text style={[insightCompact.sectionLabel, { color: sem.label }]}>Final score</Text>
                    <Text style={[insightCompact.body, { color: sem.text, marginBottom: 8 }]}>
                      {teamH2hDetail.a.gameScoreLine?.trim() ||
                        teamH2hDetail.b.gameScoreLine?.trim() ||
                        'Score not available from the API for this game.'}
                    </Text>
                    <View style={styles.h2hTsBadgeRow}>
                      {typeof teamH2hDetail.a.trueShootingPct === 'number' &&
                      Number.isFinite(teamH2hDetail.a.trueShootingPct) ? (
                        <View
                          style={[
                            styles.efficiencyBadge,
                            { backgroundColor: tsEfficiencyBadgeStyle(teamH2hDetail.a.trueShootingPct).bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.efficiencyBadgeText,
                              { color: tsEfficiencyBadgeStyle(teamH2hDetail.a.trueShootingPct).fg },
                            ]}
                          >
                            A · TS% {teamH2hDetail.a.trueShootingPct.toFixed(1)}%
                          </Text>
                        </View>
                      ) : null}
                      {typeof teamH2hDetail.b.trueShootingPct === 'number' &&
                      Number.isFinite(teamH2hDetail.b.trueShootingPct) ? (
                        <View
                          style={[
                            styles.efficiencyBadge,
                            { backgroundColor: tsEfficiencyBadgeStyle(teamH2hDetail.b.trueShootingPct).bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.efficiencyBadgeText,
                              { color: tsEfficiencyBadgeStyle(teamH2hDetail.b.trueShootingPct).fg },
                            ]}
                          >
                            B · TS% {teamH2hDetail.b.trueShootingPct.toFixed(1)}%
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={[insightCompact.compareRow, styles.insightCompareRowLayout]}>
                      <View style={[insightCompact.swatch, { backgroundColor: scout.playerA }]} />
                      <View style={styles.insightCompareMid}>
                        <Text style={[insightCompact.entity, playerNameText, { color: sem.text }]} numberOfLines={2}>
                          {teamH2hDetail.nameA}
                        </Text>
                        <Text style={[insightCompact.vs, { color: sem.muted }]} numberOfLines={2}>
                          vs {teamH2hDetail.a.opponentName?.trim() || '—'}
                        </Text>
                      </View>
                      <View style={[insightCompact.statCol, styles.insightStatRightCol]}>
                        <Text style={[insightCompact.statLabel, { color: sem.label }]}>{chartStatLabel}</Text>
                        <Text style={[insightCompact.statValue, { color: sem.text }]}>
                          {typeof teamH2hDetail.a.value === 'number' && Number.isFinite(teamH2hDetail.a.value)
                            ? teamH2hDetail.a.value.toFixed(1)
                            : '—'}
                        </Text>
                      </View>
                    </View>
                    <View style={[insightCompact.compareRow, styles.insightCompareRowLayout]}>
                      <View style={[insightCompact.swatch, { backgroundColor: scout.playerB }]} />
                      <View style={styles.insightCompareMid}>
                        <Text style={[insightCompact.entity, playerNameText, { color: sem.text }]} numberOfLines={2}>
                          {teamH2hDetail.nameB}
                        </Text>
                        <Text style={[insightCompact.vs, { color: sem.muted }]} numberOfLines={2}>
                          vs {teamH2hDetail.b.opponentName?.trim() || '—'}
                        </Text>
                      </View>
                      <View style={[insightCompact.statCol, styles.insightStatRightCol]}>
                        <Text style={[insightCompact.statLabel, { color: sem.label }]}>{chartStatLabel}</Text>
                        <Text style={[insightCompact.statValue, { color: sem.text }]}>
                          {typeof teamH2hDetail.b.value === 'number' && Number.isFinite(teamH2hDetail.b.value)
                            ? teamH2hDetail.b.value.toFixed(1)
                            : '—'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {compareOn && comparisonAligned && compareDataSet ? (
                  <ScrollView
                    horizontal
                    nestedScrollEnabled
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={{ paddingVertical: 4 }}>
                      <LineChart
                        dataSet={compareDataSet}
                        width={chartWidth}
                        height={chartHeight}
                        {...giftedLineChartYAxisProps}
                        initialSpacing={CHART_INITIAL_SPACING}
                        spacing={CHART_SPACING}
                        isAnimated
                        renderDataPointsAfterAnimationEnds
                        interpolateMissingValues={false}
                        showValuesAsDataPointsText={false}
                        focusedDataPointIndex={compareSelectedIndex ?? -1}
                        focusTogether
                        showReferenceLine1={showReferenceLine}
                        referenceLine1Position={referenceLineValue}
                        referenceLine1Config={referenceLine1ChartConfig}
                        xAxisLabelTextStyle={{ fontSize: 10, fontFamily: font.regular, color: sem.label }}
                        xAxisLabelsHeight={compareChartHasAbsence ? 44 : undefined}
                        rulesColor={sem.rules}
                        nestedScrollEnabled
                      />
                    </View>
                  </ScrollView>
                ) : null}

                {compareOn && compareDetail && chartResponse?.seriesList?.[0] && chartResponse.seriesList[1] ? (
                  <View
                    style={[
                      insightCompact.panel,
                      { backgroundColor: sem.insightBg, borderColor: sem.insightBorder },
                    ]}
                  >
                    <View style={[insightCompact.header, styles.insightHeaderRow]}>
                      <Text style={[insightCompact.title, { color: sem.text }]}>Comparison details</Text>
                      <TouchableOpacity onPress={() => setCompareSelectedIndex(null)} hitSlop={12}>
                        <Text style={[insightCompact.dismiss, { color: sem.statActiveText }]}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[insightCompact.date, { color: sem.muted }]}>
                      {formatRangeDate(compareDetail.isoDate)}
                    </Text>
                    <Text style={[insightCompact.sectionLabel, { color: sem.label }]}>Final score</Text>
                    <Text style={[insightCompact.body, { color: sem.text, marginBottom: 8 }]}>
                      {Array.from(
                        new Set(
                          [compareDetail.scoreLineA, compareDetail.scoreLineB].filter(
                            (s): s is string => Boolean(s?.trim()),
                          ),
                        ),
                      ).join(' · ') || 'Score not available for this date.'}
                    </Text>
                    <View style={styles.h2hTsBadgeRow}>
                      {typeof compareDetail.tsPctA === 'number' && Number.isFinite(compareDetail.tsPctA) ? (
                        <View
                          style={[
                            styles.efficiencyBadge,
                            { backgroundColor: tsEfficiencyBadgeStyle(compareDetail.tsPctA).bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.efficiencyBadgeText,
                              { color: tsEfficiencyBadgeStyle(compareDetail.tsPctA).fg },
                            ]}
                          >
                            A · TS% {compareDetail.tsPctA.toFixed(1)}%
                          </Text>
                        </View>
                      ) : null}
                      {typeof compareDetail.tsPctB === 'number' && Number.isFinite(compareDetail.tsPctB) ? (
                        <View
                          style={[
                            styles.efficiencyBadge,
                            { backgroundColor: tsEfficiencyBadgeStyle(compareDetail.tsPctB).bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.efficiencyBadgeText,
                              { color: tsEfficiencyBadgeStyle(compareDetail.tsPctB).fg },
                            ]}
                          >
                            B · TS% {compareDetail.tsPctB.toFixed(1)}%
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={[insightCompact.compareRow, styles.insightCompareRowLayout]}>
                      <View style={[insightCompact.swatch, { backgroundColor: scout.playerA }]} />
                      <View style={styles.insightCompareMid}>
                        <Text style={[insightCompact.entity, playerNameText, { color: sem.text }]} numberOfLines={2}>
                          {chartResponse.seriesList[0].seriesName}
                        </Text>
                        <Text style={[insightCompact.vs, { color: sem.muted }]} numberOfLines={2}>
                          vs {compareDetail.opponentA?.trim() || '—'}
                        </Text>
                      </View>
                      <View style={[insightCompact.statCol, styles.insightStatRightCol]}>
                        <Text style={[insightCompact.statLabel, { color: sem.label }]}>{chartStatLabel}</Text>
                        <Text style={[insightCompact.statValue, { color: sem.text }]}>
                          {compareDetail.valueA !== undefined ? compareDetail.valueA.toFixed(1) : '—'}
                        </Text>
                      </View>
                    </View>
                    <View style={[insightCompact.compareRow, styles.insightCompareRowLayout]}>
                      <View style={[insightCompact.swatch, { backgroundColor: scout.playerB }]} />
                      <View style={styles.insightCompareMid}>
                        <Text style={[insightCompact.entity, playerNameText, { color: sem.text }]} numberOfLines={2}>
                          {chartResponse.seriesList[1].seriesName}
                        </Text>
                        <Text style={[insightCompact.vs, { color: sem.muted }]} numberOfLines={2}>
                          vs {compareDetail.opponentB?.trim() || '—'}
                        </Text>
                      </View>
                      <View style={[insightCompact.statCol, styles.insightStatRightCol]}>
                        <Text style={[insightCompact.statLabel, { color: sem.label }]}>{chartStatLabel}</Text>
                        <Text style={[insightCompact.statValue, { color: sem.text }]}>
                          {compareDetail.valueB !== undefined ? compareDetail.valueB.toFixed(1) : '—'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {!loading &&
                !dataError &&
                !compareOn &&
                singleSeriesPoints.length === 0 &&
                !lastResponse ? (
                  <Text style={styles.emptyState}>Select a {mode} and stat to load the chart.</Text>
                ) : null}

                {!loading && compareOn && comparisonAligned && comparisonAligned.data.length === 0 && !dataError ? (
                  <Text style={styles.emptyState}>
                    Not enough games in range for both sides to compare (each needs at least one game).
                  </Text>
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
        </KeyboardAvoidingView>

        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={filterSnapPoints}
          enablePanDownToClose={false}
          backdropComponent={renderSheetBackdrop}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.sheetHandle}
        >
          <BottomSheetScrollView
            contentContainerStyle={[
              styles.sheetScrollContent,
              { paddingBottom: Math.max(insets.bottom, SCREEN_PADDING) + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sheetSectionTitle}>Search</Text>
            <Text style={styles.searchHint}>
              {compareOn
                ? `Replace row ${searchTarget === 'primary' ? 'A' : 'B'}`
                : `Search ${mode}s`}
            </Text>
            <View style={styles.searchRow}>
              <SheetTextInput
                style={styles.input}
                value={query}
                onChangeText={(text) => {
                  setQuery(text);
                  setSearchError('');
                }}
                placeholder={mode === 'player' ? 'Player name…' : 'Team name…'}
                placeholderTextColor="#94a3b8"
                returnKeyType="search"
                onSubmitEditing={() => void runSearch()}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.btn, { minHeight: MIN_TOUCH }]}
                onPress={() => void runSearch()}
                accessibilityRole="button"
              >
                <Text style={styles.btnText}>Search</Text>
              </TouchableOpacity>
            </View>

            {searchError ? (
              <View style={styles.searchErrorRow}>
                <Text style={styles.searchErrorText} accessibilityLiveRegion="polite">
                  {searchError}
                </Text>
                <TouchableOpacity
                  onPress={() => setSearchError('')}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss search error"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.searchErrorDismiss}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {searchResults.length > 0 ? (
              <View style={styles.resultsContainer}>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.resultItem}
                    onPress={() => selectAndApplyEntity(item)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.resultText}>{item.name}</Text>
                    <Text style={styles.resultSubtext}>{item.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <Text style={[styles.sheetSectionTitle, styles.sheetSectionTitleSpaced]}>Chart filters</Text>

            <View style={styles.filterRow}>
              <TouchableOpacity style={styles.presetBtn} onPress={() => applyPresetRange('pastMonth')}>
                <Text style={styles.presetBtnText}>Past month</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={() => applyPresetRange('past3Months')}>
                <Text style={styles.presetBtnText}>Past 3 mo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={() => applyPresetRange('thisSeason')}>
                <Text style={styles.presetBtnText}>This season</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterRow}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setCalendarTarget('start')}>
                <Text style={styles.dateButtonText}>{startDateInput || 'Start date'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateButton} onPress={() => setCalendarTarget('end')}>
                <Text style={styles.dateButtonText}>{endDateInput || 'End date'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterRow}>
              <SheetTextInput
                style={styles.filterInput}
                value={upperBoundInput}
                onChangeText={setUpperBoundInput}
                placeholder="Reference line (optional)"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
              />
              <TouchableOpacity style={[styles.btn, { minHeight: MIN_TOUCH }]} onPress={applyFilters}>
                <Text style={styles.btnText}>Apply</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterMetaRow}>
              <Text style={styles.filterMetaText}>
                Default line (avg): {averageLineValue.toFixed(1)} {chartStatLabel}
              </Text>
              <TouchableOpacity
                style={[styles.toggleBtn, showReferenceLine && styles.toggleBtnActive]}
                onPress={() => setShowReferenceLine((prev) => !prev)}
              >
                <Text style={[styles.toggleBtnText, showReferenceLine && styles.toggleBtnTextActive]}>
                  {showReferenceLine ? 'Line on' : 'Line off'}
                </Text>
              </TouchableOpacity>
            </View>

            {!compareOn ? (
              <View style={styles.opponentFilterBlock}>
                <Text style={styles.sectionLabel}>Vs opponent</Text>
                <Text style={styles.opponentFilterHint}>
                  Only include games played against this NBA team.
                </Text>
                <View style={styles.searchRow}>
                  <SheetTextInput
                    style={styles.input}
                    value={opponentQuery}
                    onChangeText={(text) => {
                      setOpponentQuery(text);
                      setOpponentSearchError('');
                    }}
                    placeholder="Opponent team name…"
                    placeholderTextColor="#94a3b8"
                    returnKeyType="search"
                    onSubmitEditing={() => void runOpponentTeamSearch()}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[styles.btn, { minHeight: MIN_TOUCH }]}
                    onPress={() => void runOpponentTeamSearch()}
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnText}>Find team</Text>
                  </TouchableOpacity>
                </View>
                {opponentSearchError ? (
                  <Text style={styles.searchErrorText} accessibilityLiveRegion="polite">
                    {opponentSearchError}
                  </Text>
                ) : null}
                {opponentResults.length > 0 ? (
                  <View style={styles.resultsContainer}>
                    {opponentResults.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.resultItem}
                        onPress={() => {
                          setOpponentFilterTeam(item);
                          setOpponentResults([]);
                          setOpponentQuery(item.name);
                          setOpponentSearchError('');
                          bottomSheetRef.current?.snapToIndex(0);
                        }}
                        accessibilityRole="button"
                      >
                        <Text style={styles.resultText}>{item.name}</Text>
                        {item.sub ? <Text style={styles.resultSubtext}>{item.sub}</Text> : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
                {opponentFilterTeam ? (
                  <View style={styles.opponentPillRow}>
                    <Text style={styles.opponentPillText}>vs {opponentFilterTeam.name}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setOpponentFilterTeam(null);
                        setOpponentQuery('');
                      }}
                      accessibilityRole="button"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.opponentPillClear}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ) : null}
          </BottomSheetScrollView>
        </BottomSheet>
      </View>

      <Modal visible={calendarTarget !== null} transparent animationType="fade" onRequestClose={() => setCalendarTarget(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCalendarTarget(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {calendarTarget === 'start' ? 'Start date' : 'End date'}
            </Text>
            <Calendar
              current={
                calendarTarget === 'start'
                  ? (startDateInput || undefined)
                  : (endDateInput || startDateInput || undefined)
              }
              maxDate={calendarTarget === 'start' ? (endDateInput || undefined) : undefined}
              minDate={calendarTarget === 'end' ? (startDateInput || undefined) : undefined}
              onDayPress={onCalendarSelect}
              markedDates={{
                ...(startDateInput ? { [startDateInput]: { selected: true, selectedColor: scout.playerA } } : {}),
                ...(endDateInput ? { [endDateInput]: { selected: true, selectedColor: scout.playerA } } : {}),
              }}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setCalendarTarget(null)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => {
                  if (calendarTarget === 'start') setStartDateInput('');
                  if (calendarTarget === 'end') setEndDateInput('');
                  setCalendarTarget(null);
                }}
              >
                <Text style={styles.modalBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(sem: SemanticColors) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: sem.screenBg,
  },
  mainShell: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'stretch',
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  rangeCaption: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: font.regular,
    color: sem.muted,
    lineHeight: 18,
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: sem.surface,
    borderWidth: 1,
    borderColor: sem.filterIconBorder,
  },
  sheetBackground: {
    backgroundColor: sem.sheet,
  },
  sheetHandle: {
    width: 40,
    backgroundColor: sem.handle,
  },
  sheetScrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 8,
  },
  sheetSectionTitle: {
    fontSize: 13,
    fontFamily: font.bold,
    fontWeight: '800',
    color: sem.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  sheetSectionTitleSpaced: {
    marginTop: 20,
  },
  header: {
    fontSize: 28,
    fontFamily: font.bold,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 0,
    color: sem.text,
    letterSpacing: -0.5,
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontFamily: font.bold,
    fontWeight: '700',
    color: sem.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  compareRow: {
    width: '100%',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 10,
    flexWrap: 'wrap',
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: sem.pillBg,
    minHeight: 44,
    justifyContent: 'center',
  },
  activePill: {
    backgroundColor: sem.pillActiveBg,
  },
  pillText: {
    color: sem.pillText,
    fontFamily: font.semibold,
    fontWeight: '600',
    fontSize: 15,
  },
  pillTextActive: {
    color: sem.pillActiveText,
  },
  entityPickers: {
    width: '100%',
    marginBottom: 12,
    gap: 10,
  },
  entityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: sem.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: sem.border,
    padding: SCREEN_PADDING,
    gap: 12,
    minHeight: MIN_TOUCH,
  },
  entityCardFocused: {
    borderColor: sem.entityFocusBorder,
    backgroundColor: sem.entityFocusBg,
  },
  entityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  entitySlot: {
    fontFamily: font.bold,
    fontWeight: '800',
    color: sem.text,
    fontSize: 14,
  },
  entityTextCol: {
    flex: 1,
  },
  entityName: {
    ...playerNameText,
    color: sem.text,
  },
  entitySub: {
    fontSize: 12,
    fontFamily: font.regular,
    color: sem.muted,
    marginTop: 2,
  },
  swapBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  swapBtnText: {
    color: sem.statActiveText,
    fontFamily: font.bold,
    fontWeight: '700',
    fontSize: 14,
  },
  searchHint: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontFamily: font.regular,
    color: sem.muted,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 12,
  },
  searchErrorRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: sem.errorBg,
    borderWidth: 1,
    borderColor: sem.errorBorder,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: SCREEN_PADDING,
    marginBottom: 12,
  },
  searchErrorText: {
    flex: 1,
    color: sem.errorText,
    fontFamily: font.semibold,
    fontSize: 14,
    fontWeight: '600',
  },
  searchErrorDismiss: {
    color: sem.statActiveText,
    fontFamily: font.bold,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    backgroundColor: sem.inputBg,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, default: 12 }),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: sem.inputBorder,
    fontSize: 16,
    fontFamily: font.regular,
    color: sem.text,
  },
  btn: {
    backgroundColor: sem.btnPrimaryBg,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 12,
  },
  btnText: {
    color: sem.btnPrimaryText,
    fontFamily: font.bold,
    fontWeight: '700',
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterMetaText: {
    color: sem.label,
    fontFamily: font.semibold,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  toggleBtn: {
    borderWidth: 1,
    borderColor: sem.borderStrong,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: sem.pillBg,
    borderColor: sem.borderStrong,
  },
  toggleBtnText: {
    color: sem.label,
    fontFamily: font.semibold,
    fontSize: 12,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: sem.text,
    fontFamily: font.semibold,
  },
  presetBtn: {
    backgroundColor: sem.presetBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: sem.presetBorder,
  },
  presetBtnText: {
    color: sem.presetText,
    fontFamily: font.semibold,
    fontWeight: '600',
    fontSize: 12,
  },
  dateButton: {
    flex: 1,
    backgroundColor: sem.inputBg,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: sem.inputBorder,
    minHeight: 44,
    justifyContent: 'center',
  },
  dateButtonText: {
    color: sem.text,
    fontFamily: font.regular,
    fontSize: 15,
  },
  filterInput: {
    flex: 1,
    backgroundColor: sem.inputBg,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: sem.inputBorder,
    fontSize: 15,
    fontFamily: font.regular,
    color: sem.text,
    minHeight: 44,
  },
  resultsContainer: {
    width: '100%',
    backgroundColor: sem.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: sem.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  resultItem: {
    paddingVertical: SCREEN_PADDING,
    paddingHorizontal: SCREEN_PADDING,
    borderBottomWidth: 1,
    borderBottomColor: sem.border,
    minHeight: 48,
    justifyContent: 'center',
  },
  resultText: {
    fontFamily: font.semibold,
    fontWeight: '600',
    color: sem.text,
    fontSize: 16,
  },
  resultSubtext: {
    fontSize: 12,
    fontFamily: font.regular,
    color: sem.muted,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingRight: 8,
  },
  statBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: sem.surface,
    borderWidth: 1,
    borderColor: sem.border,
    minHeight: 40,
    justifyContent: 'center',
  },
  activeStat: {
    borderColor: sem.statActiveBorder,
    backgroundColor: sem.statActiveBg,
  },
  statBtnText: {
    color: sem.label,
    fontFamily: font.bold,
    fontWeight: '700',
    fontSize: 14,
  },
  statBtnTextActive: {
    color: sem.statActiveText,
    fontFamily: font.bold,
  },
  card: {
    width: '100%',
    backgroundColor: sem.card,
    padding: SCREEN_PADDING,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: sem.border,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
      default: {},
    }),
    marginBottom: 8,
  },
  errorText: {
    color: sem.errorText,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: font.semibold,
    fontWeight: '600',
    fontSize: 15,
  },
  cardTitle: {
    ...playerNameText,
    textAlign: 'center',
    color: sem.text,
  },
  cardSubTitle: {
    fontSize: 14,
    fontFamily: font.medium,
    color: sem.muted,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 13,
    fontFamily: font.regular,
    color: sem.muted,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 18,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '48%',
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    flex: 1,
    fontSize: 13,
    fontFamily: font.semibold,
    fontWeight: '600',
    color: sem.label,
  },
  cardRange: {
    fontSize: 12,
    fontFamily: font.semibold,
    color: sem.label,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  chartInteractiveWrap: {
    position: 'relative',
    overflow: 'visible',
  },
  insightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightStatRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  efficiencyBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  efficiencyBadgeText: {
    fontFamily: font.bold,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.3,
  },
  h2hTsBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  insightCompareRowLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightCompareMid: {
    flex: 1,
    minWidth: 0,
  },
  insightStatRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  opponentFilterBlock: {
    marginTop: 18,
    marginBottom: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: sem.border,
  },
  opponentFilterHint: {
    fontSize: 13,
    fontFamily: font.regular,
    color: sem.label,
    marginBottom: 10,
    lineHeight: 18,
  },
  opponentPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: sem.opponentPillBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: sem.opponentPillBorder,
  },
  opponentPillText: {
    flex: 1,
    fontSize: 14,
    fontFamily: font.semibold,
    fontWeight: '600',
    color: sem.opponentPillText,
    marginRight: 8,
  },
  opponentPillClear: {
    fontSize: 15,
    fontFamily: font.bold,
    fontWeight: '700',
    color: sem.statActiveText,
  },
  emptyState: {
    textAlign: 'center',
    color: sem.label,
    fontFamily: font.regular,
    marginVertical: 24,
    fontSize: 15,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: SCREEN_PADDING,
  },
  modalCard: {
    backgroundColor: sem.surface,
    borderRadius: 16,
    padding: SCREEN_PADDING,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: sem.border,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: font.bold,
    fontWeight: '700',
    marginBottom: 8,
    color: sem.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  modalBtnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: sem.modalBtnBg,
    minHeight: 44,
    justifyContent: 'center',
  },
  modalBtnText: {
    color: sem.text,
    fontFamily: font.semibold,
    fontWeight: '600',
    fontSize: 15,
  },
  });
}
