import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { Bill } from './bills.entity';
import { BillParticipant } from './bill-participant.entity';
import { User } from '../users/users.entity';
import { Category } from '../categories/categories.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillAnalyticsService } from './bill-analytics.service';
import { BillPaymentService } from './bill-payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bill, BillParticipant, User, Category]),
    UsersModule,
    AuthModule,
    NotificationsModule,
  ],
  controllers: [BillsController],
  providers: [BillsService, BillAnalyticsService, BillPaymentService],
  exports: [BillsService],
})
export class BillsModule {}
