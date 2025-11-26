import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationPriority } from './notifications.entity';
import {
  INotificationService,
  NotificationData,
} from 'src/common/interfaces/notification.interface';

@Injectable()
export class NotificationsService implements INotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    priority: NotificationPriority,
    data?: NotificationData,
  ): Promise<void> {
    const notification = this.notificationRepository.create({
      user_id: { id: userId } as any,
      title,
      message,
      priority,
      data,
      read: false,
    });

    await this.notificationRepository.save(notification);
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user_id: { id: userId } as any },
      order: { created_at: 'DESC' },
      take: 50, // Limit to last 50 notifications
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { user_id: { id: userId } as any, read: false },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, user_id: { id: userId } as any },
      { read: true },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { user_id: { id: userId } as any, read: false },
      { read: true },
    );
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    await this.notificationRepository.delete({
      id: notificationId,
      user_id: { id: userId } as any,
    });
  }
}
