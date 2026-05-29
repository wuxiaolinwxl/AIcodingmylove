import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('game_plays')
@Index(['coupleId', 'createdAt'])
export class GamePlay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  coupleId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 32 })
  game: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  result: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
