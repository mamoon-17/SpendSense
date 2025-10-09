import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessageHistoryModule } from '../message-history/message-history.module';
import { ConnectionsModule } from '../connections/connections.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => ConversationsModule),
    forwardRef(() => MessageHistoryModule),
    forwardRef(() => ConnectionsModule),
    AuthModule,
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
