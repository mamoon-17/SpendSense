import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './modules/users/users.module';
import { UserProfielsModule } from './modules/user_profiles/user_profiles.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { SavingsGoalsModule } from './modules/savings_goals/savings_goals.module';
import { BillsModule } from './modules/bills/bills.module';
import { ConnectionsModule } from './modules/connections/connections.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessageHistoryModule } from './modules/message-history/message-history.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CategoriesModule } from './modules/categories/categories.module';



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
    UserProfielsModule,
    BudgetsModule,
    ExpensesModule,
    SavingsGoalsModule,
    BillsModule,
    ConnectionsModule,
    InvitationsModule,
    ConversationsModule,
    
    MessageHistoryModule,
    NotificationsModule,
    CategoriesModule,
  ],
})
export class AppModule {}
