import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Expense } from './expenses.entity';
import { SavingsGoal } from '../savings_goals/savings_goals.entity';

@Entity('expense_savings_goals')
@Unique(['expense_id', 'savings_goal_id']) // Prevent linking same expense to same savings goal twice
export class ExpenseSavingsGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'expense_id' })
  expense_id: string;

  @Column('uuid', { name: 'savings_goal_id' })
  savings_goal_id: string;

  @Column('numeric', { precision: 12, scale: 2 })
  amount: string; // Amount withdrawn from this savings goal

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Expense, (expense) => expense.savingsGoalLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;

  @ManyToOne(() => SavingsGoal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'savings_goal_id' })
  savingsGoal: SavingsGoal;
}
