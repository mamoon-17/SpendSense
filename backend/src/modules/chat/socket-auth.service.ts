import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SocketAuthService {
  private readonly logger = new Logger(SocketAuthService.name);

  constructor(private readonly configService: ConfigService) {}

  authenticateSocket(token: string): any {
    try {
      if (!token) {
        throw new Error('No token provided');
      }

      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new Error('JWT secret not configured');
      }

      const payload = jwt.verify(token, jwtSecret) as any;
      return payload;
    } catch (error: any) {
      this.logger.warn(`Socket authentication failed: ${error.message}`);
      throw error;
    }
  }

  extractTokenFromSocket(client: any): string | null {
    return (
      client.handshake.auth.token ||
      client.handshake.headers['authorization']?.split(' ')[1] ||
      null
    );
  }

  getUserIdFromSocket(client: any): string | null {
    return client.data.user?.userId || null;
  }
}
