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

  @Column({type: 'enum', enum: InvitationStatus, enumName: 'invitation_status', default: InvitationStatus.Pending,})
  status: InvitationStatus;

  // Timestamp when invitation was sent
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sent_at: Date;

  // Expiration timestamp
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => "CURRENT_TIMESTAMP + INTERVAL '7 days'",
  })
  expires_at: Date;

  // Timestamp when the invitation was accepted
  @Column({ type: 'timestamp', nullable: true })
  accepted_at: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'sent_by' })
  sender: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'sent_to' })
  reveicer: User;
}
