import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageHistoryController } from './message-history.controller';
import { MessageHistoryService } from './message-history.service';
import { Message } from './message-history.entity';
import { ConnectionsModule } from '../connections/connections.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    ConnectionsModule,
    AuthModule,
    forwardRef(() => ConversationsModule),
  ],
  controllers: [MessageHistoryController],
  providers: [MessageHistoryService],
  exports: [MessageHistoryService],
})
export class MessageHistoryModule {}
