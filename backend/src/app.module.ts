import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { UsersProfilesModule } from './users_profiles/users_profiles.module';
import { UserProfilesController } from './user_profiles/user_profiles.controller';
import { UsersProfileController } from './users_profile/users_profile.controller';
import { UserProfielsModule } from './user_profiles/user_profiles.module';
import { MessageHistoryModule } from './message-history/message-history.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', 'backend/.env'],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        autoLoadEntities: true,
        logging: false,
        // Force SSL for Supabase and accept self-signed/intercepted certs
        ssl: { rejectUnauthorized: false },
        extra: { ssl: { rejectUnauthorized: false } },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    UsersProfilesModule,
    UserProfielsModule,
    MessageHistoryModule,
  ],
  controllers: [AppController, UserProfilesController, UsersProfileController],
  providers: [AppService],
})
export class AppModule {}
