import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SocketAuthService } from './socket-auth.service';
import { CreateMessageDto } from '../message-history/dtos/create-message.dto';
import { GetMessagesDto } from '../message-history/dtos/get-messages.dto';
import { MessageStatus } from '../message-history/message-history.entity';

interface TypingData {
  conversationId: string;
  isTyping: boolean;
}

interface JoinConversationData {
  conversationId: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');

  constructor(
    private readonly chatService: ChatService,
    private readonly socketAuthService: SocketAuthService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = this.socketAuthService.extractTokenFromSocket(client);
      if (!token) throw new Error('No token provided');

      const payload = this.socketAuthService.authenticateSocket(token);
      client.data.user = payload;
      this.logger.log(
        `Client connected: ${client.id}, User: ${payload.userId}`,
      );
    } catch (err: any) {
      this.logger.warn(`Socket authentication failed: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }
    await this.chatService.sendMessage(userId, data, client, this.server);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: TypingData,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) return;
    this.chatService.handleTyping(userId, data, client, this.server);
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: JoinConversationData,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }
    await this.chatService.joinConversation(
      userId,
      data.conversationId,
      client,
      this.server,
    );
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() data: JoinConversationData,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) return;
    this.chatService.leaveConversation(
      userId,
      data.conversationId,
      client,
      this.server,
    );
  }

  @SubscribeMessage('message_delivered')
  async handleMessageDelivered(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) return;
    await this.chatService.updateMessageStatus(
      data.messageId,
      MessageStatus.DELIVERED,
      userId,
      client,
    );
  }

  @SubscribeMessage('message_read')
  async handleMessageRead(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) return;
    await this.chatService.updateMessageStatus(
      data.messageId,
      MessageStatus.READ,
      userId,
      client,
    );
  }

  @SubscribeMessage('get_conversations')
  async handleGetConversations(@ConnectedSocket() client: Socket) {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }
    await this.chatService.getUserConversations(userId, client);
  }

  @SubscribeMessage('get_messages')
  async handleGetMessages(
    @MessageBody()
    data: { conversationId: string; page?: number; limit?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }
    const pagination: GetMessagesDto = {
      page: data.page || 1,
      limit: data.limit || 20,
    };
    await this.chatService.getMessageHistory(
      data.conversationId,
      userId,
      pagination,
      client,
    );
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) return;
    this.chatService.handleTypingStart(userId, data, client, this.server);
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) return;
    this.chatService.handleTypingStop(userId, data, client, this.server);
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketAuthService.getUserIdFromSocket(client);
    if (!userId) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }
    await this.chatService.markMessagesAsRead(
      data.conversationId,
      userId,
      client,
    );
  }
}
