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
import { ExpenseAnalyticsService } from './expense-analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, Category, Budget]),
    UsersModule,
    AuthModule,
    forwardRef(() => BudgetsModule),
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpenseAnalyticsService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
