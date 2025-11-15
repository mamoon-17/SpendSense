import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationPriority } from './notifications.entity';

export enum NotificationType {
  GROUP_ADDED = 'group_added',
  CONNECTION_REQUEST = 'connection_request',
  CONNECTION_ACCEPTED = 'connection_accepted',
  BUDGET_ALERT = 'budget_alert',
  BUDGET_EXCEEDED = 'budget_exceeded',
  SAVINGS_GOAL_MILESTONE = 'savings_goal_milestone',
  SAVINGS_GOAL_ACHIEVED = 'savings_goal_achieved',
  COLLABORATOR_JOINED = 'collaborator_joined',
  BILL_SPLIT_REQUEST = 'bill_split_request',
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    priority: NotificationPriority,
    type: NotificationType,
    data?: any,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user_id: { id: userId } as any,
      title,
      message,
      priority,
      data: { type, ...data },
      read: false,
    });

    return this.notificationRepository.save(notification);
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

  // Specific notification creators
  async notifyGroupAdded(
    userId: string,
    groupName: string,
    addedBy: string,
  ): Promise<void> {
    await this.createNotification(
      userId,
      'Added to Group Chat',
      `${addedBy} added you to "${groupName}" group chat`,
      NotificationPriority.MEDIUM,
      NotificationType.GROUP_ADDED,
      { groupName, addedBy },
    );
  }

  async notifyConnectionRequest(
    userId: string,
    requesterName: string,
    requesterId: string,
  ): Promise<void> {
    await this.createNotification(
      userId,
      'New Connection Request',
      `${requesterName} sent you a connection request`,
      NotificationPriority.MEDIUM,
      NotificationType.CONNECTION_REQUEST,
      { requesterName, requesterId },
    );
  }

  async notifyConnectionAccepted(
    userId: string,
    accepterName: string,
  ): Promise<void> {
    await this.createNotification(
      userId,
      'Connection Accepted',
      `${accepterName} accepted your connection request`,
      NotificationPriority.LOW,
      NotificationType.CONNECTION_ACCEPTED,
      { accepterName },
    );
  }

  async notifyBudgetAlert(
    userId: string,
    budgetName: string,
    percentage: number,
    spent: number,
    total: number,
  ): Promise<void> {
    await this.createNotification(
      userId,
      'Budget Alert',
      `You've spent ${percentage}% of your ${budgetName} budget ($${spent.toFixed(2)} of $${total.toFixed(2)})`,
      NotificationPriority.HIGH,
      NotificationType.BUDGET_ALERT,
      { budgetName, percentage, spent, total },
    );
  }

  async notifyBudgetExceeded(
    userId: string,
    budgetName: string,
    spent: number,
    total: number,
  ): Promise<void> {
    await this.createNotification(
      userId,
      'Budget Exceeded',
      `You've exceeded your ${budgetName} budget! Spent $${spent.toFixed(2)} of $${total.toFixed(2)}`,
      NotificationPriority.HIGH,
      NotificationType.BUDGET_EXCEEDED,
      { budgetName, spent, total },
    );
  }

  async notifySavingsGoalMilestone(
    userId: string,
    goalName: string,
    percentage: number,
    current: number,
    target: number,
  ): Promise<void> {
    await this.createNotification(
      userId,
      'Savings Goal Progress',
      `Great progress! You're ${percentage}% towards your ${goalName} goal ($${current.toFixed(2)} of $${target.toFixed(2)})`,
      NotificationPriority.MEDIUM,
      NotificationType.SAVINGS_GOAL_MILESTONE,
      { goalName, percentage, current, target },
    );
  }

  async notifySavingsGoalAchieved(
    userId: string,
    goalName: string,
    amount: number,
  ): Promise<void> {
    await this.createNotification(
      userId,
      'Savings Goal Achieved! 🎉',
      `Congratulations! You've reached your ${goalName} savings goal of $${amount.toFixed(2)}`,
      NotificationPriority.HIGH,
      NotificationType.SAVINGS_GOAL_ACHIEVED,
      { goalName, amount },
    );
  }

  async notifyCollaboratorJoined(
    userId: string,
    collaboratorName: string,
    budgetName: string,
  ): Promise<void> {
    await this.createNotification(
      userId,
      'New Collaborator',
      `${collaboratorName} joined your "${budgetName}" budget`,
      NotificationPriority.LOW,
      NotificationType.COLLABORATOR_JOINED,
      { collaboratorName, budgetName },
    );
  }
}
