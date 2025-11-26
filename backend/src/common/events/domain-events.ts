// Base domain event interface
export interface IDomainEvent {
  readonly eventName: string;
  readonly occurredOn: Date;
  readonly userId: string;
}

// Budget events
export class BudgetExceededEvent implements IDomainEvent {
  readonly eventName = 'budget.exceeded';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly budgetName: string,
    public readonly spent: number,
    public readonly limit: number,
  ) {
    this.occurredOn = new Date();
  }
}

export class BudgetAlertEvent implements IDomainEvent {
  readonly eventName = 'budget.alert';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly budgetName: string,
    public readonly percentUsed: number,
  ) {
    this.occurredOn = new Date();
  }
}

export class BudgetCollaboratorJoinedEvent implements IDomainEvent {
  readonly eventName = 'budget.collaborator.joined';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly collaboratorName: string,
    public readonly budgetName: string,
  ) {
    this.occurredOn = new Date();
  }
}

// Bill events
export class BillDueSoonEvent implements IDomainEvent {
  readonly eventName = 'bill.due.soon';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly billName: string,
    public readonly dueDate: Date,
    public readonly amount: number,
  ) {
    this.occurredOn = new Date();
  }
}

export class BillPaidEvent implements IDomainEvent {
  readonly eventName = 'bill.paid';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly billName: string,
    public readonly amount: number,
  ) {
    this.occurredOn = new Date();
  }
}

export class BillPartiallyPaidEvent implements IDomainEvent {
  readonly eventName = 'bill.partially.paid';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly billName: string,
    public readonly paidAmount: number,
    public readonly totalAmount: number,
  ) {
    this.occurredOn = new Date();
  }
}

// Savings goal events
export class SavingsGoalAchievedEvent implements IDomainEvent {
  readonly eventName = 'savings.goal.achieved';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly goalName: string,
    public readonly targetAmount: number,
  ) {
    this.occurredOn = new Date();
  }
}

export class SavingsGoalMilestoneEvent implements IDomainEvent {
  readonly eventName = 'savings.goal.milestone';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly goalName: string,
    public readonly percentage: number,
  ) {
    this.occurredOn = new Date();
  }
}

export class SavingsGoalBehindScheduleEvent implements IDomainEvent {
  readonly eventName = 'savings.goal.behind.schedule';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly goalName: string,
    public readonly expectedAmount: number,
    public readonly currentAmount: number,
  ) {
    this.occurredOn = new Date();
  }
}

// Connection events
export class ConnectionRequestEvent implements IDomainEvent {
  readonly eventName = 'connection.request';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly requesterName: string,
    public readonly requesterId: string,
  ) {
    this.occurredOn = new Date();
  }
}

export class ConnectionAcceptedEvent implements IDomainEvent {
  readonly eventName = 'connection.accepted';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly accepterName: string,
  ) {
    this.occurredOn = new Date();
  }
}

// Conversation events
export class NewMessageEvent implements IDomainEvent {
  readonly eventName = 'conversation.new.message';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly senderName: string,
    public readonly messagePreview: string,
  ) {
    this.occurredOn = new Date();
  }
}
