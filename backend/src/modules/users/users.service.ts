import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import { CreateUserDTO } from 'src/dtos/createUser.dto';
import { UpdateUserDTO } from 'src/dtos/updateUser.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async getAllUsers(): Promise<User[]> {
    return this.usersRepo.find();
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(payload: CreateUserDTO): Promise<object> {
    // check if username already exists
    const existingUser = await this.usersRepo.findOne({
      where: { username: payload.username },
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(payload.password, salt);

    // create new user with hashed password
    const newUser = this.usersRepo.create({
      ...payload,
      password: hashedPassword, // never mutate DTO directly
    });

    await this.usersRepo.save(newUser);

    return { msg: 'User created successfully' };
  }

  async updateUser(id: string, payload: UpdateUserDTO): Promise<object> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepo.update(id, payload);
    return { msg: 'User updated successfully' };
  }

  async deleteUser(id: string): Promise<object> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepo.delete(id);
    return { msg: 'User deleted successfully' };
  }
}
