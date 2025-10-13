import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

export enum SavingsGoalPriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum SavingsGoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  BEHIND = 'behind',
  ON_TRACK = 'on_track',
  OVERDUE = 'overdue',
}

@Entity('savings_goals')
export class SavingsGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('numeric', { precision: 12, scale: 2, nullable: false })
  target_amount: string;

  @Column('numeric', { precision: 12, scale: 2, default: 0 })
  current_amount: string;

  @Column({ type: 'date', nullable: false })
  target_date: string;

  @Column('uuid', { name: 'category_id', nullable: false })
  category_id: string;

  @Column({
    type: 'enum',
    enum: SavingsGoalPriority,
    enumName: 'savings_goal_priority',
    nullable: false,
  })
  priority: SavingsGoalPriority;

  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  monthly_target: string | null;

  @Column({ type: 'boolean', default: false })
  auto_save: boolean;

  @Column({
    type: 'enum',
    enum: SavingsGoalStatus,
    default: SavingsGoalStatus.ACTIVE,
  })
  status: SavingsGoalStatus;

  @Column('uuid', { name: 'user_id', nullable: false })
  user_id: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
