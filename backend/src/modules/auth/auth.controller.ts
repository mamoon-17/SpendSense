import {
  Body,
  Controller,
  Post,
  Res,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from 'src/modules/users/dtos/login.dto';
import { SignupDTO } from 'src/modules/users/dtos/signup.dto';
import { ChangePasswordDTO } from 'src/modules/users/dtos/changePassword.dto';
import { AuthGuard } from './auth.guard';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.authService.login(body, res);
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

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(@Body() body: ChangePasswordDTO, @Request() req: any) {
    const userId = req.user?.userId || req.session?.userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    const result = await this.authService.changePassword(
      userId,
      body.currentPassword,
      body.newPassword,
    );
    return result;
  }
}
