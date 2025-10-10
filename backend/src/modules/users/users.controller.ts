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
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from 'src/modules/users/dtos/createUser.dto';
import { UpdateUserDTO } from 'src/modules/users/dtos/updateUser.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from './users.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('search')
  @UseGuards(AuthGuard)
  async searchUsersByUsername(@Query('username') username: string) {
    if (!username) return [];
    return this.userService.searchUsersByUsername(username);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getCurrentUser(@CurrentUser() user: User) {
    return user;
  }
  @Get()
  @UseGuards(AuthGuard)
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Post()
  async createUser(@Body() payload: CreateUserDTO) {
    return this.userService.createUser(payload);
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
