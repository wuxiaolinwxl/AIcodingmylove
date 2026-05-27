import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('couples')
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

  @CreateDateColumn()
  createdAt: Date;
}
