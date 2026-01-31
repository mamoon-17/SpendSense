import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/users.entity';
import { ExpenseBudget } from './expense-budget.entity';
import { ExpenseSavingsGoal } from './expense-savings-goal.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column('numeric', { precision: 12, scale: 2, nullable: false })
  amount: string;

  @Column('uuid', { name: 'category_id', nullable: true })
  category_id: string | null;

  @Column({ type: 'timestamp', nullable: false })
  date: Date;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[] | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  payment_method: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: false })
  ai_categorized: boolean;

  @Column('uuid', { name: 'user_id', nullable: false })
  user_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Many-to-many with budgets (one expense can link to multiple budgets, but not same budget twice)
  @OneToMany(() => ExpenseBudget, (link) => link.expense)
  budgetLinks: ExpenseBudget[];

  // Many-to-many with savings goals (one expense can link to multiple goals, but not same goal twice)
  @OneToMany(() => ExpenseSavingsGoal, (link) => link.expense)
  savingsGoalLinks: ExpenseSavingsGoal[];
}
