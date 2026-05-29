import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('anniversary_notes')
@Index(['anniversaryId', 'userId'])
export class AnniversaryNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  anniversaryId: number;

  @Column({ type: 'int' })
  coupleId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
