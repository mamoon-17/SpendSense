import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from './expenses.entity';
import { Category } from '../categories/categories.entity';
import {
  CreateExpenseDTO,
  DistributionType,
  LinkItemDTO,
} from './dtos/createExpense.dto';
import { UpdateExpenseDTO } from './dtos/updateExpense.dto';
import { Budget } from '../budgets/budgets.entity';
import { SavingsGoal } from '../savings_goals/savings_goals.entity';
import { ExpenseBudget } from './expense-budget.entity';
import { ExpenseSavingsGoal } from './expense-savings-goal.entity';
import { ExpenseAnalyticsService } from './expense-analytics.service';
import { BudgetsService } from '../budgets/budgets.service';
import { SavingsGoalsService } from '../savings_goals/savings_goals.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Budget)
    private readonly budgetsRepo: Repository<Budget>,
    @InjectRepository(SavingsGoal)
    private readonly savingsGoalRepo: Repository<SavingsGoal>,
    @InjectRepository(ExpenseBudget)
    private readonly expenseBudgetRepo: Repository<ExpenseBudget>,
    @InjectRepository(ExpenseSavingsGoal)
    private readonly expenseSavingsGoalRepo: Repository<ExpenseSavingsGoal>,
    private readonly expenseAnalyticsService: ExpenseAnalyticsService,
    @Inject(forwardRef(() => BudgetsService))
    private readonly budgetsService: BudgetsService,
    @Inject(forwardRef(() => SavingsGoalsService))
    private readonly savingsGoalsService: SavingsGoalsService,
  ) {}

  // Create a new expense
  async createExpense(
    payload: CreateExpenseDTO,
    userId: string,
  ): Promise<object> {
    // Verify category exists
    const category = await this.categoriesRepo.findOne({
      where: { id: payload.category_id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Create the expense first
    const expense = this.expensesRepo.create({
      description: payload.description,
      amount: payload.amount.toString(),
      category_id: payload.category_id,
      date: payload.date,
      payment_method: payload.payment_method,
      notes: payload.notes,
      tags: payload.tags,
      location: payload.location,
      currency: payload.currency,
      user_id: userId,
    });

    await this.expensesRepo.save(expense);

    // Handle budget linking with distribution types
    await this.linkBudgetsToExpense(
      expense.id,
      payload.amount,
      userId,
      payload.budget_distribution,
      payload.budget_links,
      payload.budget_ids,
    );

    // Handle savings goal linking with distribution types
    await this.linkSavingsGoalsToExpense(
      expense.id,
      payload.amount,
      userId,
      payload.savings_goal_distribution,
      payload.savings_goal_links,
      payload.savings_goal_ids,
    );

    // Check if there's a budget for this category and trigger notifications
    const budgets = await this.budgetsRepo.find({
      where: { category: { id: payload.category_id } },
      relations: ['participants'],
    });

    for (const budget of budgets) {
      const isParticipant = budget.participants?.some((p) => p.id === userId);
      if (isParticipant) {
        await this.budgetsService.checkBudgetAndNotify(budget.id, userId);
      }
    }

    return { msg: 'Expense created successfully', expense };
  }

  // Helper method to link budgets to expense with distribution
  private async linkBudgetsToExpense(
    expenseId: string,
    totalAmount: number,
    userId: string,
    distributionType?: DistributionType,
    budgetLinks?: LinkItemDTO[],
    budgetIds?: string[],
  ): Promise<void> {
    // Skip if distribution is none
    if (distributionType === DistributionType.NONE) {
      return;
    }

    // Handle new budget_links format
    if (budgetLinks && budgetLinks.length > 0) {
      const linkCount = budgetLinks.length;

      for (const linkItem of budgetLinks) {
        const budget = await this.budgetsRepo.findOne({
          where: { id: linkItem.id },
        });
        if (!budget) {
          throw new NotFoundException(`Budget ${linkItem.id} not found`);
        }

        // Calculate amount based on distribution type
        let linkAmount: number;
        switch (distributionType) {
          case DistributionType.MANUAL:
            linkAmount = linkItem.amount ?? totalAmount;
            break;
          case DistributionType.EQUAL_SPLIT:
            linkAmount = totalAmount / linkCount;
            break;
          case DistributionType.HALF:
            linkAmount = totalAmount / 2;
            break;
          default:
            linkAmount = totalAmount;
        }

        // Create link
        const link = this.expenseBudgetRepo.create({
          expense_id: expenseId,
          budget_id: linkItem.id,
          amount: linkAmount.toFixed(2),
        });
        await this.expenseBudgetRepo.save(link);

        // Update budget spent amount
        await this.updateBudgetSpentAmount(linkItem.id, linkAmount, 'add');
        await this.budgetsService.checkBudgetAndNotify(linkItem.id, userId);
      }
    }
    // Legacy support for budget_ids
    else if (budgetIds && budgetIds.length > 0) {
      for (const budgetId of budgetIds) {
        const budget = await this.budgetsRepo.findOne({
          where: { id: budgetId },
        });
        if (!budget) {
          throw new NotFoundException(`Budget ${budgetId} not found`);
        }

        // Create link with full amount (legacy behavior)
        const link = this.expenseBudgetRepo.create({
          expense_id: expenseId,
          budget_id: budgetId,
          amount: totalAmount.toString(),
        });
        await this.expenseBudgetRepo.save(link);

        // Update budget spent amount
        await this.updateBudgetSpentAmount(budgetId, totalAmount, 'add');
        await this.budgetsService.checkBudgetAndNotify(budgetId, userId);
      }
    }
  }

  // Helper method to link savings goals to expense with distribution
  private async linkSavingsGoalsToExpense(
    expenseId: string,
    totalAmount: number,
    userId: string,
    distributionType?: DistributionType,
    savingsGoalLinks?: LinkItemDTO[],
    savingsGoalIds?: string[],
  ): Promise<void> {
    // Skip if distribution is none
    if (distributionType === DistributionType.NONE) {
      return;
    }

    // Handle new savings_goal_links format
    if (savingsGoalLinks && savingsGoalLinks.length > 0) {
      const linkCount = savingsGoalLinks.length;

      for (const linkItem of savingsGoalLinks) {
        const goal = await this.savingsGoalRepo.findOne({
          where: { id: linkItem.id, user_id: userId },
        });
        if (!goal) {
          throw new NotFoundException(`Savings goal ${linkItem.id} not found`);
        }

        // Calculate amount based on distribution type
        let linkAmount: number;
        switch (distributionType) {
          case DistributionType.MANUAL:
            linkAmount = linkItem.amount ?? totalAmount;
            break;
          case DistributionType.EQUAL_SPLIT:
            linkAmount = totalAmount / linkCount;
            break;
          case DistributionType.HALF:
            linkAmount = totalAmount / 2;
            break;
          default:
            linkAmount = totalAmount;
        }

        // Create link
        const link = this.expenseSavingsGoalRepo.create({
          expense_id: expenseId,
          savings_goal_id: linkItem.id,
          amount: linkAmount.toFixed(2),
        });
        await this.expenseSavingsGoalRepo.save(link);

        // Withdraw from savings goal
        await this.savingsGoalsService.withdrawFromSavingsGoal(
          userId,
          linkItem.id,
          linkAmount,
        );
      }
    }
    // Legacy support for savings_goal_ids
    else if (savingsGoalIds && savingsGoalIds.length > 0) {
      for (const goalId of savingsGoalIds) {
        const goal = await this.savingsGoalRepo.findOne({
          where: { id: goalId, user_id: userId },
        });
        if (!goal) {
          throw new NotFoundException(`Savings goal ${goalId} not found`);
        }

        // Create link with full amount (legacy behavior)
        const link = this.expenseSavingsGoalRepo.create({
          expense_id: expenseId,
          savings_goal_id: goalId,
          amount: totalAmount.toString(),
        });
        await this.expenseSavingsGoalRepo.save(link);

        // Withdraw from savings goal
        await this.savingsGoalsService.withdrawFromSavingsGoal(
          userId,
          goalId,
          totalAmount,
        );
      }
    }
  }

  // Helper method to update budget spent_amount
  private async updateBudgetSpentAmount(
    budgetId: string,
    amount: number,
    operation: 'add' | 'subtract',
  ): Promise<void> {
    const budget = await this.budgetsRepo.findOne({ where: { id: budgetId } });
    if (!budget) return;

    const currentSpent = parseFloat(budget.spent_amount) || 0;
    const newSpent =
      operation === 'add'
        ? currentSpent + amount
        : Math.max(0, currentSpent - amount);

    budget.spent_amount = newSpent.toFixed(2);
    await this.budgetsRepo.save(budget);
  }

  // Get all expenses for a user
  async getAllExpenses(userId: string): Promise<any[]> {
    const expenses = await this.expensesRepo.find({
      where: { user_id: userId },
      order: { date: 'DESC' },
    });

    // Get linked budget and savings goal IDs for each expense
    const result = await Promise.all(
      expenses.map(async (expense) => {
        const budgetLinks = await this.expenseBudgetRepo.find({
          where: { expense_id: expense.id },
        });
        const savingsGoalLinks = await this.expenseSavingsGoalRepo.find({
          where: { expense_id: expense.id },
        });

        return {
          ...expense,
          linkedBudgetIds: budgetLinks.map((link) => link.budget_id),
          linkedSavingsGoalIds: savingsGoalLinks.map(
            (link) => link.savings_goal_id,
          ),
        };
      }),
    );

    return result;
  }

  // Get expense by ID
  async getExpenseById(id: string, userId: string): Promise<any> {
    const expense = await this.expensesRepo.findOne({
      where: { id, user_id: userId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Get linked IDs
    const budgetLinks = await this.expenseBudgetRepo.find({
      where: { expense_id: expense.id },
    });
    const savingsGoalLinks = await this.expenseSavingsGoalRepo.find({
      where: { expense_id: expense.id },
    });

    return {
      ...expense,
      linkedBudgetIds: budgetLinks.map((link) => link.budget_id),
      linkedSavingsGoalIds: savingsGoalLinks.map(
        (link) => link.savings_goal_id,
      ),
    };
  }

  // Update expense
  async updateExpense(
    id: string,
    payload: UpdateExpenseDTO,
    userId: string,
  ): Promise<object> {
    const expense = await this.expensesRepo.findOne({
      where: { id, user_id: userId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const expenseAmount = payload.amount ?? parseFloat(expense.amount);

    if (payload.category_id) {
      const category = await this.categoriesRepo.findOne({
        where: { id: payload.category_id },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Get existing links
    const existingBudgetLinks = await this.expenseBudgetRepo.find({
      where: { expense_id: id },
    });
    const existingBudgetIds = existingBudgetLinks.map((link) => link.budget_id);

    const existingSavingsLinks = await this.expenseSavingsGoalRepo.find({
      where: { expense_id: id },
    });
    const existingSavingsIds = existingSavingsLinks.map(
      (link) => link.savings_goal_id,
    );

    // Handle budget linking with distribution types (new format)
    if (
      payload.budget_links &&
      payload.budget_links.length > 0 &&
      payload.budget_distribution !== DistributionType.NONE
    ) {
      const newBudgetLinks = payload.budget_links.filter(
        (link) => !existingBudgetIds.includes(link.id),
      );
      if (newBudgetLinks.length > 0) {
        await this.linkBudgetsToExpense(
          id,
          expenseAmount,
          userId,
          payload.budget_distribution,
          newBudgetLinks,
          undefined,
        );
      }
    }
    // Legacy support for budget_ids
    else if (payload.budget_ids && payload.budget_ids.length > 0) {
      for (const budgetId of payload.budget_ids) {
        // Skip if already linked
        if (existingBudgetIds.includes(budgetId)) {
          continue;
        }

        const budget = await this.budgetsRepo.findOne({
          where: { id: budgetId },
        });
        if (!budget) {
          throw new NotFoundException(`Budget ${budgetId} not found`);
        }

        // Create link
        const link = this.expenseBudgetRepo.create({
          expense_id: id,
          budget_id: budgetId,
          amount: expenseAmount.toString(),
        });
        await this.expenseBudgetRepo.save(link);

        // Update budget spent amount
        await this.updateBudgetSpentAmount(budgetId, expenseAmount, 'add');
        await this.budgetsService.checkBudgetAndNotify(budgetId, userId);
      }
    }

    // Handle savings goal linking with distribution types (new format)
    if (
      payload.savings_goal_links &&
      payload.savings_goal_links.length > 0 &&
      payload.savings_goal_distribution !== DistributionType.NONE
    ) {
      const newSavingsLinks = payload.savings_goal_links.filter(
        (link) => !existingSavingsIds.includes(link.id),
      );
      if (newSavingsLinks.length > 0) {
        await this.linkSavingsGoalsToExpense(
          id,
          expenseAmount,
          userId,
          payload.savings_goal_distribution,
          newSavingsLinks,
          undefined,
        );
      }
    }
    // Legacy support for savings_goal_ids
    else if (payload.savings_goal_ids && payload.savings_goal_ids.length > 0) {
      for (const goalId of payload.savings_goal_ids) {
        // Skip if already linked
        if (existingSavingsIds.includes(goalId)) {
          continue;
        }

        const goal = await this.savingsGoalRepo.findOne({
          where: { id: goalId, user_id: userId },
        });
        if (!goal) {
          throw new NotFoundException(`Savings goal ${goalId} not found`);
        }

        // Create link
        const link = this.expenseSavingsGoalRepo.create({
          expense_id: id,
          savings_goal_id: goalId,
          amount: expenseAmount.toString(),
        });
        await this.expenseSavingsGoalRepo.save(link);

        // Withdraw from savings goal
        await this.savingsGoalsService.withdrawFromSavingsGoal(
          userId,
          goalId,
          expenseAmount,
        );
      }
    }

    // Update basic expense fields
    const updateData: any = {};
    if (payload.description !== undefined)
      updateData.description = payload.description;
    if (payload.amount !== undefined)
      updateData.amount = payload.amount.toString();
    if (payload.category_id !== undefined)
      updateData.category_id = payload.category_id;
    if (payload.date !== undefined) updateData.date = payload.date;
    if (payload.payment_method !== undefined)
      updateData.payment_method = payload.payment_method;
    if (payload.notes !== undefined) updateData.notes = payload.notes;
    if (payload.tags !== undefined) updateData.tags = payload.tags;
    if (payload.location !== undefined) updateData.location = payload.location;
    if (payload.currency !== undefined) updateData.currency = payload.currency;

    if (Object.keys(updateData).length > 0) {
      await this.expensesRepo.update(id, updateData);
    }

    return { msg: 'Expense updated successfully' };
  }

  // Delete expense
  async deleteExpense(id: string, userId: string): Promise<object> {
    const expense = await this.expensesRepo.findOne({
      where: { id, user_id: userId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const amount = parseFloat(expense.amount) || 0;

    // Revert all budget links
    const budgetLinks = await this.expenseBudgetRepo.find({
      where: { expense_id: id },
    });
    for (const link of budgetLinks) {
      await this.updateBudgetSpentAmount(link.budget_id, amount, 'subtract');
    }

    // Revert all savings goal links
    const savingsLinks = await this.expenseSavingsGoalRepo.find({
      where: { expense_id: id },
    });
    for (const link of savingsLinks) {
      await this.savingsGoalsService.addToSavingsGoal(
        userId,
        link.savings_goal_id,
        amount,
      );
    }

    // Delete the expense (cascade will delete links)
    await this.expensesRepo.delete(id);

    return { msg: 'Expense deleted successfully' };
  }

  // Get expenses by category
  async getExpensesByCategory(
    categoryId: string,
    userId: string,
  ): Promise<Expense[]> {
    return this.expensesRepo.find({
      where: { category_id: categoryId, user_id: userId },
      order: { date: 'DESC' },
    });
  }

  // Get expenses by date range
  async getExpensesByDateRange(
    startDate: Date,
    endDate: Date,
    userId: string,
  ): Promise<Expense[]> {
    return this.expensesRepo.find({
      where: {
        user_id: userId,
        date: Between(startDate, endDate),
      },
      order: { date: 'DESC' },
    });
  }

  // Search expenses
  async searchExpenses(query: string, userId: string): Promise<Expense[]> {
    return this.expensesRepo
      .createQueryBuilder('expense')
      .where('expense.user_id = :userId', { userId })
      .andWhere(
        '(LOWER(expense.description) LIKE LOWER(:query) OR LOWER(expense.notes) LIKE LOWER(:query))',
        { query: `%${query}%` },
      )
      .orderBy('expense.date', 'DESC')
      .getMany();
  }

  // Get expense summary
  async getExpenseSummary(userId: string, period?: string): Promise<object> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    const periodType = period || 'monthly';

    switch (periodType) {
      case 'weekly':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
        break;
    }

    return this.expenseAnalyticsService.getExpensesSummary(
      userId,
      startDate,
      endDate,
      periodType,
    );
  }

  // Get all tags for a user
  async getAllTags(userId: string): Promise<string[]> {
    const expenses = await this.expensesRepo.find({
      where: { user_id: userId },
      select: ['tags'],
    });

    const allTags = expenses
      .filter((e) => e.tags && e.tags.length > 0)
      .flatMap((e) => e.tags as string[]);

    return [...new Set(allTags)];
  }

  // Get total expenses for a budget's category within its period
  async getTotalExpensesForBudget(
    categoryId: string,
    userId: string,
    periodType: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const expenses = await this.expensesRepo.find({
      where: {
        category_id: categoryId,
        user_id: userId,
        date: Between(startDate, endDate),
      },
    });

    return expenses.reduce(
      (total, expense) => total + parseFloat(expense.amount),
      0,
    );
  }

  // Unlink expense from budgets and/or savings goals (restores money)
  async unlinkExpense(
    expenseId: string,
    userId: string,
    budgetIds?: string[],
    savingsGoalIds?: string[],
  ): Promise<object> {
    const expense = await this.expensesRepo.findOne({
      where: { id: expenseId, user_id: userId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const unlinkedBudgets: string[] = [];
    const unlinkedSavingsGoals: string[] = [];

    // Unlink from budgets and restore spent_amount
    if (budgetIds && budgetIds.length > 0) {
      for (const budgetId of budgetIds) {
        const link = await this.expenseBudgetRepo.findOne({
          where: { expense_id: expenseId, budget_id: budgetId },
        });

        if (link) {
          const linkedAmount = parseFloat(link.amount) || 0;

          // Restore budget spent_amount
          await this.updateBudgetSpentAmount(
            budgetId,
            linkedAmount,
            'subtract',
          );

          // Delete the link
          await this.expenseBudgetRepo.remove(link);
          unlinkedBudgets.push(budgetId);
        }
      }
    }

    // Unlink from savings goals and restore current_amount
    if (savingsGoalIds && savingsGoalIds.length > 0) {
      for (const goalId of savingsGoalIds) {
        const link = await this.expenseSavingsGoalRepo.findOne({
          where: { expense_id: expenseId, savings_goal_id: goalId },
        });

        if (link) {
          const linkedAmount = parseFloat(link.amount) || 0;

          // Restore savings goal current_amount (add back the withdrawn amount)
          await this.savingsGoalsService.addToSavingsGoal(
            userId,
            goalId,
            linkedAmount,
          );

          // Delete the link
          await this.expenseSavingsGoalRepo.remove(link);
          unlinkedSavingsGoals.push(goalId);
        }
      }
    }

    return {
      msg: 'Expense unlinked successfully',
      unlinkedBudgets,
      unlinkedSavingsGoals,
    };
  }
}
