import { NotificationPriority } from 'src/modules/notifications/notifications.entity';

export interface NotificationData {
  type: string;
  [key: string]: any;
}

export interface INotificationService {
  createNotification(
    userId: string,
    title: string,
    message: string,
    priority: NotificationPriority,
    data?: NotificationData,
  ): Promise<void>;
}
