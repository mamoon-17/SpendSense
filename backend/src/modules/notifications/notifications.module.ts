import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './notifications.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), AuthModule],
  providers: [
    NotificationsService,
    {
      provide: 'INotificationService',
      useClass: NotificationsService,
    },
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService, 'INotificationService'],
})
export class NotificationsModule {}
