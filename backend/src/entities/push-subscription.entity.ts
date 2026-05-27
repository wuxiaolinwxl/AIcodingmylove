import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('push_subscriptions')
@Index(['userId'])
export class PushSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int', nullable: true })
  coupleId: number;

  @Column({ type: 'varchar', length: 512, unique: true })
  endpoint: string;

  @Column({ type: 'varchar', length: 256 })
  p256dh: string;

  @Column({ type: 'varchar', length: 128 })
  auth: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
