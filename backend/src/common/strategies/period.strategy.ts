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
  static getStrategy(period?: string): IPeriodStrategy {
    switch (period) {
      case 'week':
        return new WeekPeriodStrategy();
      case 'year':
        return new YearPeriodStrategy();
      case 'month':
      default:
        return new MonthPeriodStrategy();
    }
  }
}
