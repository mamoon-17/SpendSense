import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { Expense } from './expenses.entity';
import { Category } from '../categories/categories.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { Budget } from '../budgets/budgets.entity';
import { SavingsGoal } from '../savings_goals/savings_goals.entity';
import { ExpenseAnalyticsService } from './expense-analytics.service';
import { SavingsGoalsModule } from '../savings_goals/savings_goals.module';
import { ExpenseBudget } from './expense-budget.entity';
import { ExpenseSavingsGoal } from './expense-savings-goal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Expense,
      Category,
      Budget,
      SavingsGoal,
      ExpenseBudget,
      ExpenseSavingsGoal,
    ]),
    UsersModule,
    AuthModule,
    forwardRef(() => BudgetsModule),
    forwardRef(() => SavingsGoalsModule),
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpenseAnalyticsService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
