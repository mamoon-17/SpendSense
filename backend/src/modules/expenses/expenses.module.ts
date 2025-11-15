import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { Expense } from './expenses.entity';
import { Category } from '../categories/categories.entity';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from '../auth/auth.guard';
import { BudgetsModule } from '../budgets/budgets.module';
import { Budget } from '../budgets/budgets.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, Category, Budget]),
    UsersModule,
    forwardRef(() => BudgetsModule),
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService, AuthGuard],
  exports: [ExpensesService],
})
export class ExpensesModule {}
