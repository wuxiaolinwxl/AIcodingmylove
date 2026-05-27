import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('messages')
@Index(['coupleId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  coupleId: number;

  @Column({ type: 'int' })
  senderId: number;

  @Column({ type: 'enum', enum: ['text', 'image', 'file'] })
  msgType: 'text' | 'image' | 'file';

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  ossKey: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ type: 'datetime', nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
