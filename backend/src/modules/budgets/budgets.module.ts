import { Module, forwardRef } from '@nestjs/common';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from './budgets.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { BudgetNotificationService } from './budget-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget]),
    NotificationsModule,
    UsersModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetNotificationService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
