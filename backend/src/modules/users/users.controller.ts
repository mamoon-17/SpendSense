import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from 'src/dtos/createUser.dto';
import { UpdateUserDTO } from 'src/dtos/updateUser.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @Get()
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
