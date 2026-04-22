import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatEntity } from './stat.entity';
import { BalldontlieAPI } from '@balldontlie/sdk';

type Filters = {
  dataSource: 'API' | 'DB';
  season?: number;
  isTeam?: boolean;
  isAverages?: boolean;
  startDate?: string;
  endDate?: string;
  opponentTeamId?: number;
};

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
  opponentTeamId?: number;
  chartAbsence?: 'dnp' | 'inactive';
};

type RawStatEntry = {
  [key: string]: unknown;
  stats?: Record<string, unknown>;
  player?: { team_id?: number };
  game?: {
    id?: number;
    date?: string;
    home_team?: { id?: number; full_name?: string; abbreviation?: string };
    visitor_team?: { id?: number; full_name?: string; abbreviation?: string };
    home_team_id?: number;
    visitor_team_id?: number;
    home_team_score?: number;
    visitor_team_score?: number;
  };
  team?: { id?: number };
  date?: string;
  opponentName?: string;
};

type TeamAveragesClient = {
  getTeamSeasonAverages: (params: {
    season: number;
    category: string;
    team_ids: number[];
  }) => Promise<{ data: RawStatEntry[] }>;
};

type StatsResponse = {
  data: RawStatEntry[];
  meta?: {
    next_cursor?: number | null;
  };
};

type TeamGameAggregate = {
  game_id: number;
  date: string;
  pts: number;
  ast: number;
  reb: number;
  stl: number;
};

type GameEntry = {
  id?: number;
  date?: string;
  home_team?: { id?: number; full_name?: string; abbreviation?: string };
  visitor_team?: { id?: number; full_name?: string; abbreviation?: string };
  home_team_score?: number;
  visitor_team_score?: number;
};

type GamesResponse = {
  data: GameEntry[];
  meta?: {
    next_cursor?: number | null;
  };
};

@Injectable()
export class VisualizationService {
  private readonly api: BalldontlieAPI;
  private readonly teamNameById = new Map<number, string>();

  constructor(
    @InjectRepository(StatEntity)
    private readonly statsRepository: Repository<StatEntity>,
  ) {
    this.api = new BalldontlieAPI({
      apiKey: process.env.BALLDONTLIE_API_KEY ?? '',
    });
  }

  async searchEntities(
    query: string,
    type: string,
  ): Promise<EntitySearchResult[]> {
    try {
      if (type === 'player') {
        const result = await this.api.nba.getPlayers({ search: query });
        return result.data.map((p) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          sub: p.team?.full_name || 'Free Agent',
        }));
      }

      const result = await this.api.nba.getTeams();
      return result.data
        .filter((t) => t.full_name.toLowerCase().includes(query.toLowerCase()))
        .map((t) => ({ id: t.id, name: t.full_name, sub: t.conference }));
    } catch (error: unknown) {
      this.throwApiError(error);
    }
  }

  async generateUniversalVisualization(
    entityIds: number[],
    statKey: string,
    filters: Filters,
    threshold?: number,
  ) {
    try {
      if (
        entityIds.length === 1 &&
        filters.isTeam &&
        typeof filters.opponentTeamId === 'number' &&
        !Number.isNaN(filters.opponentTeamId)
      ) {
        const teamId = entityIds[0];
        const oppId = filters.opponentTeamId;
        const dual = await this.buildTeamHeadToHeadDualSeries(
          teamId,
          oppId,
          statKey,
          filters,
        );
        const nameA = await this.resolveEntityName(teamId, true);
        const nameB = await this.resolveEntityName(oppId, true);
        await this.hydrateOpponentNames(dual.pointsA);
        await this.hydrateOpponentNames(dual.pointsB);
        return {
          seriesList: [
            { seriesName: nameA, points: dual.pointsA },
            { seriesName: nameB, points: dual.pointsB },
          ],
          threshold,
          statTitle: statKey,
        };
      }

      const allSeries: { seriesName: string; points: ChartPoint[] }[] = [];
      for (const id of entityIds) {
        const rawData = await this.fetchUniversalData(id, statKey, filters);
        await this.preloadTeamNamesFromRawEntries(rawData || []);
        const seriesPoints = this.mapDataToPoints(rawData || [], statKey, {
          entityId: id,
          isTeam: Boolean(filters.isTeam),
        });
        await this.hydrateOpponentNames(seriesPoints);
        const entityName = await this.resolveEntityName(
          id,
          Boolean(filters.isTeam),
        );
        allSeries.push({ seriesName: entityName, points: seriesPoints });
      }
      return { seriesList: allSeries, threshold, statTitle: statKey };
    } catch (error: unknown) {
      this.throwApiError(error);
    }
  }

  private async fetchUniversalData(
    id: number,
    statKey: string,
    filters: Filters,
  ): Promise<RawStatEntry[]> {
    const isTeam = Boolean(filters.isTeam);
    const season = filters.season ?? new Date().getFullYear();
    const hasDateRange = Boolean(filters.startDate || filters.endDate);
    const opponentFilterId = filters.opponentTeamId;

    if (filters.dataSource === 'API') {
      if (isTeam) {
        const rows = await this.fetchTeamStatByGame(
          id,
          statKey,
          hasDateRange,
          season,
          filters.startDate,
          filters.endDate,
        );
        return this.applyOpponentTeamFilter(rows, opponentFilterId, id, true);
      }

      if (filters.isAverages) {
        const category = this.getCategoryForStat(statKey);
        const seasonForAverages =
          filters.season ??
          (filters.endDate
            ? new Date(filters.endDate).getFullYear()
            : filters.startDate
              ? new Date(filters.startDate).getFullYear()
              : new Date().getFullYear());
        const params: { season: number; category: string } = {
          season: seasonForAverages,
          category,
        };
        if (isTeam) {
          const nbaApiWithTeamAverages = this.api
            .nba as unknown as TeamAveragesClient;
          return (
            await nbaApiWithTeamAverages.getTeamSeasonAverages({
              ...params,
              team_ids: [id],
            })
          ).data;
        }
        return (
          await this.api.nba.getSeasonAverages({ ...params, player_id: id })
        ).data as unknown as RawStatEntry[];
      }

      const statsRows = await this.fetchAllStatsFromApi({
        player_ids: [id],
        ...(hasDateRange ? {} : { seasons: [season] }),
        ...(filters.startDate ? { start_date: filters.startDate } : {}),
        ...(filters.endDate ? { end_date: filters.endDate } : {}),
      });
      const boundedRows = hasDateRange
        ? this.filterRowsByDateRange(
            statsRows,
            filters.startDate,
            filters.endDate,
          )
        : statsRows;

      const withSchedule =
        hasDateRange && !filters.isAverages
          ? await this.mergePlayerStatsWithSchedule(
              boundedRows,
              id,
              filters.startDate,
              filters.endDate,
            )
          : boundedRows;

      return this.applyOpponentTeamFilter(
        withSchedule,
        opponentFilterId,
        id,
        false,
      );
    }

    const dbRows = (await this.statsRepository.find({
      where: { entity_id: id },
    })) as unknown as RawStatEntry[];
    return this.applyOpponentTeamFilter(dbRows, opponentFilterId, id, isTeam);
  }

  private getOpponentTeamIdForEntry(
    entry: RawStatEntry,
    entityId: number,
    isTeam: boolean,
  ): number | undefined {
    const { homeId, visitorId } = this.extractHomeVisitorIds(entry.game);
    if (homeId === undefined || visitorId === undefined) return undefined;
    if (isTeam) {
      if (entityId === homeId) return visitorId;
      if (entityId === visitorId) return homeId;
      return undefined;
    }
    const teamId = this.getPlayerStatTeamId(entry);
    if (teamId === undefined) return undefined;
    if (teamId === homeId) return visitorId;
    if (teamId === visitorId) return homeId;
    return undefined;
  }

  private applyOpponentTeamFilter(
    rows: RawStatEntry[],
    opponentTeamId: number | undefined,
    entityId: number,
    isTeam: boolean,
  ): RawStatEntry[] {
    if (
      opponentTeamId === undefined ||
      typeof opponentTeamId !== 'number' ||
      Number.isNaN(opponentTeamId)
    ) {
      return rows;
    }
    return rows.filter(
      (row) =>
        this.getOpponentTeamIdForEntry(row, entityId, isTeam) === opponentTeamId,
    );
  }

  private getCategoryForStat(stat: string) {
    return ['fg_pct', 'fg3_pct', 'ft_pct', 'ts_pct'].includes(stat)
      ? 'shooting'
      : 'general';
  }

  private async fetchAllStatsFromApi(
    params: Record<string, unknown>,
  ): Promise<RawStatEntry[]> {
    const allRows: RawStatEntry[] = [];
    let cursor: number | undefined;

    for (let page = 0; page < 30; page += 1) {
      const response = (await this.api.nba.getStats({
        ...params,
        per_page: 100,
        ...(cursor !== undefined ? { cursor } : {}),
      } as unknown as Record<string, never>)) as unknown as StatsResponse;

      if (Array.isArray(response.data) && response.data.length > 0) {
        allRows.push(...response.data);
      }

      const nextCursor = response.meta?.next_cursor;
      if (nextCursor === null || nextCursor === undefined) {
        break;
      }
      cursor = nextCursor;
    }

    return allRows;
  }

  private async fetchAllGamesFromApi(
    params: Record<string, unknown>,
  ): Promise<GameEntry[]> {
    const allGames: GameEntry[] = [];
    let cursor: number | undefined;

    for (let page = 0; page < 20; page += 1) {
      const response = (await this.api.nba.getGames({
        ...params,
        per_page: 100,
        ...(cursor !== undefined ? { cursor } : {}),
      } as unknown as Record<string, never>)) as unknown as GamesResponse;

      if (Array.isArray(response.data) && response.data.length > 0) {
        allGames.push(...response.data);
      }

      const nextCursor = response.meta?.next_cursor;
      if (nextCursor === null || nextCursor === undefined) {
        break;
      }
      cursor = nextCursor;
    }

    return allGames;
  }

  private async fetchTeamPointsByGame(
    teamId: number,
    hasDateRange: boolean,
    season: number,
    startDate?: string,
    endDate?: string,
  ): Promise<RawStatEntry[]> {
    const games = await this.fetchAllGamesFromApi({
      team_ids: [teamId],
      ...(hasDateRange ? {} : { seasons: [season] }),
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    });

    return games
      .map((game) => {
        if (!game.date) return null;
        const isHome = game.home_team?.id === teamId;
        const score = isHome ? game.home_team_score : game.visitor_team_score;
        const opponent = isHome ? game.visitor_team : game.home_team;
        const opponentName =
          opponent && typeof opponent.full_name === 'string'
            ? opponent.full_name
            : undefined;
        return {
          date: this.normalizeIsoDate(game.date),
          pts: Number(score ?? 0),
          game: {
            id: game.id,
            date: game.date,
            home_team: game.home_team,
            visitor_team: game.visitor_team,
            home_team_score: game.home_team_score,
            visitor_team_score: game.visitor_team_score,
          },
          opponentName,
        } as RawStatEntry;
      })
      .filter((entry): entry is RawStatEntry => entry !== null)
      .sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')));
  }

  private async fetchTeamStatByGame(
    teamId: number,
    statKey: string,
    hasDateRange: boolean,
    season: number,
    startDate?: string,
    endDate?: string,
  ): Promise<RawStatEntry[]> {
    const games = await this.fetchAllGamesFromApi({
      team_ids: [teamId],
      ...(hasDateRange ? {} : { seasons: [season] }),
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    });

    if (!games.length) return [];
    if (statKey === 'pts') {
      return this.fetchTeamPointsByGame(
        teamId,
        hasDateRange,
        season,
        startDate,
        endDate,
      );
    }

    const gameIds = games
      .map((game) => game.id)
      .filter((value): value is number => typeof value === 'number');
    if (!gameIds.length) return [];

    const chunkSize = 25;
    const allRows: RawStatEntry[] = [];
    for (let i = 0; i < gameIds.length; i += chunkSize) {
      const chunk = gameIds.slice(i, i + chunkSize);
      const rows = await this.fetchAllStatsFromApi({ game_ids: chunk });
      allRows.push(...rows);
    }

    const teamRows = allRows.filter(
      (row) => row.team?.id === teamId || row.stats?.team_id === teamId,
    );

    const opponentByGameId = new Map<number, string>();
    for (const game of games) {
      const gid = typeof game.id === 'number' ? game.id : undefined;
      if (gid === undefined) continue;
      const isHome = game.home_team?.id === teamId;
      const opponent = isHome ? game.visitor_team : game.home_team;
      const name =
        opponent && typeof opponent.full_name === 'string'
          ? opponent.full_name
          : 'Opponent';
      opponentByGameId.set(gid, name);
    }

    type TeamAgg = {
      date: string;
      value: number;
      pts: number;
      fga: number;
      fta: number;
      oreb: number;
      tov: number;
    };
    const aggregate = new Map<number, TeamAgg>();
    for (const row of teamRows) {
      const gameId = typeof row.game?.id === 'number' ? row.game.id : undefined;
      const rawDate = row.game?.date ?? row.date;
      if (!gameId || typeof rawDate !== 'string') continue;

      const numericValue = Number(row[statKey] ?? row.stats?.[statKey] ?? 0);
      if (Number.isNaN(numericValue)) continue;

      const existing = aggregate.get(gameId) ?? {
        date: this.normalizeIsoDate(rawDate),
        value: 0,
        pts: 0,
        fga: 0,
        fta: 0,
        oreb: 0,
        tov: 0,
      };
      existing.value += numericValue;
      existing.pts += Number(row.pts ?? row.stats?.pts ?? 0);
      existing.fga += Number(row.fga ?? row.stats?.fga ?? 0);
      existing.fta += Number(row.fta ?? row.stats?.fta ?? 0);
      existing.oreb += Number(row.oreb ?? row.stats?.oreb ?? 0);
      existing.tov += Number(row.turnover ?? row.stats?.turnover ?? 0);
      aggregate.set(gameId, existing);
    }

    const gameById = new Map<number, GameEntry>();
    for (const g of games) {
      if (typeof g.id === 'number') gameById.set(g.id, g);
    }

    return Array.from(aggregate.entries())
      .map(([gameId, entry]) => {
        const g = gameById.get(gameId);
        let poss = entry.fga + 0.44 * entry.fta - entry.oreb + entry.tov;
        if (!Number.isFinite(poss) || poss <= 0) {
          poss = entry.fga + 0.44 * entry.fta;
        }
        const gamePossessions =
          Number.isFinite(poss) && poss > 0 ? poss : undefined;
        return {
          game_id: gameId,
          date: entry.date,
          [statKey]: entry.value,
          pts: entry.pts,
          fga: entry.fga,
          fta: entry.fta,
          oreb: entry.oreb,
          turnover: entry.tov,
          ...(typeof gamePossessions === 'number' ? { gamePossessions } : {}),
          opponentName: opponentByGameId.get(gameId),
          game: g
            ? {
                id: g.id,
                date: g.date,
                home_team: g.home_team,
                visitor_team: g.visitor_team,
                home_team_score: g.home_team_score,
                visitor_team_score: g.visitor_team_score,
              }
            : undefined,
        } as RawStatEntry;
      })
      .sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')));
  }

  private normalizeIsoDate(rawDate: string): string {
    const candidate = rawDate.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
      return candidate;
    }
    const normalized = new Date(rawDate).toISOString().slice(0, 10);
    return normalized;
  }

  private aggregateTeamStatsByGame(rows: RawStatEntry[]): RawStatEntry[] {
    const grouped = new Map<number, TeamGameAggregate>();

    for (const row of rows) {
      const gameId = typeof row.game?.id === 'number' ? row.game.id : undefined;
      if (!gameId) continue;

      const rawDate = row.game?.date ?? row.date;
      if (typeof rawDate !== 'string') continue;

      const aggregate = grouped.get(gameId) ?? {
        game_id: gameId,
        date: this.normalizeIsoDate(rawDate),
        pts: 0,
        ast: 0,
        reb: 0,
        stl: 0,
      };

      aggregate.pts += Number(row.pts ?? row.stats?.pts ?? 0);
      aggregate.ast += Number(row.ast ?? row.stats?.ast ?? 0);
      aggregate.reb += Number(row.reb ?? row.stats?.reb ?? 0);
      aggregate.stl += Number(row.stl ?? row.stats?.stl ?? 0);

      grouped.set(gameId, aggregate);
    }

    return Array.from(grouped.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  private async mergePlayerStatsWithSchedule(
    stats: RawStatEntry[],
    playerId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<RawStatEntry[]> {
    if (!startDate && !endDate) return stats;

    let teamId: number | undefined;
    for (const row of stats) {
      teamId = this.getPlayerStatTeamId(row);
      if (typeof teamId === 'number') break;
    }
    if (teamId === undefined) {
      try {
        const res = await this.api.nba.getPlayer(playerId);
        const p = res.data as unknown as { team?: { id?: number } };
        if (typeof p.team?.id === 'number') teamId = p.team.id;
      } catch {
        return stats;
      }
    }
    if (typeof teamId !== 'number') return stats;

    const games = await this.fetchAllGamesFromApi({
      team_ids: [teamId],
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    });
    if (!games.length) return stats;

    const byGameId = new Map<number, RawStatEntry>();
    for (const row of stats) {
      const gid = typeof row.game?.id === 'number' ? row.game.id : undefined;
      if (gid === undefined) continue;
      byGameId.set(gid, row);
    }

    const sorted = [...games].sort((a, b) =>
      String(a.date ?? '').localeCompare(String(b.date ?? '')),
    );

    const out: RawStatEntry[] = [];
    const used = new Set<number>();
    for (const game of sorted) {
      if (typeof game.id !== 'number' || !game.date) continue;
      const existing = byGameId.get(game.id);
      if (existing) {
        out.push(existing);
        used.add(game.id);
        continue;
      }
      out.push({
        game: {
          id: game.id,
          date: game.date,
          home_team: game.home_team,
          visitor_team: game.visitor_team,
          home_team_score: game.home_team_score,
          visitor_team_score: game.visitor_team_score,
        },
        player: { id: playerId, team_id: teamId } as unknown as RawStatEntry['player'],
        team: { id: teamId } as unknown as RawStatEntry['team'],
        min: '0:00',
      } as RawStatEntry);
      used.add(game.id);
    }

    for (const row of stats) {
      const gid = typeof row.game?.id === 'number' ? row.game.id : undefined;
      if (gid === undefined || used.has(gid)) continue;
      out.push(row);
      used.add(gid);
    }

    out.sort((a, b) => {
      const da = String(a.game?.date ?? a.date ?? '');
      const db = String(b.game?.date ?? b.date ?? '');
      return da.localeCompare(db);
    });

    return out;
  }

  private classifyPlayerAbsence(entry: RawStatEntry): 'dnp' | 'inactive' {
    const raw =
      (entry as Record<string, unknown>)['min'] ??
      entry.stats?.['min'] ??
      (entry as Record<string, unknown>)['minutes_played'];
    const s = raw !== undefined && raw !== null ? String(raw).trim() : '';
    if (/inactive/i.test(s)) return 'inactive';
    return 'dnp';
  }

  private parseMinutesPlayed(entry: RawStatEntry): number | undefined {
    const raw =
      (entry as Record<string, unknown>)['minutes_played'] ??
      (entry as Record<string, unknown>)['min'] ??
      entry.stats?.['min'];
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === 'number') {
      return Number.isFinite(raw) ? raw : undefined;
    }
    const s = String(raw).trim();
    if (!s) return undefined;
    if (/^dnp/i.test(s)) return 0;
    const colon = /^(\d+)\s*:\s*(\d+)\s*$/.exec(s);
    if (colon) {
      const mm = Number(colon[1]);
      const ss = Number(colon[2]);
      if (!Number.isFinite(mm) || !Number.isFinite(ss)) return undefined;
      return mm + ss / 60;
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }

  private filterRowsByDateRange(
    rows: RawStatEntry[],
    startDate?: string,
    endDate?: string,
  ): RawStatEntry[] {
    return rows.filter((row) => {
      const rawDate = row.game?.date ?? row.date;
      if (typeof rawDate !== 'string') return false;

      const isoDate = this.normalizeIsoDate(rawDate);
      if (startDate && isoDate < startDate) return false;
      if (endDate && isoDate > endDate) return false;

      return true;
    });
  }

  private getShortLabelFromIso(isoDate: string): string {
    const [, month, day] = isoDate.split('-');
    return `${Number(month)}/${Number(day)}`;
  }

  private extractHomeVisitorIds(game: RawStatEntry['game'] | undefined): {
    homeId?: number;
    visitorId?: number;
  } {
    if (!game) return {};
    const g = game as Record<string, unknown>;
    const ht = g['home_team'];
    const vt = g['visitor_team'];
    const homeFromNested =
      ht && typeof ht === 'object' && typeof (ht as { id?: unknown }).id === 'number'
        ? ((ht as { id: number }).id as number)
        : undefined;
    const visitorFromNested =
      vt && typeof vt === 'object' && typeof (vt as { id?: unknown }).id === 'number'
        ? ((vt as { id: number }).id as number)
        : undefined;
    const homeId =
      homeFromNested ??
      (typeof g['home_team_id'] === 'number' ? (g['home_team_id'] as number) : undefined);
    const visitorId =
      visitorFromNested ??
      (typeof g['visitor_team_id'] === 'number' ? (g['visitor_team_id'] as number) : undefined);
    return { homeId, visitorId };
  }

  private getPlayerStatTeamId(entry: RawStatEntry): number | undefined {
    const team = entry.team as { id?: number } | undefined;
    if (typeof team?.id === 'number') return team.id;
    const player = entry.player as { team_id?: number } | undefined;
    if (typeof player?.team_id === 'number') return player.team_id;
    if (typeof entry.stats?.team_id === 'number') return Number(entry.stats.team_id);
    return undefined;
  }

  private resolveOpponentFromEntry(
    entry: RawStatEntry,
    entityId: number,
    isTeam: boolean,
  ): { opponentName?: string; opponentTeamId?: number } {
    if (typeof entry.opponentName === 'string' && entry.opponentName.trim().length > 0) {
      return { opponentName: entry.opponentName.trim() };
    }

    const game = entry.game;
    const { homeId, visitorId } = this.extractHomeVisitorIds(game);
    if (homeId === undefined || visitorId === undefined) {
      return {};
    }

    const homeName =
      game?.home_team && typeof game.home_team === 'object'
        ? (game.home_team as { full_name?: string }).full_name
        : undefined;
    const visitorName =
      game?.visitor_team && typeof game.visitor_team === 'object'
        ? (game.visitor_team as { full_name?: string }).full_name
        : undefined;

    if (isTeam) {
      if (entityId === homeId) {
        return {
          opponentName: typeof visitorName === 'string' ? visitorName : undefined,
          opponentTeamId: visitorId,
        };
      }
      if (entityId === visitorId) {
        return {
          opponentName: typeof homeName === 'string' ? homeName : undefined,
          opponentTeamId: homeId,
        };
      }
      return {};
    }

    const teamId = this.getPlayerStatTeamId(entry);
    if (teamId === undefined) return {};
    if (teamId === homeId) {
      return {
        opponentName: typeof visitorName === 'string' ? visitorName : undefined,
        opponentTeamId: visitorId,
      };
    }
    if (teamId === visitorId) {
      return {
        opponentName: typeof homeName === 'string' ? homeName : undefined,
        opponentTeamId: homeId,
      };
    }
    return {};
  }

  private async resolveTeamFullName(teamId: number): Promise<string | undefined> {
    const cached = this.teamNameById.get(teamId);
    if (cached) return cached;
    try {
      const res = await this.api.nba.getTeam(teamId);
      const data = res.data as unknown as { full_name?: string };
      if (typeof data.full_name === 'string') {
        this.teamNameById.set(teamId, data.full_name);
        return data.full_name;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  private teamNameForScoreLine(
    team?: { id?: number; abbreviation?: string; full_name?: string },
  ): string {
    if (!team) return 'Unknown team';
    if (typeof team.id === 'number') {
      const cached = this.teamNameById.get(team.id);
      if (cached) return cached;
    }
    if (typeof team.full_name === 'string' && team.full_name.trim()) {
      return team.full_name.trim();
    }
    if (typeof team.abbreviation === 'string' && team.abbreviation.trim()) {
      return team.abbreviation.trim();
    }
    return 'Unknown team';
  }

  private async preloadTeamNamesFromRawEntries(rows: RawStatEntry[]): Promise<void> {
    const ids = new Set<number>();
    for (const row of rows) {
      const g = row.game;
      if (!g) continue;
      const { homeId, visitorId } = this.extractHomeVisitorIds(g);
      if (typeof homeId === 'number') ids.add(homeId);
      if (typeof visitorId === 'number') ids.add(visitorId);
      const rec = g as Record<string, unknown>;
      const ht = rec['home_team'] as { id?: number } | undefined;
      const vt = rec['visitor_team'] as { id?: number } | undefined;
      if (typeof ht?.id === 'number') ids.add(ht.id);
      if (typeof vt?.id === 'number') ids.add(vt.id);
    }
    await Promise.all([...ids].map((tid) => this.resolveTeamFullName(tid)));
  }

  private async preloadTeamNamesFromGameList(games: GameEntry[]): Promise<void> {
    const ids = new Set<number>();
    for (const game of games) {
      if (typeof game.home_team?.id === 'number') ids.add(game.home_team.id);
      if (typeof game.visitor_team?.id === 'number') ids.add(game.visitor_team.id);
    }
    await Promise.all([...ids].map((tid) => this.resolveTeamFullName(tid)));
  }

  private buildGameScoreLineFromGame(
    game?: RawStatEntry['game'],
  ): string | undefined {
    const g = game as Record<string, unknown> | undefined;
    if (!g) return undefined;
    const hs = g['home_team_score'];
    const vs = g['visitor_team_score'];
    if (typeof hs !== 'number' || typeof vs !== 'number') return undefined;
    const ht = g['home_team'] as
      | { id?: number; abbreviation?: string; full_name?: string }
      | undefined;
    const vt = g['visitor_team'] as
      | { id?: number; abbreviation?: string; full_name?: string }
      | undefined;
    const { homeId, visitorId } = this.extractHomeVisitorIds(
      game as RawStatEntry['game'],
    );
    const hLabel = this.teamNameForScoreLine(
      ht && (ht.full_name || ht.abbreviation || ht.id) ? ht : { id: homeId },
    );
    const vLabel = this.teamNameForScoreLine(
      vt && (vt.full_name || vt.abbreviation || vt.id) ? vt : { id: visitorId },
    );
    return `${hLabel} ${hs}, ${vLabel} ${vs}`;
  }

  private async buildTeamHeadToHeadDualSeries(
    teamId: number,
    opponentTeamId: number,
    statKey: string,
    filters: Filters,
  ): Promise<{ pointsA: ChartPoint[]; pointsB: ChartPoint[] }> {
    const season = filters.season ?? new Date().getFullYear();
    const hasDateRange = Boolean(filters.startDate || filters.endDate);
    const games = await this.fetchAllGamesFromApi({
      team_ids: [teamId],
      ...(hasDateRange ? {} : { seasons: [season] }),
      ...(filters.startDate ? { start_date: filters.startDate } : {}),
      ...(filters.endDate ? { end_date: filters.endDate } : {}),
    });

    const h2h = games
      .filter((game) => {
        const h = game.home_team?.id;
        const v = game.visitor_team?.id;
        return (
          (h === teamId && v === opponentTeamId) ||
          (h === opponentTeamId && v === teamId)
        );
      })
      .sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')));

    await this.preloadTeamNamesFromGameList(h2h);

    if (!h2h.length) {
      return { pointsA: [], pointsB: [] };
    }

    if (statKey === 'pts') {
      const rawA: RawStatEntry[] = [];
      const rawB: RawStatEntry[] = [];
      for (const game of h2h) {
        if (!game.date || typeof game.id !== 'number') continue;
        const isHomeA = game.home_team?.id === teamId;
        const scoreA = isHomeA ? game.home_team_score : game.visitor_team_score;
        const scoreB = isHomeA ? game.visitor_team_score : game.home_team_score;
        const gPayload = {
          id: game.id,
          date: game.date,
          home_team: game.home_team,
          visitor_team: game.visitor_team,
          home_team_score: game.home_team_score,
          visitor_team_score: game.visitor_team_score,
        };
        rawA.push({
          date: this.normalizeIsoDate(game.date),
          pts: Number(scoreA ?? 0),
          game: gPayload,
          opponentName:
            (isHomeA ? game.visitor_team : game.home_team)?.full_name ?? undefined,
        } as RawStatEntry);
        rawB.push({
          date: this.normalizeIsoDate(game.date),
          pts: Number(scoreB ?? 0),
          game: gPayload,
          opponentName:
            (isHomeA ? game.home_team : game.visitor_team)?.full_name ?? undefined,
        } as RawStatEntry);
      }
      return {
        pointsA: this.mapDataToPoints(rawA, statKey, {
          entityId: teamId,
          isTeam: true,
        }),
        pointsB: this.mapDataToPoints(rawB, statKey, {
          entityId: opponentTeamId,
          isTeam: true,
        }),
      };
    }

    const gameIds = h2h
      .map((g) => g.id)
      .filter((id): id is number => typeof id === 'number');
    const chunkSize = 25;
    const allRows: RawStatEntry[] = [];
    for (let i = 0; i < gameIds.length; i += chunkSize) {
      const chunk = gameIds.slice(i, i + chunkSize);
      const rows = await this.fetchAllStatsFromApi({ game_ids: chunk });
      allRows.push(...rows);
    }

    type H2hAgg = {
      date: string;
      value: number;
      pts: number;
      fga: number;
      fta: number;
      oreb: number;
      tov: number;
    };
    const aggregateForTeam = (tid: number) => {
      const teamRows = allRows.filter(
        (row) => row.team?.id === tid || row.stats?.team_id === tid,
      );
      const aggregate = new Map<number, H2hAgg>();
      for (const row of teamRows) {
        const gid = typeof row.game?.id === 'number' ? row.game.id : undefined;
        const rawDate = row.game?.date ?? row.date;
        if (!gid || typeof rawDate !== 'string') continue;
        const numericValue = Number(row[statKey] ?? row.stats?.[statKey] ?? 0);
        if (Number.isNaN(numericValue)) continue;
        const existing = aggregate.get(gid) ?? {
          date: this.normalizeIsoDate(rawDate),
          value: 0,
          pts: 0,
          fga: 0,
          fta: 0,
          oreb: 0,
          tov: 0,
        };
        existing.value += numericValue;
        existing.pts += Number(row.pts ?? row.stats?.pts ?? 0);
        existing.fga += Number(row.fga ?? row.stats?.fga ?? 0);
        existing.fta += Number(row.fta ?? row.stats?.fta ?? 0);
        existing.oreb += Number(row.oreb ?? row.stats?.oreb ?? 0);
        existing.tov += Number(row.turnover ?? row.stats?.turnover ?? 0);
        aggregate.set(gid, existing);
      }
      return aggregate;
    };

    const aggA = aggregateForTeam(teamId);
    const aggB = aggregateForTeam(opponentTeamId);

    const rawA: RawStatEntry[] = [];
    const rawB: RawStatEntry[] = [];
    for (const game of h2h) {
      const gid = typeof game.id === 'number' ? game.id : undefined;
      if (!gid || !game.date) continue;
      const iso = this.normalizeIsoDate(game.date);
      const gPayload = {
        id: game.id,
        date: game.date,
        home_team: game.home_team,
        visitor_team: game.visitor_team,
        home_team_score: game.home_team_score,
        visitor_team_score: game.visitor_team_score,
      };
      const aEntry = aggA.get(gid);
      const bEntry = aggB.get(gid);
      if (!aEntry || !bEntry) continue;
      const possA = (() => {
        let p = aEntry.fga + 0.44 * aEntry.fta - aEntry.oreb + aEntry.tov;
        if (!Number.isFinite(p) || p <= 0) p = aEntry.fga + 0.44 * aEntry.fta;
        return Number.isFinite(p) && p > 0 ? p : undefined;
      })();
      const possB = (() => {
        let p = bEntry.fga + 0.44 * bEntry.fta - bEntry.oreb + bEntry.tov;
        if (!Number.isFinite(p) || p <= 0) p = bEntry.fga + 0.44 * bEntry.fta;
        return Number.isFinite(p) && p > 0 ? p : undefined;
      })();
      const isHomeA = game.home_team?.id === teamId;
      rawA.push({
        date: iso,
        game: gPayload,
        [statKey]: aEntry.value,
        pts: aEntry.pts,
        fga: aEntry.fga,
        fta: aEntry.fta,
        oreb: aEntry.oreb,
        turnover: aEntry.tov,
        ...(typeof possA === 'number' ? { gamePossessions: possA } : {}),
        opponentName:
          (isHomeA ? game.visitor_team : game.home_team)?.full_name ?? undefined,
      } as RawStatEntry);
      rawB.push({
        date: iso,
        game: gPayload,
        [statKey]: bEntry.value,
        pts: bEntry.pts,
        fga: bEntry.fga,
        fta: bEntry.fta,
        oreb: bEntry.oreb,
        turnover: bEntry.tov,
        ...(typeof possB === 'number' ? { gamePossessions: possB } : {}),
        opponentName:
          (game.home_team?.id === opponentTeamId
            ? game.visitor_team
            : game.home_team
          )?.full_name ?? undefined,
      } as RawStatEntry);
    }

    return {
      pointsA: this.mapDataToPoints(rawA, statKey, {
        entityId: teamId,
        isTeam: true,
      }),
      pointsB: this.mapDataToPoints(rawB, statKey, {
        entityId: opponentTeamId,
        isTeam: true,
      }),
    };
  }

  private async hydrateOpponentNames(points: ChartPoint[]): Promise<void> {
    const pending = new Map<number, ChartPoint[]>();
    for (const p of points) {
      if (p.opponentName?.trim()) continue;
      const tid = p.opponentTeamId;
      if (typeof tid !== 'number') continue;
      const list = pending.get(tid) ?? [];
      list.push(p);
      pending.set(tid, list);
    }
    await Promise.all(
      [...pending.keys()].map(async (teamId) => {
        const name = await this.resolveTeamFullName(teamId);
        if (!name) return;
        for (const p of pending.get(teamId) ?? []) {
          if (!p.opponentName) p.opponentName = name;
        }
      }),
    );
    for (const p of points) {
      delete p.opponentTeamId;
    }
  }

  private pickNumeric(entry: RawStatEntry, key: string): number {
    const raw = (entry as Record<string, unknown>)[key] ?? entry.stats?.[key];
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }

  private estimateGamePossessions(entry: RawStatEntry): number | undefined {
    const fga = this.pickNumeric(entry, 'fga');
    if (!Number.isFinite(fga) || fga < 0) return undefined;
    const fta = this.pickNumeric(entry, 'fta');
    const oreb = this.pickNumeric(entry, 'oreb');
    const tov = this.pickNumeric(entry, 'turnover');
    const ftaN = Number.isFinite(fta) && fta >= 0 ? fta : 0;
    const orebN = Number.isFinite(oreb) ? oreb : 0;
    const tovN = Number.isFinite(tov) ? tov : 0;
    let poss = fga + 0.44 * ftaN - orebN + tovN;
    if (!Number.isFinite(poss) || poss <= 0) {
      poss = fga + 0.44 * ftaN;
    }
    return poss > 0 ? poss : undefined;
  }

  private computeTrueShootingPct(entry: RawStatEntry): number | undefined {
    const pts = this.pickNumeric(entry, 'pts');
    const fga = this.pickNumeric(entry, 'fga');
    const fta = this.pickNumeric(entry, 'fta');
    if (!Number.isFinite(pts) || !Number.isFinite(fga)) return undefined;
    const ftaN = Number.isFinite(fta) && fta >= 0 ? fta : 0;
    const denom = 2 * (fga + 0.44 * ftaN);
    if (!Number.isFinite(denom) || denom <= 0) return undefined;
    const ts = (pts / denom) * 100;
    return Number.isFinite(ts) ? ts : undefined;
  }

  private mapDataToPoints(
    data: RawStatEntry[],
    statKey: string,
    context: { entityId: number; isTeam: boolean },
  ): ChartPoint[] {
    const mappedPoints = data
      .map((entry, i) => {
        const rawGameDate = entry.game?.date ?? entry.date;
        const isoDate =
          typeof rawGameDate === 'string'
            ? this.normalizeIsoDate(rawGameDate)
            : undefined;
        let label = `G${i + 1}`;
        if (isoDate) {
          label = this.getShortLabelFromIso(isoDate);
        }

        const rawStat =
          (entry as Record<string, unknown>)[statKey] ?? entry.stats?.[statKey];
        let numericStat: number;
        if (rawStat === null || rawStat === undefined || rawStat === '') {
          numericStat = NaN;
        } else {
          numericStat = Number(rawStat);
        }

        const minutes = this.parseMinutesPlayed(entry);
        let value: number | null;
        if (context.isTeam) {
          value = Number.isFinite(numericStat) ? numericStat : null;
        } else {
          if (minutes !== undefined && minutes <= 0) {
            value = null;
          } else if (!Number.isFinite(numericStat)) {
            value = null;
          } else {
            value = numericStat;
          }
        }

        const { opponentName, opponentTeamId } = this.resolveOpponentFromEntry(
          entry,
          context.entityId,
          context.isTeam,
        );
        const gameScoreLine = this.buildGameScoreLineFromGame(entry.game);
        const gamePossessions =
          typeof (entry as Record<string, unknown>).gamePossessions === 'number'
            ? ((entry as Record<string, unknown>).gamePossessions as number)
            : this.estimateGamePossessions(entry);
        const trueShootingPct = this.computeTrueShootingPct(entry);
        const chartAbsence =
          !context.isTeam &&
          value === null &&
          minutes !== undefined &&
          minutes <= 0
            ? this.classifyPlayerAbsence(entry)
            : undefined;
        return {
          label,
          value,
          isoDate,
          opponentName,
          opponentTeamId,
          ...(gameScoreLine ? { gameScoreLine } : {}),
          ...(typeof gamePossessions === 'number' &&
          Number.isFinite(gamePossessions) &&
          gamePossessions > 0
            ? { gamePossessions }
            : {}),
          ...(typeof trueShootingPct === 'number' &&
          Number.isFinite(trueShootingPct)
            ? { trueShootingPct }
            : {}),
          ...(chartAbsence ? { chartAbsence } : {}),
        };
      })
      .filter(
        (p) =>
          (typeof p.value === 'number' && Number.isFinite(p.value)) ||
          (p.value === null && Boolean(p.isoDate)),
      );

    const hasAnyDate = mappedPoints.some((point) => Boolean(point.isoDate));
    if (hasAnyDate) {
      mappedPoints.sort((a, b) => {
        if (!a.isoDate) return -1;
        if (!b.isoDate) return 1;
        return a.isoDate.localeCompare(b.isoDate);
      });
      for (const p of mappedPoints) {
        if (p.isoDate) {
          p.label = this.getShortLabelFromIso(p.isoDate);
        }
      }
    }

    return mappedPoints;
  }

  private async resolveEntityName(id: number, isTeam: boolean) {
    const res = isTeam
      ? await this.api.nba.getTeam(id)
      : await this.api.nba.getPlayer(id);
    const data = res.data as unknown as Record<string, unknown>;
    if (isTeam) {
      const fullName = data.full_name;
      return typeof fullName === 'string' ? fullName : `Team ${id}`;
    }
    const firstName = data.first_name;
    const lastName = data.last_name;
    if (typeof firstName === 'string' && typeof lastName === 'string') {
      return `${firstName} ${lastName}`;
    }
    return `Player ${id}`;
  }

  private throwApiError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as { status?: unknown }).status === 'number'
    ) {
      const status = (error as { status: number }).status;

      if (status === 401) {
        throw new HttpException(
          'BallDontLie API unauthorized. Update BALLDONTLIE_API_KEY in backend .env with a valid key.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (status === 429) {
        throw new HttpException(
          'BallDontLie API rate limit reached. Wait and retry, or reduce request frequency.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        'BallDontLie API request failed.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    throw new HttpException(
      'Unexpected visualization error while fetching API data.',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
