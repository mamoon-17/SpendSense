import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from 'src/dtos/createUser.dto';
import { UpdateUserDTO } from 'src/dtos/updateUser.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserInterceptor } from 'src/common/interceptors/current-user.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @UseInterceptors(CurrentUserInterceptor)
  getCurrentUser(@CurrentUser() user: any) {
    return user;
  }
  @Get()
  @UseGuards(AuthGuard)
  async getAllUsers(@Request() req: any) {
    // Access the authenticated user's ID from session
    const userId = req.session?.userId;
    console.log('Authenticated user ID:', userId);

    return this.userService.getAllUsers();
  }

  @Post()
  async createUser(@Body() payload: CreateUserDTO) {
    return this.userService.createUser(payload);
  }

  @Get('public')
  async getPublicMessage() {
    return { message: 'This endpoint is public - no authentication required' };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() payload: UpdateUserDTO) {
    return this.userService.updateUser(id, payload);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
