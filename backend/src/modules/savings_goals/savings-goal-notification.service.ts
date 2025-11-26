import { Injectable, Inject } from '@nestjs/common';
import type { INotificationService } from 'src/common/interfaces/notification.interface';
import { NotificationPriority } from '../notifications/notifications.entity';

export enum SavingsNotificationType {
  SAVINGS_GOAL_MILESTONE = 'savings_goal_milestone',
  SAVINGS_GOAL_ACHIEVED = 'savings_goal_achieved',
}

@Injectable()
export class SavingsGoalNotificationService {
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async notifySavingsGoalMilestone(
    userId: string,
    goalName: string,
    percentage: number,
    current: number,
    target: number,
  ): Promise<void> {
    await this.notificationService.createNotification(
      userId,
      'Savings Goal Progress',
      `Great progress! You're ${percentage}% towards your ${goalName} goal ($${current.toFixed(2)} of $${target.toFixed(2)})`,
      NotificationPriority.MEDIUM,
      {
        type: SavingsNotificationType.SAVINGS_GOAL_MILESTONE,
        goalName,
        percentage,
        current,
        target,
      },
    );
  }

  async notifySavingsGoalAchieved(
    userId: string,
    goalName: string,
    amount: number,
  ): Promise<void> {
    await this.notificationService.createNotification(
      userId,
      'Savings Goal Achieved! 🎉',
      `Congratulations! You've reached your ${goalName} savings goal of $${amount.toFixed(2)}`,
      NotificationPriority.HIGH,
      {
        type: SavingsNotificationType.SAVINGS_GOAL_ACHIEVED,
        goalName,
        amount,
      },
    );
  }
}
