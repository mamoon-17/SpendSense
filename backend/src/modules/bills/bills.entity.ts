import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Category } from '../categories/categories.entity';
import { User } from '../users/users.entity';
import { BillParticipant } from './bill-participant.entity';

export enum BillSplitType {
  EQUAL = 'equal',
  PERCENTAGE = 'percentage',
  MANUAL = 'manual',
}

export enum BillStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  COMPLETED = 'completed',
}

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  total_amount: string;

  @Column({ type: 'enum', enum: BillSplitType, nullable: false })
  split_type: BillSplitType;

  @Column({ type: 'date', nullable: false })
  due_date: string;

  @Column({ type: 'enum', enum: BillStatus, default: BillStatus.PENDING })
  status: BillStatus;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @ManyToOne(() => Category, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'category' })
  category: Category;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @ManyToMany(() => User, (user) => user.bills_participating, { cascade: true })
  @JoinTable({
    name: 'bill_participants_junction',
    joinColumn: { name: 'bill_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  participants: User[];

  @OneToMany(() => BillParticipant, (billParticipant) => billParticipant.bill)
  participant_payments: BillParticipant[];
}
