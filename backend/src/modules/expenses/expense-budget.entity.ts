import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Expense } from './expenses.entity';
import { Budget } from '../budgets/budgets.entity';

@Entity('expense_budgets')
@Unique(['expense_id', 'budget_id']) // Prevent linking same expense to same budget twice
export class ExpenseBudget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'expense_id' })
  expense_id: string;

  @Column('uuid', { name: 'budget_id' })
  budget_id: string;

  @Column('numeric', { precision: 12, scale: 2 })
  amount: string; // Amount deducted from this budget

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Expense, (expense) => expense.budgetLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;

  @ManyToOne(() => Budget, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;
}
