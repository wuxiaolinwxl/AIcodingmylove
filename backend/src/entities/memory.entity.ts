import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('memories')
@Index(['coupleId', 'memoryDate'])
@Index(['coupleId', 'type'])
export class Memory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  coupleId: number;

  @Column({ type: 'int' })
  uploaderId: number;

  @Column({ type: 'enum', enum: ['photo', 'video', 'song', 'text', 'file'] })
  type: 'photo' | 'video' | 'song' | 'text' | 'file';

  @Column({ type: 'varchar', length: 200, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  ossKey: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  ossUrl: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  coverUrl: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ type: 'datetime' })
  memoryDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}
