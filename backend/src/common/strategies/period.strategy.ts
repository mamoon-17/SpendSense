export interface IPeriodStrategy {
  calculateDateRange(now: Date): { startDate: Date; endDate: Date };
}

export class WeekPeriodStrategy implements IPeriodStrategy {
  calculateDateRange(now: Date): { startDate: Date; endDate: Date } {
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    return { startDate, endDate: now };
  }
}

export class MonthPeriodStrategy implements IPeriodStrategy {
  calculateDateRange(now: Date): { startDate: Date; endDate: Date } {
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate, endDate: now };
  }
}

export class YearPeriodStrategy implements IPeriodStrategy {
  calculateDateRange(now: Date): { startDate: Date; endDate: Date } {
    const startDate = new Date(now.getFullYear(), 0, 1);
    return { startDate, endDate: now };
  }
}

export class PeriodStrategyFactory {
  private static readonly strategies: Map<string, IPeriodStrategy> = new Map([
    ['week', new WeekPeriodStrategy()],
    ['month', new MonthPeriodStrategy()],
    ['year', new YearPeriodStrategy()],
  ]);

  static getStrategy(period?: string): IPeriodStrategy {
    return (
      this.strategies.get(period || 'month') || this.strategies.get('month')!
    );
  }
}
