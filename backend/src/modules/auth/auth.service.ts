import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { LoginDTO } from 'src/dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async login(body: LoginDTO): Promise<{ token: string }> {
    const { username, password } = body;

    // Find user
    const user = await this.userService.getUserByUsername(username);
    if (!user) throw new UnauthorizedException('User not found');

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // Sign JWT
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT secret is not defined in configuration');
    }

    const token = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: '1h',
    });

    return { token };
  }
}
