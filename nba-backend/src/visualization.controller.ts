import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { VisualizationService } from './visualization.service';

type FilterParams = {
  dataSource: 'API' | 'DB';
  season?: number;
  isTeam?: boolean;
  isAverages?: boolean;
  startDate?: string;
  endDate?: string;
  opponentTeamId?: number;
};

type VisualizationBody = {
  entityIds: number[];
  statKey: string;
  filterParams: FilterParams;
  threshold?: number;
};

@Controller('visualization')
export class VisualizationController {
  constructor(private readonly vizService: VisualizationService) {}

  @Post()
  async getVisualization(@Body() body: VisualizationBody) {
    return this.vizService.generateUniversalVisualization(
      body.entityIds,
      body.statKey,
      body.filterParams,
      body.threshold,
    );
  }

  @Get('search')
  async search(@Query('q') query: string, @Query('type') type: string) {
    return this.vizService.searchEntities(query, type);
  }
}
