import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingsGoalsController } from './savings_goals.controller';
import { SavingsGoalsService } from './savings_goals.service';
import { SavingsGoal } from './savings_goals.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavingsGoal]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [SavingsGoalsController],
  providers: [SavingsGoalsService],
  exports: [SavingsGoalsService],
})
export class SavingsGoalsModule {}
