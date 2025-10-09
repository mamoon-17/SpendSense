import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from 'src/modules/users/dtos/login.dto';
import { SignupDTO } from 'src/modules/users/dtos/signup.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.authService.login(body);

    // Attach cookie
    res.cookie('JWTtoken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      sameSite: 'strict',
    });

    return { message: 'Login successful', user, token };
  }

  @Post('signup')
  async signup(@Body() body: SignupDTO) {
    const result = await this.authService.signup(body);
    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear the JWT cookie
    res.clearCookie('JWTtoken');
    return { message: 'Logout successful' };
  }
}
