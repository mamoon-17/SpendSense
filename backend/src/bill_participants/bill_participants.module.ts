import { Module } from '@nestjs/common';
import { BillParticipantsController } from './bill_participants.controller';
import { BillParticipantsService } from './bill_participants.service';

@Module({
  controllers: [BillParticipantsController],
  providers: [BillParticipantsService]
})
export class BillParticipantsModule {}
