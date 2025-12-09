import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Bill } from './bills.entity';
import { User } from '../users/users.entity';

@Entity('bill_participants')
export class BillParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Bill, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  participant: User;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    nullable: false,
  })
  amount_owed: string;

  @Column({ type: 'boolean', default: false })
  is_paid: boolean;

  @Column({ type: 'datetime', nullable: true })
  paid_at: Date;
}
