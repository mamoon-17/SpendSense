import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatFacade } from './chat.facade';
import { SocketAuthService } from './socket-auth.service';
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
  providers: [ChatGateway, ChatService, ChatFacade, SocketAuthService],
  exports: [ChatGateway, ChatService],
})
export class ChatModule {}
