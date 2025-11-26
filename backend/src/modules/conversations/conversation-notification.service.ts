import { Injectable, Inject } from '@nestjs/common';
import type { INotificationService } from 'src/common/interfaces/notification.interface';
import { NotificationPriority } from '../notifications/notifications.entity';

export enum ConversationNotificationType {
  GROUP_ADDED = 'group_added',
}

@Injectable()
export class ConversationNotificationService {
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async notifyGroupAdded(
    userId: string,
    groupName: string,
    addedBy: string,
  ): Promise<void> {
    await this.notificationService.createNotification(
      userId,
      'Added to Group Chat',
      `${addedBy} added you to "${groupName}" group chat`,
      NotificationPriority.MEDIUM,
      {
        type: ConversationNotificationType.GROUP_ADDED,
        groupName,
        addedBy,
      },
    );
  }
}
