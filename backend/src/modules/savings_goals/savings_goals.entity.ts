import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { User } from '../users/users.entity';

export enum SavingsGoalPriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
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

  @Column('uuid', { name: 'user_id', nullable: false })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(() => User, (user) => user.savings_goals_participating, { cascade: true })
  @JoinTable({
    name: 'savings_goal_participants',
    joinColumn: { name: 'savings_goal_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' }
  })
  participants: User[];
}
