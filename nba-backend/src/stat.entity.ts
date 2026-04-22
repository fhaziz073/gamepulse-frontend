import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('stats')
export class StatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  entity_id: number;

  @Column({ nullable: true })
  opponent_id: number;

  @Column({ nullable: true })
  game_result: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'float', nullable: true })
  pts: number;

  @Column({ type: 'float', nullable: true })
  ast: number;

  @Column({ type: 'float', nullable: true })
  reb: number;
}
