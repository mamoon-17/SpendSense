import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from './expenses.entity';

export interface ExpenseSummary {
  total_spent: string;
  average_transaction: string;
  total_transactions: number;
  categorized_count: number;
  top_category: string | null;
  category_breakdown: Array<{ category_id: string; amount: string }>;
  period: string;
}

@Injectable()
export class ExpenseAnalyticsService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepo: Repository<Expense>,
  ) {}

  async getExpensesSummary(
    userId: string,
    startDate: Date,
    endDate: Date,
    period: string,
  ): Promise<ExpenseSummary> {
    const expenses = await this.expensesRepo.find({
      where: {
        user_id: userId,
        date: Between(startDate, endDate),
      },
    });

    const totalSpent = expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.amount),
      0,
    );
    const avgTransaction =
      expenses.length > 0 ? totalSpent / expenses.length : 0;

    const categoryBreakdown = this.calculateCategoryBreakdown(expenses);
    const topCategory = this.findTopCategory(categoryBreakdown);

    return {
      total_spent: totalSpent.toFixed(2),
      average_transaction: avgTransaction.toFixed(2),
      total_transactions: expenses.length,
      categorized_count: expenses.filter((e) => e.category_id).length,
      top_category: topCategory,
      category_breakdown: categoryBreakdown,
      period,
    };
  }

  private calculateCategoryBreakdown(
    expenses: Expense[],
  ): Array<{ category_id: string; amount: string }> {
    const categoryMap = new Map<string, number>();
    expenses.forEach((exp) => {
      const current = categoryMap.get(exp.category_id) || 0;
      categoryMap.set(exp.category_id, current + parseFloat(exp.amount));
    });

    return Array.from(categoryMap.entries()).map(([categoryId, amount]) => ({
      category_id: categoryId,
      amount: amount.toFixed(2),
    }));
  }

  private findTopCategory(
    categoryBreakdown: Array<{ category_id: string; amount: string }>,
  ): string | null {
    let topCategory: string | null = null;
    let topAmount = 0;

    categoryBreakdown.forEach((cat) => {
      if (parseFloat(cat.amount) > topAmount) {
        topAmount = parseFloat(cat.amount);
        topCategory = cat.category_id;
      }
    });

    return topCategory;
  }
}
