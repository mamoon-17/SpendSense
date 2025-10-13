import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from './expenses.entity';
import { Category } from '../categories/categories.entity';
import { CreateExpenseDTO } from 'src/dtos/createExpense.dto';
import { UpdateExpenseDTO } from 'src/dtos/updateExpense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
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

    const expense = this.expensesRepo.create({
      ...payload,
      amount: payload.amount.toString(),
      user_id: userId,
    });

    await this.expensesRepo.save(expense);

    return { msg: 'Expense created successfully', expense };
  }

  // Get all expenses for a user
  async getAllExpenses(userId: string): Promise<Expense[]> {
    return this.expensesRepo.find({
      where: { user_id: userId },
      order: { date: 'DESC' },
    });
  }

  // Get expense by ID
  async getExpenseById(id: string, userId: string): Promise<Expense> {
    const expense = await this.expensesRepo.findOne({
      where: { id, user_id: userId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  // Update expense
  async updateExpense(
    id: string,
    payload: UpdateExpenseDTO,
    userId: string,
  ): Promise<object> {
    const expense = await this.getExpenseById(id, userId);

    if (payload.category_id) {
      const category = await this.categoriesRepo.findOne({
        where: { id: payload.category_id },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const updateData: any = { ...payload };
    if (payload.amount !== undefined) {
      updateData.amount = payload.amount.toString();
    }

    await this.expensesRepo.update(id, updateData);

    return { msg: 'Expense updated successfully' };
  }

  // Delete expense
  async deleteExpense(id: string, userId: string): Promise<object> {
    const expense = await this.getExpenseById(id, userId);
    await this.expensesRepo.delete(id);

    return { msg: 'Expense deleted successfully' };
  }

  // Get expenses summary/analytics
  async getExpensesSummary(userId: string, period?: string): Promise<object> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    // Determine date range based on period
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

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

    // Get category breakdown
    const categoryMap = new Map<string, number>();
    expenses.forEach((exp) => {
      const current = categoryMap.get(exp.category_id) || 0;
      categoryMap.set(exp.category_id, current + parseFloat(exp.amount));
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(
      ([categoryId, amount]) => ({
        category_id: categoryId,
        amount: amount.toFixed(2),
      }),
    );

    // Find most expensive category
    let topCategory: string | null = null;
    let topAmount = 0;
    categoryBreakdown.forEach((cat) => {
      if (parseFloat(cat.amount) > topAmount) {
        topAmount = parseFloat(cat.amount);
        topCategory = cat.category_id;
      }
    });

    return {
      total_spent: totalSpent.toFixed(2),
      average_transaction: avgTransaction.toFixed(2),
      total_transactions: expenses.length,
      categorized_count: expenses.filter((e) => e.category_id).length,
      top_category: topCategory,
      category_breakdown: categoryBreakdown,
      period: period || 'month',
    };
  }

  // Filter expenses by category
  async getExpensesByCategory(
    userId: string,
    categoryId: string,
  ): Promise<Expense[]> {
    if (categoryId === 'all') {
      return this.getAllExpenses(userId);
    }

    return this.expensesRepo.find({
      where: { user_id: userId, category_id: categoryId },
      order: { date: 'DESC' },
    });
  }

  // Filter expenses by date range
  async getExpensesByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Expense[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.expensesRepo.find({
      where: {
        user_id: userId,
        date: Between(start, end),
      },
      order: { date: 'DESC' },
    });
  }

  // Search expenses by description, location, tags
  async searchExpenses(userId: string, query: string): Promise<Expense[]> {
    const expenses = await this.expensesRepo
      .createQueryBuilder('expense')
      .where('expense.user_id = :userId', { userId })
      .andWhere(
        '(LOWER(expense.description) LIKE LOWER(:query) OR LOWER(expense.location) LIKE LOWER(:query) OR LOWER(expense.notes) LIKE LOWER(:query))',
        { query: `%${query}%` },
      )
      .orderBy('expense.date', 'DESC')
      .getMany();

    return expenses;
  }

  // Get expenses by tags
  async getExpensesByTags(userId: string, tags: string[]): Promise<Expense[]> {
    const expenses = await this.expensesRepo
      .createQueryBuilder('expense')
      .where('expense.user_id = :userId', { userId })
      .andWhere('expense.tags && :tags', { tags })
      .orderBy('expense.date', 'DESC')
      .getMany();

    return expenses;
  }
}
