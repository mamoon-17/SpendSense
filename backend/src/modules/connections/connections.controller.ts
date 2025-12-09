import {
  Body,
  Controller,
  Patch,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto } from './dtos/createConnection.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../users/users.entity';
import { ConversationsService } from '../conversations/conversations.service';
import { ConversationType } from '../conversations/conversations.entity';

@Controller('connections')
@UseGuards(AuthGuard)
export class ConnectionsController {
  constructor(
    private readonly connectionService: ConnectionsService,
    @Inject(ConversationsService)
    private readonly conversationsService: ConversationsService,
  ) {}

  @Post()
  createConnection(
    @Body() connection: CreateConnectionDto,
    @CurrentUser() user: User,
  ) {
    // Set the requester_id to the current authenticated user
    connection.requester_id = user.id;
    return this.connectionService.createConnection(connection);
  }

  @Patch()
  async acceptRequest(@Body() body: any, @CurrentUser() user: User) {
    const connection = await this.connectionService.acceptRequest(
      body.connection_id,
      user.id,
    );

    // Create a direct conversation between the connected users
    try {
      await this.conversationsService.createConversation(user.id, {
        participant_ids: [connection.requester.id],
        type: ConversationType.Direct,
        name: `Chat with ${connection.requester.name || connection.requester.username}`,
      });
    } catch (error) {
      // If conversation already exists, that's fine - just continue
      console.log('Conversation may already exist:', error.message);
    }

    return connection;
  }

  @Get()
  getConnections(@CurrentUser() user: User) {
    return this.connectionService.getUserConnections(user.id);
  }

  @Delete(':id')
  async removeConnection(@Param('id') id: string, @CurrentUser() user: User) {
    return this.connectionService.removeConnection(id, user.id);
  }
}
