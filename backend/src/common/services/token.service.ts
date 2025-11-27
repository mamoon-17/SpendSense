import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { ITokenService } from '../interfaces/token.interface';

@Injectable()
export class TokenService implements ITokenService {
  constructor(private readonly configService: ConfigService) {}

  generateToken(payload: any, expiresIn: string = '1h'): string {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT secret is not defined in configuration');
    }
    return jwt.sign(payload, jwtSecret, { expiresIn } as jwt.SignOptions);
  }

  verifyToken(token: string): any {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT secret is not defined in configuration');
    }
    return jwt.verify(token, jwtSecret) as jwt.JwtPayload;
  }

  decodeToken(token: string): any {
    return jwt.decode(token);
  }
}
