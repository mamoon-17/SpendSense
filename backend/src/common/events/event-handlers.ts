import { Injectable, Inject } from '@nestjs/common';
import { IEventHandler } from '../events/event-bus.service';
import {
  BudgetExceededEvent,
  BudgetAlertEvent,
  BudgetCollaboratorJoinedEvent,
  BillDueSoonEvent,
  BillPaidEvent,
  BillPartiallyPaidEvent,
  SavingsGoalAchievedEvent,
  SavingsGoalMilestoneEvent,
  SavingsGoalBehindScheduleEvent,
  ConnectionRequestEvent,
  ConnectionAcceptedEvent,
  NewMessageEvent,
} from '../events/domain-events';
import type { INotificationService } from '../interfaces/notification.interface';
import { NotificationPriority } from 'src/modules/notifications/notifications.entity';

// Budget event handlers
@Injectable()
export class BudgetExceededHandler
  implements IEventHandler<BudgetExceededEvent>
{
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async handle(event: BudgetExceededEvent): Promise<void> {
    await this.notificationService.createNotification(
      event.userId,
      'Budget Exceeded',
      `Your budget "${event.budgetName}" has been exceeded. Spent: $${event.spent} / Limit: $${event.limit}`,
      NotificationPriority.HIGH,
      {
        type: 'budget_exceeded',
        budgetName: event.budgetName,
        spent: event.spent,
        limit: event.limit,
      },
    );
  }
}

@Injectable()
export class BudgetAlertHandler implements IEventHandler<BudgetAlertEvent> {
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async handle(event: BudgetAlertEvent): Promise<void> {
    await this.notificationService.createNotification(
      event.userId,
      'Budget Alert',
      `Warning: Your budget "${event.budgetName}" is at ${event.percentUsed}% usage`,
      NotificationPriority.MEDIUM,
      {
        type: 'budget_alert',
        budgetName: event.budgetName,
        percentUsed: event.percentUsed,
      },
    );
  }
}

@Injectable()
export class BudgetCollaboratorJoinedHandler
  implements IEventHandler<BudgetCollaboratorJoinedEvent>
{
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async handle(event: BudgetCollaboratorJoinedEvent): Promise<void> {
    await this.notificationService.createNotification(
      event.userId,
      'New Collaborator',
      `${event.collaboratorName} joined your budget "${event.budgetName}"`,
      NotificationPriority.LOW,
      {
        type: 'collaborator_joined',
        collaboratorName: event.collaboratorName,
        budgetName: event.budgetName,
      },
    );
  }
}

// Bill event handlers
@Injectable()
export class BillDueSoonHandler implements IEventHandler<BillDueSoonEvent> {
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async handle(event: BillDueSoonEvent): Promise<void> {
    await this.notificationService.createNotification(
      event.userId,
      'Bill Due Soon',
      `Bill "${event.billName}" is due on ${event.dueDate.toLocaleDateString()}. Amount: $${event.amount}`,
      NotificationPriority.HIGH,
      {
        type: 'bill_due_soon',
        billName: event.billName,
        dueDate: event.dueDate,
        amount: event.amount,
      },
    );
  }
}

@Injectable()
export class BillPaidHandler implements IEventHandler<BillPaidEvent> {
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async handle(event: BillPaidEvent): Promise<void> {
    await this.notificationService.createNotification(
      event.userId,
      'Bill Paid',
      `Bill "${event.billName}" has been paid. Amount: $${event.amount}`,
      NotificationPriority.LOW,
      {
        type: 'bill_paid',
        billName: event.billName,
        amount: event.amount,
      },
    );
  }
}

@Injectable()
export class BillPartiallyPaidHandler
  implements IEventHandler<BillPartiallyPaidEvent>
{
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async handle(event: BillPartiallyPaidEvent): Promise<void> {
    await this.notificationService.createNotification(
      event.userId,
      'Bill Partially Paid',
      `Bill "${event.billName}" has been partially paid. Paid: $${event.paidAmount} / Total: $${event.totalAmount}`,
      NotificationPriority.MEDIUM,
      {
        type: 'bill_partially_paid',
        billName: event.billName,
        paidAmount: event.paidAmount,
        totalAmount: event.totalAmount,
      },
    );
  }
}

// Savings goal event handlers
@Injectable()
export class SavingsGoalAchievedHandler
  implements IEventHandler<SavingsGoalAchievedEvent>
{
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async handle(event: SavingsGoalAchievedEvent): Promise<void> {
    await this.notificationService.createNotification(
      event.userId,
      'Goal Achieved! 🎉',
      `Congratulations! You've achieved your savings goal "${event.goalName}" of $${event.targetAmount}`,
      NotificationPriority.HIGH,
      {
        type: 'goal_achieved',
        goalName: event.goalName,
        targetAmount: event.targetAmount,
      },
    );
  }
}

@Injectable()
export class SavingsGoalMilestoneHandler
  implements IEventHandler<SavingsGoalMilestoneEvent>
{
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async handle(event: SavingsGoalMilestoneEvent): Promise<void> {
    await this.notificationService.createNotification(
      event.userId,
      'Milestone Reached',
      `You've reached ${event.percentage}% of your savings goal "${event.goalName}"`,
      NotificationPriority.MEDIUM,
      {
        type: 'goal_milestone',
        goalName: event.goalName,
        percentage: event.percentage,
      },
    );
  }
}

@Injectable()
export class SavingsGoalBehindScheduleHandler
  implements IEventHandler<SavingsGoalBehindScheduleEvent>
{
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async handle(event: SavingsGoalBehindScheduleEvent): Promise<void> {
    await this.notificationService.createNotification(
      event.userId,
      'Goal Behind Schedule',
      `Your goal "${event.goalName}" is behind schedule. Expected: $${event.expectedAmount}, Current: $${event.currentAmount}`,
      NotificationPriority.MEDIUM,
      {
        type: 'goal_behind_schedule',
        goalName: event.goalName,
        expectedAmount: event.expectedAmount,
        currentAmount: event.currentAmount,
      },
    );
  }
}

// Connection event handlers
@Injectable()
export class ConnectionRequestHandler
  implements IEventHandler<ConnectionRequestEvent>
{
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async handle(event: ConnectionRequestEvent): Promise<void> {
    await this.notificationService.createNotification(
      event.userId,
      'New Connection Request',
      `${event.requesterName} wants to connect with you`,
      NotificationPriority.MEDIUM,
      {
        type: 'connection_request',
        requesterName: event.requesterName,
        requesterId: event.requesterId,
      },
    );
  }
}

@Injectable()
export class ConnectionAcceptedHandler
  implements IEventHandler<ConnectionAcceptedEvent>
{
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async handle(event: ConnectionAcceptedEvent): Promise<void> {
    await this.notificationService.createNotification(
      event.userId,
      'Connection Accepted',
      `${event.accepterName} accepted your connection request`,
      NotificationPriority.LOW,
      {
        type: 'connection_accepted',
        accepterName: event.accepterName,
      },
    );
  }
}

// Conversation event handlers
@Injectable()
export class NewMessageHandler implements IEventHandler<NewMessageEvent> {
  constructor(
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
  ) {}

  async handle(event: NewMessageEvent): Promise<void> {
    await this.notificationService.createNotification(
      event.userId,
      'New Message',
      `${event.senderName}: ${event.messagePreview}`,
      NotificationPriority.MEDIUM,
      {
        type: 'new_message',
        senderName: event.senderName,
        messagePreview: event.messagePreview,
      },
    );
  }
}
