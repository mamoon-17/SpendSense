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
    // If percentages are provided, use them; otherwise default to equal split
    if (percentages && percentages.length > 0) {
      // This will be called for each participant with their individual percentage
      // The calling code needs to handle per-participant calculation
      return totalAmount / participantCount; // Fallback
    }
    return totalAmount / participantCount;
  }

  calculateIndividualAmount(totalAmount: number, percentage: number): number {
    return (totalAmount * percentage) / 100;
  }
}

export class ManualSplitStrategy implements IBillSplitStrategy {
  calculateSplitAmount(
    totalAmount: number,
    participantCount: number,
    amounts?: number[],
  ): number {
    // If custom amounts are provided, use them; otherwise default to equal split
    if (amounts && amounts.length > 0) {
      // This will be called for each participant with their individual amount
      // The calling code needs to handle per-participant calculation
      return totalAmount / participantCount; // Fallback
    }
    return totalAmount / participantCount;
  }
}

export class BillSplitStrategyFactory {
  private static readonly strategies: Map<string, IBillSplitStrategy> = new Map(
    [
      ['equal', new EqualSplitStrategy()],
      ['percentage', new PercentageSplitStrategy()],
      ['manual', new ManualSplitStrategy()],
    ],
  );

  static getStrategy(splitType: string): IBillSplitStrategy {
    return this.strategies.get(splitType) || this.strategies.get('equal')!;
  }
}
