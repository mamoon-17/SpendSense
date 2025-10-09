import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { MessageHistoryService } from './message-history.service';
import { CreateMessageDto } from './dtos/create-message.dto';
import { GetMessagesDto } from './dtos/get-messages.dto';
import { MessageStatus } from './message-history.entity';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/users.entity';

@Controller('messages')
@UseGuards(AuthGuard)
export class MessageHistoryController {
  constructor(private readonly messageHistoryService: MessageHistoryService) {}

  @Post()
  async createMessage(
    @CurrentUser() user: User,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messageHistoryService.createMessage(user.id, createMessageDto);
  }

  @Get('conversation/:conversationId')
  async getMessageHistory(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
    @Query() getMessagesDto: GetMessagesDto,
  ) {
    return this.messageHistoryService.getMessageHistory(
      conversationId,
      user.id,
      getMessagesDto,
    );
  }

  @Patch(':id/status')
  async updateMessageStatus(
    @CurrentUser() user: User,
    @Param('id') messageId: string,
    @Body('status') status: MessageStatus,
  ) {
    return this.messageHistoryService.updateMessageStatus(
      messageId,
      status,
      user.id,
    );
  }

  @Patch('conversation/:conversationId/mark-read')
  async markMessagesAsRead(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
  ) {
    await this.messageHistoryService.markMessagesAsRead(
      conversationId,
      user.id,
    );
    return { success: true };
  }
}
