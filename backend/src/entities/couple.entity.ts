import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('couples')
@Index(['userAId'])
@Index(['userBId'])
export class Couple {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userAId: number;

  @Column({ type: 'int', unique: true })
  userBId: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  spaceName: string;

  @Column({ type: 'date', nullable: true })
  anniversaryDate: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  loveScore: string;

  @CreateDateColumn()
  createdAt: Date;
}
