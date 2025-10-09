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
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');

  constructor(private readonly configService: ConfigService) {}

  handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers['authorization']?.split(' ')[1];
      if (!token) throw new Error('No token provided');

      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) throw new Error('JWT secret not configured');

      const payload = jwt.verify(token, jwtSecret) as any;
      client.data.user = payload;
      this.logger.log(`Client connected: ${client.id}`);
    } catch (err: any) {
      this.logger.warn(`Socket authentication failed: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    // Broadcast message to conversation room
    this.server
      .to(data.conversationId)
      .emit('message', { ...data, user: client.data.user });
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    this.server
      .to(data.conversationId)
      .emit('typing', { user: client.data.user, ...data });
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.conversationId);
    this.logger.log(`User joined conversation: ${data.conversationId}`);
  }
}
