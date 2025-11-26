import { Module } from '@nestjs/common';
import { UsersController, UserController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { AuthGuard } from '../auth/auth.guard';
import { PasswordService } from 'src/common/services/password.service';
import { TokenService } from 'src/common/services/token.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ConfigModule],
  controllers: [UsersController, UserController],
  providers: [
    UsersService,
    AuthGuard,
    {
      provide: 'IPasswordService',
      useClass: PasswordService,
    },
    {
      provide: 'ITokenService',
      useClass: TokenService,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
