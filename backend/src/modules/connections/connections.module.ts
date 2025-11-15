import { Module, forwardRef } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from './connections.entity';
import { ConversationsModule } from '../conversations/conversations.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  imports: [
    TypeOrmModule.forFeature([Connection]),
    forwardRef(() => ConversationsModule),
    NotificationsModule,
  ],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
