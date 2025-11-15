import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Budget } from './budgets.entity';
import { Repository } from 'typeorm';
import { CreateBudgetDTO } from '../budgets/dtos/createBudget.dto';
import { UpdateBudgetDTO } from '../budgets/dtos/updateBudget.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget) private readonly budgetsRepo: Repository<Budget>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getAllBudgets(): Promise<Budget[]> {
    return this.budgetsRepo.find({
      relations: ['category', 'created_by', 'participants'],
    });
  }

  async getBudgetById(id: string): Promise<Budget> {
    const budget = await this.budgetsRepo.findOne({
      where: { id },
      relations: ['category', 'created_by', 'participants'],
    });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return budget;
  }

  async createBudget(payload: CreateBudgetDTO): Promise<object> {
    const { category, created_by, participants, ...rest } =
      payload as CreateBudgetDTO;
    const newBudget = this.budgetsRepo.create({
      ...rest,
      period: (payload as any).period,
      category: category ? ({ id: category } as any) : undefined,
      created_by: created_by ? ({ id: created_by } as any) : undefined,
      participants: participants
        ? participants.map((id) => ({ id }) as any)
        : undefined,
    } as any);
    await this.budgetsRepo.save(newBudget);
    return { msg: 'Budget created successfully' };
  }

  async updateBudget(id: string, payload: UpdateBudgetDTO): Promise<object> {
    const budget = await this.budgetsRepo.findOne({
      where: { id },
      relations: ['participants'],
    });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    const { category, created_by, participants, ...rest } =
      payload as UpdateBudgetDTO;
    Object.assign(budget, rest);
    if ((payload as any).period) budget.period = (payload as any).period;
    if (category) budget.category = { id: category } as any;
    if (created_by) budget.created_by = { id: created_by } as any;
    if (participants)
      budget.participants = participants.map(
        (userId) => ({ id: userId }) as any,
      );

    await this.budgetsRepo.save(budget);
    return { msg: 'Budget updated successfully' };
  }

  async deleteBudget(id: string): Promise<object> {
    const budget = await this.budgetsRepo.findOne({ where: { id } });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    await this.budgetsRepo.delete(id);
    return { msg: 'Budget deleted successfully' };
  }

  // Check budget status and send notifications if needed
  async checkBudgetAndNotify(budgetId: string, userId: string): Promise<void> {
    const budget = await this.getBudgetById(budgetId);

    const totalAmount = parseFloat(budget.total_amount as any);
    const spentAmount = parseFloat(budget.spent_amount as any);
    const percentage = (spentAmount / totalAmount) * 100;

    // Send alert at 85% threshold
    if (percentage >= 85 && percentage < 100) {
      await this.notificationsService.notifyBudgetAlert(
        userId,
        budget.name,
        Math.round(percentage),
        spentAmount,
        totalAmount,
      );
    }

    // Send exceeded notification at 100% or more
    if (percentage >= 100) {
      await this.notificationsService.notifyBudgetExceeded(
        userId,
        budget.name,
        spentAmount,
        totalAmount,
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
        await this.notificationsService.notifyCollaboratorJoined(
          participant.id,
          collaboratorName,
          budget.name,
        );
      }
    }
  }
}
