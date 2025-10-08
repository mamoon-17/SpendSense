import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

// Extend the Request interface to include session
interface RequestWithSession extends Request {
  session?: {
    userId?: string;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSession>();

    // Extract JWT token from cookies
    const token = request.cookies?.JWTtoken;

    if (!token) {
      throw new UnauthorizedException('No authentication token found');
    }

    try {
      // Verify and decode the JWT token
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new UnauthorizedException('JWT secret is not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as { userId: string };

      // Check that userId exists in the token payload
      if (!decoded.userId) {
        throw new UnauthorizedException('Invalid token payload');
      }
      // attaches userID to session for controllers
      request.session = request.session || {};
      request.session.userId = decoded.userId;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
