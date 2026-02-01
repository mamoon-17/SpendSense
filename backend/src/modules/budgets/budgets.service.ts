import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Budget } from './budgets.entity';
import { Repository } from 'typeorm';
import { CreateBudgetDTO } from '../budgets/dtos/createBudget.dto';
import { UpdateBudgetDTO } from '../budgets/dtos/updateBudget.dto';
import { EventBusService } from 'src/common/events/event-bus.service';
import {
  BudgetExceededEvent,
  BudgetAlertEvent,
  BudgetCollaboratorJoinedEvent,
} from 'src/common/events/domain-events';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget) private readonly budgetsRepo: Repository<Budget>,
    private readonly eventBus: EventBusService,
  ) {}

  async getAllBudgets(userId: string): Promise<Budget[]> {
    return this.budgetsRepo
      .createQueryBuilder('budget')
      .leftJoinAndSelect('budget.category', 'category')
      .leftJoin('budget.created_by', 'created_by')
      .addSelect(['created_by.id', 'created_by.name', 'created_by.username'])
      .leftJoin('budget.participants', 'participants')
      .addSelect([
        'participants.id',
        'participants.name',
        'participants.username',
      ])
      .where('created_by.id = :userId', { userId })
      .orderBy('budget.start_date', 'DESC')
      .getMany();
  }

  async getAllBudgetsEnhanced(userId: string): Promise<any> {
    const budgets = await this.budgetsRepo
      .createQueryBuilder('budget')
      .leftJoinAndSelect('budget.category', 'category')
      .leftJoin('budget.created_by', 'created_by')
      .addSelect(['created_by.id', 'created_by.name', 'created_by.username'])
      .leftJoin('budget.participants', 'participants')
      .addSelect([
        'participants.id',
        'participants.name',
        'participants.username',
      ])
      .where('created_by.id = :userId', { userId })
      .orderBy('budget.start_date', 'DESC')
      .getMany();

    const enhancedBudgets = budgets.map((budget) => {
      const totalAmount = parseFloat(budget.total_amount as any);
      const spentAmount = parseFloat(budget.spent_amount as any);
      const remaining = totalAmount - spentAmount;
      const percentage =
        totalAmount > 0 ? (spentAmount / totalAmount) * 100 : 0;

      let status = 'on-track';
      if (percentage >= 100) status = 'over-budget';
      else if (percentage >= 80) status = 'warning';

      return {
        ...budget,
        totalAmount,
        spent: spentAmount,
        remaining,
        percentage: Math.round(percentage),
        status,
        participantCount: budget.participants?.length || 0,
      };
    });

    const healthSummary = {
      onTrack: enhancedBudgets.filter((b) => b.status === 'on-track').length,
      warning: enhancedBudgets.filter((b) => b.status === 'warning').length,
      overBudget: enhancedBudgets.filter((b) => b.status === 'over-budget')
        .length,
    };

    const categoryMap = new Map<string, { name: string; amount: number }>();
    enhancedBudgets.forEach((budget) => {
      const categoryName = budget.category?.name || 'Uncategorized';
      const existing = categoryMap.get(categoryName);
      if (existing) {
        existing.amount += budget.totalAmount;
      } else {
        categoryMap.set(categoryName, {
          name: categoryName,
          amount: budget.totalAmount,
        });
      }
    });

    const topCategories = Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    return {
      budgets: enhancedBudgets,
      healthSummary,
      topCategories,
    };
  }

  async getBudgetById(id: string, userId?: string): Promise<Budget> {
    const budget = await this.budgetsRepo.findOne({
      where: { id },
      relations: ['category', 'created_by', 'participants'],
    });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    // If userId is provided, check if the user owns this budget
    if (userId && budget.created_by.id !== userId) {
      throw new ForbiddenException('You do not have access to this budget');
    }
    return budget;
  }

  async createBudget(
    payload: CreateBudgetDTO,
    userId: string,
  ): Promise<object> {
    const { category, created_by, participants, ...rest } =
      payload as CreateBudgetDTO;
    const newBudget = this.budgetsRepo.create({
      ...rest,
      period: (payload as any).period,
      category: category && category !== '' ? ({ id: category } as any) : null,
      created_by: { id: userId } as any, // Always use the authenticated user
      participants: participants
        ? participants.map((id) => ({ id }) as any)
        : undefined,
    } as any);
    await this.budgetsRepo.save(newBudget);
    return { msg: 'Budget created successfully' };
  }

  async updateBudget(
    id: string,
    payload: UpdateBudgetDTO,
    userId: string,
  ): Promise<object> {
    const budget = await this.budgetsRepo.findOne({
      where: { id },
      relations: ['created_by', 'participants'],
    });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    // Check if user owns this budget
    if (budget.created_by.id !== userId) {
      throw new ForbiddenException('Only the creator can update this budget');
    }
    const { category, created_by, participants, ...rest } =
      payload as UpdateBudgetDTO;
    Object.assign(budget, rest);
    if ((payload as any).period) budget.period = (payload as any).period;
    if (category && category !== '') budget.category = { id: category } as any;
    else if (category === '') (budget as any).category = null;
    if (participants)
      budget.participants = participants.map(
        (userId) => ({ id: userId }) as any,
      );

    await this.budgetsRepo.save(budget);
    return { msg: 'Budget updated successfully' };
  }

  async deleteBudget(id: string, userId: string): Promise<object> {
    const budget = await this.budgetsRepo.findOne({
      where: { id },
      relations: ['created_by'],
    });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    // Check if user owns this budget
    if (budget.created_by.id !== userId) {
      throw new ForbiddenException('Only the creator can delete this budget');
    }
    await this.budgetsRepo.delete(id);
    return { msg: 'Budget deleted successfully' };
  }

  async checkBudgetAndNotify(budgetId: string, userId: string): Promise<void> {
    const budget = await this.getBudgetById(budgetId, userId);

    const totalAmount = parseFloat(budget.total_amount as any);
    const spentAmount = parseFloat(budget.spent_amount as any);
    const percentage = (spentAmount / totalAmount) * 100;
    // Send alert at 85% threshold
    if (percentage >= 85 && percentage < 100) {
      await this.eventBus.publish(
        new BudgetAlertEvent(userId, budget.name, Math.round(percentage)),
      );
    }

    // Send exceeded notification at 100% or more
    if (percentage >= 100) {
      await this.eventBus.publish(
        new BudgetExceededEvent(userId, budget.name, spentAmount, totalAmount),
      );
    }
  }

  // Add collaborator notification
  async notifyCollaboratorAdded(
    budgetId: string,
    collaboratorId: string,
    collaboratorName: string,
  ): Promise<void> {
    const budget = await this.getBudgetById(budgetId);

    // Notify all existing participants
    for (const participant of budget.participants) {
      if (participant.id !== collaboratorId) {
        await this.eventBus.publish(
          new BudgetCollaboratorJoinedEvent(
            participant.id,
            collaboratorName,
            budget.name,
          ),
        );
      }
    }
  }

  // Reset budget spending to 0
  async resetBudgetSpending(id: string, userId: string): Promise<object> {
    const budget = await this.budgetsRepo.findOne({
      where: { id },
      relations: ['created_by'],
    });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    // Check if user owns this budget
    if (budget.created_by.id !== userId) {
      throw new ForbiddenException('Only the creator can reset this budget');
    }

    budget.spent_amount = '0.00';
    await this.budgetsRepo.save(budget);

    return { msg: 'Budget spending reset successfully' };
  }
}
