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

@Module({
  imports: [
    TypeOrmModule.forFeature([Bill, BillParticipant, User, Category]),
    UsersModule,
  ],
  controllers: [BillsController],
  providers: [BillsService, AuthGuard],
  exports: [BillsService],
})
export class BillsModule {}
