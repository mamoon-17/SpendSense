import { Module, forwardRef } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from './connections.entity';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  imports: [
    TypeOrmModule.forFeature([Connection]),
    forwardRef(() => ConversationsModule),
  ],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
