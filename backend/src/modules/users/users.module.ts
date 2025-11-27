import { Module, forwardRef } from '@nestjs/common';
import { UsersController, UserController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => AuthModule)],
  controllers: [UsersController, UserController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
