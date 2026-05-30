import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type AnniversaryKind = 'birthday_a' | 'birthday_b' | 'together' | 'festival' | 'custom';
export type AnniversaryRecurrence = 'none' | 'yearly_solar' | 'yearly_lunar' | 'monthly' | 'weekly';

@Entity('anniversaries')
@Index(['coupleId'])
@Index(['coupleId', 'kind'])
export class Anniversary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  coupleId: number;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'varchar', length: 32, default: 'custom' })
  kind: AnniversaryKind;

  @Column({ type: 'date', nullable: true })
  solarDate: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  lunarDate: string | null;

  @Column({ type: 'boolean', default: false })
  lunarIsLeap: boolean;

  @Column({ type: 'varchar', length: 32, default: 'yearly_solar' })
  recurrence: AnniversaryRecurrence;

  @Column({ type: 'int', nullable: true })
  recurrenceDay: number | null;

  @Column({ type: 'boolean', default: true })
  remindEnabled: boolean;

  @Column({ type: 'int', default: 1 })
  remindDaysBefore: number;

  @Column({ type: 'tinyint', default: 0 })
  isPreset: number;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
