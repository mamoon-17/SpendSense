import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SocketAuthService } from './socket-auth.service';
import { CreateMessageDto } from '../message-history/dtos/create-message.dto';
import { GetMessagesDto } from '../message-history/dtos/get-messages.dto';
import { MessageStatus } from '../message-history/message-history.entity';

/**
 * ChatFacade simplifies complex chat operations by providing a unified interface
 * to coordinate between ChatService, SocketAuthService, and WebSocket management.
 * Implements Facade pattern to reduce ChatGateway complexity.
 */
@Injectable()
export class ChatFacade {
  private readonly logger = new Logger('ChatFacade');
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private readonly chatService: ChatService,
    private readonly socketAuthService: SocketAuthService,
  ) {}

  // Connection management
  handleUserConnection(client: Socket, server: Server): boolean {
    try {
      const token = this.socketAuthService.extractTokenFromSocket(client);
      if (!token) throw new Error('No token provided');

      const payload = this.socketAuthService.authenticateSocket(token);
      client.data.user = payload;
      const userId = payload.userId;

      // Track connected user
      this.connectedUsers.set(userId, client.id);

      this.logger.log(`Client connected: ${client.id}, User: ${userId}`);

      // Notify all clients that this user is now online
      server.emit('user_online', { userId });

      // Send list of online users to the newly connected client
      const onlineUserIds = Array.from(this.connectedUsers.keys());
      client.emit('online_users', { userIds: onlineUserIds });

      return true;
    } catch (err: any) {
      this.logger.warn(`Socket authentication failed: ${err.message}`);
      return false;
    }
  }

  handleUserDisconnection(client: Socket, server: Server): void {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (userId) {
      this.connectedUsers.delete(userId);
      server.emit('user_offline', { userId });
      this.logger.log(`Client disconnected: ${client.id}, User: ${userId}`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  // Message operations
  async sendMessage(
    client: Socket,
    server: Server,
    data: CreateMessageDto,
  ): Promise<void> {
    const userId = this.getUserIdOrEmitError(client);
    if (!userId) return;

    await this.chatService.sendMessage(userId, data, client, server);
  }

  async getMessages(
    client: Socket,
    conversationId: string,
    pagination: GetMessagesDto,
  ): Promise<void> {
    const userId = this.getUserIdOrEmitError(client);
    if (!userId) return;

    await this.chatService.getMessageHistory(
      conversationId,
      userId,
      pagination,
      client,
    );
  }

  async updateMessageStatus(
    client: Socket,
    messageId: string,
    status: MessageStatus,
  ): Promise<void> {
    const userId = this.getUserIdOrEmitError(client);
    if (!userId) return;

    await this.chatService.updateMessageStatus(
      messageId,
      status,
      userId,
      client,
    );
  }

  // Conversation operations
  async joinConversation(
    client: Socket,
    server: Server,
    conversationId: string,
  ): Promise<void> {
    const userId = this.getUserIdOrEmitError(client);
    if (!userId) return;

    await this.chatService.joinConversation(
      userId,
      conversationId,
      client,
      server,
    );
  }

  leaveConversation(
    client: Socket,
    server: Server,
    conversationId: string,
  ): void {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) return;

    this.chatService.leaveConversation(userId, conversationId, client, server);
  }

  async getConversations(client: Socket): Promise<void> {
    const userId = this.getUserIdOrEmitError(client);
    if (!userId) return;

    await this.chatService.getUserConversations(userId, client);
  }

  // Typing indicators
  handleTyping(
    client: Socket,
    server: Server,
    conversationId: string,
    isTyping: boolean,
  ): void {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) return;

    this.chatService.handleTyping(
      userId,
      { conversationId, isTyping },
      client,
      server,
    );
  }

  // Read receipts
  async markAsRead(
    client: Socket,
    server: Server,
    conversationId: string,
  ): Promise<void> {
    const userId = this.getUserIdOrEmitError(client);
    if (!userId) return;

    await this.chatService.markMessagesAsRead(
      conversationId,
      userId,
      client,
      server,
    );
  }

  // Online user management
  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Helper methods
  private getUserIdOrEmitError(client: Socket): string | null {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) {
      client.emit('error', { message: 'User not authenticated' });
      return null;
    }
    return userId;
  }
}
