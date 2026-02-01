import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import type { ITokenService } from 'src/common/interfaces/token.interface';

// Extend the Request interface to include session and user
interface RequestWithSession extends Request {
  session?: {
    userId?: string;
  };
  user?: {
    userId: string;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('ITokenService')
    private readonly tokenService: ITokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSession>();

    // Extract JWT token from cookies OR Authorization header
    let token = request.cookies?.JWTtoken;

    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      throw new UnauthorizedException('No authentication token found');
    }

    try {
      // Verify and decode the JWT token
      const decoded = this.tokenService.verifyToken(token) as {
        userId: string;
      };

      // Check that userId exists in the token payload
      if (!decoded.userId) {
        throw new UnauthorizedException('Invalid token payload');
      }
      // attaches userID to both session and user for controllers
      request.session = request.session || {};
      request.session.userId = decoded.userId;
      request.user = { userId: decoded.userId };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
