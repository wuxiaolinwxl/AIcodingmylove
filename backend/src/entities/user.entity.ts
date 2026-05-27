import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 128, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  nickname: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  avatarUrl: string;

  @Column({ type: 'int', nullable: true })
  coupleId: number;

  @CreateDateColumn()
  createdAt: Date;
}
