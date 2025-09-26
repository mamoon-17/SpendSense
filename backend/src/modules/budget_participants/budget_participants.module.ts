import { Module } from '@nestjs/common';
import { BudgetParticipantsController } from './budget_participants.controller';
import { BudgetParticipantsService } from './budget_participants.service';

@Module({
  controllers: [BudgetParticipantsController],
  providers: [BudgetParticipantsService]
})
export class BudgetParticipantsModule {}
