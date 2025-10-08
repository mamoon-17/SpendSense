import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Budget } from './budgets.entity';
import { Repository } from 'typeorm';
import { CreateBudgetDTO } from '../budgets/dtos/createBudget.dto';
import { UpdateBudgetDTO } from '../budgets/dtos/updateBudget.dto';

@Injectable()
export class BudgetsService {
	constructor(@InjectRepository(Budget) private readonly budgetsRepo: Repository<Budget>) {}

	async getAllBudgets(): Promise<Budget[]> {
		return this.budgetsRepo.find({ relations: ['category', 'created_by', 'participants'] });
	}

	async getBudgetById(id: string): Promise<Budget> {
		const budget = await this.budgetsRepo.findOne({ where: { id }, relations: ['category', 'created_by', 'participants'] });
		if (!budget) {
			throw new NotFoundException('Budget not found');
		}
		return budget;
	}

	async createBudget(payload: CreateBudgetDTO): Promise<object> {
		const { category, created_by, participants, ...rest } = payload as CreateBudgetDTO;
		const newBudget = this.budgetsRepo.create({
			...rest,
			period: (payload as any).period,
			category: category ? ({ id: category } as any) : undefined,
			created_by: created_by ? ({ id: created_by } as any) : undefined,
			participants: participants ? participants.map((id) => ({ id } as any)) : undefined,
		} as any);
		await this.budgetsRepo.save(newBudget);
		return { msg: 'Budget created successfully' };
	}

	async updateBudget(id: string, payload: UpdateBudgetDTO): Promise<object> {
		const budget = await this.budgetsRepo.findOne({ where: { id }, relations: ['participants'] });
		if (!budget) {
			throw new NotFoundException('Budget not found');
		}
		const { category, created_by, participants, ...rest } = payload as UpdateBudgetDTO;
		Object.assign(budget, rest);
		if ((payload as any).period) budget.period = (payload as any).period;
		if (category) budget.category = { id: category } as any;
		if (created_by) budget.created_by = { id: created_by } as any;
		if (participants) budget.participants = participants.map((userId) => ({ id: userId } as any));

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
}
