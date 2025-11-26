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
import { ExpenseAnalyticsService } from './expense-analytics.service';
import { TokenService } from 'src/common/services/token.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, Category, Budget]),
    UsersModule,
    ConfigModule,
    forwardRef(() => BudgetsModule),
  ],
  controllers: [ExpensesController],
  providers: [
    ExpensesService,
    ExpenseAnalyticsService,
    AuthGuard,
    {
      provide: 'ITokenService',
      useClass: TokenService,
    },
  ],
  exports: [ExpensesService],
})
export class ExpensesModule {}
