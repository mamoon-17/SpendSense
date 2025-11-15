import { Module } from '@nestjs/common';
import { UsersController, UserController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController, UserController],
  providers: [UsersService, AuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
