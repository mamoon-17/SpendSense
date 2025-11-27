import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingsGoalsController } from './savings_goals.controller';
import { SavingsGoalsService } from './savings_goals.service';
import { SavingsGoal } from './savings_goals.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SavingsGoalCalculator } from './savings-goal-calculator.service';
import { SavingsGoalNotificationService } from './savings-goal-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavingsGoal]),
    UsersModule,
    AuthModule,
    NotificationsModule,
  ],
  controllers: [SavingsGoalsController],
  providers: [
    SavingsGoalsService,
    SavingsGoalCalculator,
    SavingsGoalNotificationService,
  ],
  exports: [SavingsGoalsService],
})
export class SavingsGoalsModule {}
