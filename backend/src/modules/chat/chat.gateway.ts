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
import { ChatFacade } from './chat.facade';
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

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:3000',
    ],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');

  constructor(private readonly chatFacade: ChatFacade) {}

  handleConnection(client: Socket) {
    const connected = this.chatFacade.handleUserConnection(client, this.server);
    if (!connected) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.chatFacade.handleUserDisconnection(client, this.server);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatFacade.sendMessage(client, this.server, data);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: TypingData,
    @ConnectedSocket() client: Socket,
  ) {
    this.chatFacade.handleTyping(
      client,
      this.server,
      data.conversationId,
      data.isTyping,
    );
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: JoinConversationData,
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatFacade.joinConversation(
      client,
      this.server,
      data.conversationId,
    );
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() data: JoinConversationData,
    @ConnectedSocket() client: Socket,
  ) {
    this.chatFacade.leaveConversation(client, this.server, data.conversationId);
  }

  @SubscribeMessage('message_delivered')
  async handleMessageDelivered(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatFacade.updateMessageStatus(
      client,
      data.messageId,
      MessageStatus.DELIVERED,
    );
  }

  @SubscribeMessage('message_read')
  async handleMessageRead(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatFacade.updateMessageStatus(
      client,
      data.messageId,
      MessageStatus.READ,
    );
  }

  @SubscribeMessage('get_conversations')
  async handleGetConversations(@ConnectedSocket() client: Socket) {
    await this.chatFacade.getConversations(client);
  }

  @SubscribeMessage('get_messages')
  async handleGetMessages(
    @MessageBody()
    data: { conversationId: string; page?: number; limit?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const pagination: GetMessagesDto = {
      page: data.page || 1,
      limit: data.limit || 20,
    };
    await this.chatFacade.getMessages(client, data.conversationId, pagination);
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.chatFacade.handleTyping(
      client,
      this.server,
      data.conversationId,
      true,
    );
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.chatFacade.handleTyping(
      client,
      this.server,
      data.conversationId,
      false,
    );
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatFacade.markAsRead(client, this.server, data.conversationId);
  }

  @SubscribeMessage('get_online_users')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUserIds = this.chatFacade.getOnlineUsers();
    client.emit('online_users', { userIds: onlineUserIds });
  }
}
