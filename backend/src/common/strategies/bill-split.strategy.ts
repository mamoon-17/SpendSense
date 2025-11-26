export interface IBillSplitStrategy {
  calculateSplitAmount(
    totalAmount: number,
    participantCount: number,
    customData?: any,
  ): number;
}

export class EqualSplitStrategy implements IBillSplitStrategy {
  calculateSplitAmount(totalAmount: number, participantCount: number): number {
    return totalAmount / participantCount;
  }
}

export class PercentageSplitStrategy implements IBillSplitStrategy {
  calculateSplitAmount(
    totalAmount: number,
    participantCount: number,
    percentages?: number[],
  ): number {
    // For now, default to equal split
    // Implementation can be extended when percentage data is provided
    return totalAmount / participantCount;
  }
}

export class ManualSplitStrategy implements IBillSplitStrategy {
  calculateSplitAmount(
    totalAmount: number,
    participantCount: number,
    amounts?: number[],
  ): number {
    // For now, default to equal split
    // Implementation can be extended when manual amounts are provided
    return totalAmount / participantCount;
  }
}

export class BillSplitStrategyFactory {
  static getStrategy(splitType: string): IBillSplitStrategy {
    switch (splitType) {
      case 'equal':
        return new EqualSplitStrategy();
      case 'percentage':
        return new PercentageSplitStrategy();
      case 'manual':
        return new ManualSplitStrategy();
      default:
        return new EqualSplitStrategy();
    }
  }
}
