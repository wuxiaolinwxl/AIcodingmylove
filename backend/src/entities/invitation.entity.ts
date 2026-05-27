import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  inviterId: number;

  @Column({ type: 'varchar', length: 32, unique: true })
  code: string;

  @Column({ type: 'int', nullable: true })
  usedBy: number;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'enum', enum: ['pending', 'used', 'expired'], default: 'pending' })
  status: 'pending' | 'used' | 'expired';

  @CreateDateColumn()
  createdAt: Date;
}
