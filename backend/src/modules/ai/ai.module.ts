import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { MessageHistoryModule } from '../message-history/message-history.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { SavingsGoalsModule } from '../savings_goals/savings_goals.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ConnectionsModule } from '../connections/connections.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MessageHistoryModule,
    ConversationsModule,
    ExpensesModule,
    BudgetsModule,
    SavingsGoalsModule,
    ConnectionsModule,
    CategoriesModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
