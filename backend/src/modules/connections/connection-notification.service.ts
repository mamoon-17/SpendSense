import { Injectable, Inject } from '@nestjs/common';
import type { INotificationService } from 'src/common/interfaces/notification.interface';
import { NotificationPriority } from '../notifications/notifications.entity';

export enum ConnectionNotificationType {
  CONNECTION_REQUEST = 'connection_request',
  CONNECTION_ACCEPTED = 'connection_accepted',
}

@Injectable()
export class ConnectionNotificationService {
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async notifyConnectionRequest(
    userId: string,
    requesterName: string,
    requesterId: string,
  ): Promise<void> {
    await this.notificationService.createNotification(
      userId,
      'New Connection Request',
      `${requesterName} sent you a connection request`,
      NotificationPriority.MEDIUM,
      {
        type: ConnectionNotificationType.CONNECTION_REQUEST,
        requesterName,
        requesterId,
      },
    );
  }

  async notifyConnectionAccepted(
    userId: string,
    accepterName: string,
  ): Promise<void> {
    await this.notificationService.createNotification(
      userId,
      'Connection Accepted',
      `${accepterName} accepted your connection request`,
      NotificationPriority.LOW,
      {
        type: ConnectionNotificationType.CONNECTION_ACCEPTED,
        accepterName,
      },
    );
  }
}
