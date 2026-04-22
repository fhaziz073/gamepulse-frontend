import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatEntity } from './stat.entity';
import { VisualizationController } from './visualization.controller';
import { VisualizationService } from './visualization.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'nba_app',
      entities: [StatEntity],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      retryAttempts: 10,
      retryDelay: 3000,
    }),
    TypeOrmModule.forFeature([StatEntity]),
  ],
  controllers: [VisualizationController],
  providers: [VisualizationService],
})
export class AppModule {}
