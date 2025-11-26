import { Injectable, Inject } from '@nestjs/common';
import type { INotificationService } from 'src/common/interfaces/notification.interface';
import { NotificationPriority } from '../notifications/notifications.entity';

export enum BudgetNotificationType {
  BUDGET_ALERT = 'budget_alert',
  BUDGET_EXCEEDED = 'budget_exceeded',
  COLLABORATOR_JOINED = 'collaborator_joined',
}

@Injectable()
export class BudgetNotificationService {
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async notifyBudgetAlert(
    userId: string,
    budgetName: string,
    percentage: number,
    spent: number,
    total: number,
  ): Promise<void> {
    await this.notificationService.createNotification(
      userId,
      'Budget Alert',
      `You've spent ${percentage}% of your ${budgetName} budget ($${spent.toFixed(2)} of $${total.toFixed(2)})`,
      NotificationPriority.HIGH,
      {
        type: BudgetNotificationType.BUDGET_ALERT,
        budgetName,
        percentage,
        spent,
        total,
      },
    );
  }

  async notifyBudgetExceeded(
    userId: string,
    budgetName: string,
    spent: number,
    total: number,
  ): Promise<void> {
    await this.notificationService.createNotification(
      userId,
      'Budget Exceeded',
      `You've exceeded your ${budgetName} budget! Spent $${spent.toFixed(2)} of $${total.toFixed(2)}`,
      NotificationPriority.HIGH,
      {
        type: BudgetNotificationType.BUDGET_EXCEEDED,
        budgetName,
        spent,
        total,
      },
    );
  }

  async notifyCollaboratorJoined(
    userId: string,
    collaboratorName: string,
    budgetName: string,
  ): Promise<void> {
    await this.notificationService.createNotification(
      userId,
      'New Collaborator',
      `${collaboratorName} joined the ${budgetName} budget`,
      NotificationPriority.MEDIUM,
      {
        type: BudgetNotificationType.COLLABORATOR_JOINED,
        collaboratorName,
        budgetName,
      },
    );
  }
}
