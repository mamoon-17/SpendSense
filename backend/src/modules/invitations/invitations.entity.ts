import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Budget } from '../budgets/budgets.entity';
import { Bill } from '../bills/bills.entity';
import { SavingsGoal } from '../savings_goals/savings_goals.entity';

export enum InvitationStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Expired = 'expired',
  Cancelled = 'cancelled',
}

export enum InvitationType {
  Budget = 'budget',
  Bill = 'bill',
}

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Budget, { nullable: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget_id: Budget | null;

  @ManyToOne(() => Bill, { nullable: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  bill_id: Bill | null;

  @ManyToOne(() => SavingsGoal, { nullable: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'savinggoal_id' })
  savinggoal_id: SavingsGoal | null;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  token: string;

  @Column({ type: 'text', default: InvitationStatus.Pending })
  status: InvitationStatus;

  // Timestamp when invitation was sent
  @Column({ type: 'datetime', nullable: false })
  sent_at: Date;

  // Expiration timestamp
  @Column({ type: 'datetime', nullable: false })
  expires_at: Date;

  // Timestamp when the invitation was accepted
  @Column({ type: 'datetime', nullable: true })
  accepted_at: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'sent_by' })
  sender: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'sent_to' })
  reveicer: User;
}
