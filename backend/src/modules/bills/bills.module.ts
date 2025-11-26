import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { Bill } from './bills.entity';
import { BillParticipant } from './bill-participant.entity';
import { User } from '../users/users.entity';
import { Category } from '../categories/categories.entity';
import { AuthGuard } from '../auth/auth.guard';
import { UsersModule } from '../users/users.module';
import { BillAnalyticsService } from './bill-analytics.service';
import { BillPaymentService } from './bill-payment.service';
import { TokenService } from 'src/common/services/token.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bill, BillParticipant, User, Category]),
    UsersModule,
    ConfigModule,
  ],
  controllers: [BillsController],
  providers: [
    BillsService,
    BillAnalyticsService,
    BillPaymentService,
    AuthGuard,
    {
      provide: 'ITokenService',
      useClass: TokenService,
    },
  ],
  exports: [BillsService],
})
export class BillsModule {}
