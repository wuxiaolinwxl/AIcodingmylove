import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('messages')
@Index(['coupleId', 'createdAt'])
@Index(['coupleId', 'id'])
@Index(['coupleId', 'senderId', 'readAt'])
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  coupleId: number;

  @Column({ type: 'int' })
  senderId: number;

  @Column({ type: 'enum', enum: ['text', 'image', 'file', 'voice'] })
  msgType: 'text' | 'image' | 'file' | 'voice';

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  ossKey: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @Column({ type: 'int', nullable: true })
  replyToId: number;

  @Column({ type: 'int', nullable: true })
  replyToSenderId: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  replyToSnippet: string;

  @Column({ type: 'datetime', nullable: true })
  readAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
