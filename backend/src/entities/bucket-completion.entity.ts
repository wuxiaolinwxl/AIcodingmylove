import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique } from 'typeorm';

@Entity('bucket_completions')
@Unique(['coupleId', 'itemId', 'completedBy'])
@Index(['coupleId'])
@Index(['coupleId', 'itemId'])
export class BucketCompletion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  coupleId: number;

  @Column({ type: 'int' })
  itemId: number;

  @Column({ type: 'int' })
  completedBy: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note: string | null;

  @CreateDateColumn()
  completedAt: Date;
}
