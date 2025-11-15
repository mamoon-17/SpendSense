import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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

@Controller('user')
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @Get('profile')
  @UseGuards(AuthGuard)
  getUserProfile(@CurrentUser() user: User) {
    return user;
  }

  @Put('profile')
  @UseGuards(AuthGuard)
  async updateUserProfile(
    @CurrentUser() user: User,
    @Body() payload: UpdateUserDTO,
  ) {
    return this.userService.updateUser(user.id, payload);
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  async patchUserProfile(
    @CurrentUser() user: User,
    @Body() payload: UpdateUserDTO,
  ) {
    return this.userService.updateUser(user.id, payload);
  }
}

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
