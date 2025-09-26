import { Module } from '@nestjs/common';
import { MessageHistoryController } from './message-history.controller';
import { MessageHistoryService } from './message-history.service';

@Module({
  controllers: [MessageHistoryController],
  providers: [MessageHistoryService]
})
export class MessageHistoryModule {}
