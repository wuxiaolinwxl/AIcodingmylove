import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('bucket_items')
@Index(['coupleId'])
@Index(['category'])
export class BucketItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  coupleId: number | null;

  @Column({ type: 'varchar', length: 32 })
  category: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'tinyint', default: 0 })
  isCustom: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
