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

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget) private readonly budgetsRepo: Repository<Budget>,
  ) {}

  async getAllBudgets(userId: string): Promise<Budget[]> {
    return this.budgetsRepo.find({
      where: { created_by: { id: userId } },
      relations: ['category', 'created_by', 'participants'],
    });
  }

  async getBudgetById(id: string, userId: string): Promise<Budget> {
    const budget = await this.budgetsRepo.findOne({
      where: { id },
      relations: ['category', 'created_by', 'participants'],
    });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    // Check if user owns this budget
    if (budget.created_by.id !== userId) {
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
      category: category ? ({ id: category } as any) : undefined,
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
    if (category) budget.category = { id: category } as any;
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
}
