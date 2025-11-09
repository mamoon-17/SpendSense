import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { LoginDTO } from 'src/modules/users/dtos/login.dto';
import { SignupDTO } from 'src/modules/users/dtos/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async login(body: LoginDTO, res?: Response,): Promise<{ token: string; user: any }> {
    const { username, password } = body;

    // Find user
    const user = await this.userService.getUserByUsername(username);
    if (!user) throw new UnauthorizedException('Username or password is incorrect');

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Username or password is incorrect');

    // Sign JWT
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT secret is not defined in configuration');
    }

    const token = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: '1h',
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    // If Express response is provided, set cookie
    if (res) {
      res.cookie('JWTtoken', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000, // 1 hour
      });
    }
    return { token, user: userWithoutPassword };
  }

  async signup(body: SignupDTO): Promise<{ message: string }> {
    const { name, username, password } = body;

    // Check if user already exists
    try {
      const existingUser = await this.userService.getUserByUsername(username);
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    } catch (error) {
      // If user not found, that's good - we can proceed with signup
      if (!(error instanceof Error) || error.message !== 'User not found') {
        throw error;
      }
    }

    // Create new user
    const createUserPayload = { name, username, password };
    await this.userService.createUser(createUserPayload);

    return { message: 'User created successfully' };
  }
}
