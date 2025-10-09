import { Injectable, Logger } from '@nestjs/common';
import { MessageHistoryService } from '../message-history/message-history.service';
import { ConversationsService } from '../conversations/conversations.service';
import { CreateMessageDto } from '../message-history/dtos/create-message.dto';
import { GetMessagesDto } from '../message-history/dtos/get-messages.dto';
import { MessageStatus } from '../message-history/message-history.entity';
import { Server, Socket } from 'socket.io';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly messageHistoryService: MessageHistoryService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async sendMessage(
    userId: string,
    data: CreateMessageDto,
    client: Socket,
    server: Server,
  ) {
    try {
      const message = await this.messageHistoryService.createMessage(
        userId,
        data,
      );
      server.to(data.conversation_id).emit('new_message', {
        id: message.id,
        content: message.content,
        sender: message.sender,
        conversation_id: data.conversation_id,
        sent_at: message.sent_at,
        status: message.status,
      });
      client.emit('message_sent', { messageId: message.id });
    } catch (error: any) {
      this.logger.error(`Failed to send message: ${error.message}`);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  async joinConversation(
    userId: string,
    conversationId: string,
    client: Socket,
    server: Server,
  ) {
    try {
      client.join(conversationId);
      await this.messageHistoryService.markMessagesAsRead(
        conversationId,
        userId,
      );
      const userEvent = this.formatUserEvent(userId, conversationId, 'joined');
      server.to(conversationId).emit('user_joined', userEvent);
      client.emit('joined_conversation', { conversationId });
    } catch (error: any) {
      this.logger.error(`Failed to join conversation: ${error.message}`);
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  leaveConversation(
    userId: string,
    conversationId: string,
    client: Socket,
    server: Server,
  ) {
    client.leave(conversationId);
    const userEvent = this.formatUserEvent(userId, conversationId, 'left');
    server.to(conversationId).emit('user_left', userEvent);
  }
  handleTyping(
    userId: string,
    data: { conversationId: string; isTyping: boolean },
    client: Socket,
    server: Server,
  ) {
    const typingEvent = this.formatTypingEvent(
      userId,
      data.conversationId,
      data.isTyping,
    );
    server.to(data.conversationId).emit('user_typing', typingEvent);
  }

  handleTypingStart(
    userId: string,
    data: { conversationId: string },
    client: Socket,
    server: Server,
  ) {
    const typingEvent = this.formatTypingEvent(
      userId,
      data.conversationId,
      true,
    );
    server.to(data.conversationId).emit('user_typing', typingEvent);
  }

  handleTypingStop(
    userId: string,
    data: { conversationId: string },
    client: Socket,
    server: Server,
  ) {
    const typingEvent = this.formatTypingEvent(
      userId,
      data.conversationId,
      false,
    );
    server.to(data.conversationId).emit('user_typing', typingEvent);
  }

  async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
    userId: string,
    client: Socket,
  ) {
    try {
      await this.messageHistoryService.updateMessageStatus(
        messageId,
        status,
        userId,
      );
    } catch (error: any) {
      this.logger.error(`Failed to update message status: ${error.message}`);
      client.emit('error', { message: 'Failed to update message status' });
    }
  }

  async getUserConversations(userId: string, client: Socket) {
    try {
      const conversations =
        await this.conversationsService.getActiveConversationsForUser(userId);
      client.emit('conversations_list', { conversations });
    } catch (error: any) {
      this.logger.error(`Failed to get conversations: ${error.message}`);
      client.emit('error', { message: 'Failed to get conversations' });
    }
  }

  async getMessageHistory(
    conversationId: string,
    userId: string,
    pagination: GetMessagesDto,
    client: Socket,
  ) {
    try {
      const messageHistory = await this.messageHistoryService.getMessageHistory(
        conversationId,
        userId,
        pagination,
      );
      client.emit('message_history', messageHistory);
    } catch (error: any) {
      this.logger.error(`Failed to get message history: ${error.message}`);
      client.emit('error', { message: 'Failed to get message history' });
    }
  }

  async markMessagesAsRead(
    conversationId: string,
    userId: string,
    client: Socket,
  ) {
    try {
      await this.messageHistoryService.markMessagesAsRead(
        conversationId,
        userId,
      );
      client.emit('messages_marked_read', { conversationId });
    } catch (error: any) {
      this.logger.error(`Failed to mark messages as read: ${error.message}`);
      client.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  formatTypingEvent(userId: string, conversationId: string, isTyping: boolean) {
    return {
      userId,
      isTyping,
      conversationId,
    };
  }

  formatUserEvent(
    userId: string,
    conversationId: string,
    action: 'joined' | 'left',
  ) {
    return {
      userId,
      conversationId,
      action,
      timestamp: new Date(),
    };
  }
}
