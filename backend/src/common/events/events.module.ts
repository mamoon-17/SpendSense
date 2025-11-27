import { Module, Global } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import { NotificationsModule } from '../../modules/notifications/notifications.module';
import {
  BudgetExceededHandler,
  BudgetAlertHandler,
  BudgetCollaboratorJoinedHandler,
  BillDueSoonHandler,
  BillPaidHandler,
  BillPartiallyPaidHandler,
  SavingsGoalAchievedHandler,
  SavingsGoalMilestoneHandler,
  SavingsGoalBehindScheduleHandler,
  ConnectionRequestHandler,
  ConnectionAcceptedHandler,
  NewMessageHandler,
} from './event-handlers';

/**
 * Global module that provides event bus and registers all event handlers.
 * EventBusService implements Observer pattern for domain events.
 */
@Global()
@Module({
  imports: [NotificationsModule],
  providers: [
    EventBusService,
    // Budget event handlers
    BudgetExceededHandler,
    BudgetAlertHandler,
    BudgetCollaboratorJoinedHandler,
    // Bill event handlers
    BillDueSoonHandler,
    BillPaidHandler,
    BillPartiallyPaidHandler,
    // Savings goal event handlers
    SavingsGoalAchievedHandler,
    SavingsGoalMilestoneHandler,
    SavingsGoalBehindScheduleHandler,
    // Connection event handlers
    ConnectionRequestHandler,
    ConnectionAcceptedHandler,
    // Message event handlers
    NewMessageHandler,
  ],
  exports: [EventBusService],
})
export class EventsModule {
  constructor(
    private readonly eventBus: EventBusService,
    // Budget handlers
    private readonly budgetExceededHandler: BudgetExceededHandler,
    private readonly budgetAlertHandler: BudgetAlertHandler,
    private readonly budgetCollaboratorJoinedHandler: BudgetCollaboratorJoinedHandler,
    // Bill handlers
    private readonly billDueSoonHandler: BillDueSoonHandler,
    private readonly billPaidHandler: BillPaidHandler,
    private readonly billPartiallyPaidHandler: BillPartiallyPaidHandler,
    // Savings goal handlers
    private readonly savingsGoalAchievedHandler: SavingsGoalAchievedHandler,
    private readonly savingsGoalMilestoneHandler: SavingsGoalMilestoneHandler,
    private readonly savingsGoalBehindScheduleHandler: SavingsGoalBehindScheduleHandler,
    // Connection handlers
    private readonly connectionRequestHandler: ConnectionRequestHandler,
    private readonly connectionAcceptedHandler: ConnectionAcceptedHandler,
    // Message handlers
    private readonly newMessageHandler: NewMessageHandler,
  ) {
    // Subscribe all handlers to their respective events
    this.eventBus.subscribe('budget.exceeded', budgetExceededHandler);
    this.eventBus.subscribe('budget.alert', budgetAlertHandler);
    this.eventBus.subscribe(
      'budget.collaborator.joined',
      budgetCollaboratorJoinedHandler,
    );
    this.eventBus.subscribe('bill.due.soon', billDueSoonHandler);
    this.eventBus.subscribe('bill.paid', billPaidHandler);
    this.eventBus.subscribe('bill.partially.paid', billPartiallyPaidHandler);
    this.eventBus.subscribe(
      'savings.goal.achieved',
      savingsGoalAchievedHandler,
    );
    this.eventBus.subscribe(
      'savings.goal.milestone',
      savingsGoalMilestoneHandler,
    );
    this.eventBus.subscribe(
      'savings.goal.behind.schedule',
      savingsGoalBehindScheduleHandler,
    );
    this.eventBus.subscribe('connection.request', connectionRequestHandler);
    this.eventBus.subscribe('connection.accepted', connectionAcceptedHandler);
    this.eventBus.subscribe('conversation.new.message', newMessageHandler);
  }
}
