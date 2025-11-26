import { Injectable, Logger, Inject } from '@nestjs/common';
import type { ITokenService } from 'src/common/interfaces/token.interface';

@Injectable()
export class SocketAuthService {
  private readonly logger = new Logger(SocketAuthService.name);

  constructor(
    @Inject('ITokenService')
    private readonly tokenService: ITokenService,
  ) {}

  authenticateSocket(token: string): any {
    try {
      if (!token) {
        throw new Error('No token provided');
      }

      const payload = this.tokenService.verifyToken(token);
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
