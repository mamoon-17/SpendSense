import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavingsGoal, SavingsGoalStatus } from './savings_goals.entity';
import { CreateSavingsGoalDTO } from '../../dtos/createSavingsGoal.dto';
import { UpdateSavingsGoalDTO } from '../../dtos/updateSavingsGoal.dto';

@Injectable()
export class SavingsGoalsService {
  constructor(
    @InjectRepository(SavingsGoal)
    private readonly savingsGoalRepo: Repository<SavingsGoal>,
  ) {}

  // Create a new savings goal
  async createSavingsGoal(
    userId: string,
    data: CreateSavingsGoalDTO,
  ): Promise<{ msg: string; goal: SavingsGoal }> {
    const savingsGoal = this.savingsGoalRepo.create({
      name: data.name,
      description: data.description || null,
      target_amount: data.target_amount.toString(),
      current_amount: (data.current_amount || 0).toString(),
      target_date: data.target_date,
      category_id: data.category_id,
      priority: data.priority,
      monthly_target: data.monthly_target
        ? data.monthly_target.toString()
        : null,
      user_id: userId,
      status: SavingsGoalStatus.ACTIVE,
      auto_save: false,
    });

    const savedGoal = await this.savingsGoalRepo.save(savingsGoal);

    return {
      msg: 'Savings goal created successfully',
      goal: savedGoal,
    };
  }

  // Get all savings goals for a user with progress calculations
  async getAllSavingsGoals(userId: string): Promise<any[]> {
    const goals = await this.savingsGoalRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    return goals.map((goal) => this.calculateGoalProgress(goal));
  }

  // Get a single savings goal by ID
  async getSavingsGoalById(userId: string, goalId: string): Promise<any> {
    const goal = await this.savingsGoalRepo.findOne({
      where: { id: goalId, user_id: userId },
    });

    if (!goal) {
      throw new NotFoundException('Savings goal not found');
    }

    return this.calculateGoalProgress(goal);
  }

  // Update a savings goal
  async updateSavingsGoal(
    userId: string,
    goalId: string,
    data: UpdateSavingsGoalDTO,
  ): Promise<{ msg: string; goal: any }> {
    const goal = await this.savingsGoalRepo.findOne({
      where: { id: goalId, user_id: userId },
    });

    if (!goal) {
      throw new NotFoundException('Savings goal not found');
    }

    // Update fields
    Object.assign(goal, data);

    const updatedGoal = await this.savingsGoalRepo.save(goal);

    return {
      msg: 'Savings goal updated successfully',
      goal: this.calculateGoalProgress(updatedGoal),
    };
  }

  // Add money to a savings goal
  async addToSavingsGoal(
    userId: string,
    goalId: string,
    amount: number,
  ): Promise<{ msg: string; goal: any }> {
    const goal = await this.savingsGoalRepo.findOne({
      where: { id: goalId, user_id: userId },
    });

    if (!goal) {
      throw new NotFoundException('Savings goal not found');
    }

    const currentAmount = parseFloat(goal.current_amount);
    const targetAmount = parseFloat(goal.target_amount);
    const newAmount = currentAmount + amount;

    goal.current_amount = newAmount.toString();

    // Auto-update status if goal is reached
    if (newAmount >= targetAmount) {
      goal.status = SavingsGoalStatus.COMPLETED;
    }

    const updatedGoal = await this.savingsGoalRepo.save(goal);

    return {
      msg: 'Amount added successfully',
      goal: this.calculateGoalProgress(updatedGoal),
    };
  }

  // Withdraw money from a savings goal
  async withdrawFromSavingsGoal(
    userId: string,
    goalId: string,
    amount: number,
  ): Promise<{ msg: string; goal: any }> {
    const goal = await this.savingsGoalRepo.findOne({
      where: { id: goalId, user_id: userId },
    });

    if (!goal) {
      throw new NotFoundException('Savings goal not found');
    }

    const currentAmount = parseFloat(goal.current_amount);
    const newAmount = Math.max(0, currentAmount - amount);

    goal.current_amount = newAmount.toString();

    // Update status if withdrawn
    if (goal.status === SavingsGoalStatus.COMPLETED) {
      goal.status = SavingsGoalStatus.ACTIVE;
    }

    const updatedGoal = await this.savingsGoalRepo.save(goal);

    return {
      msg: 'Amount withdrawn successfully',
      goal: this.calculateGoalProgress(updatedGoal),
    };
  }

  // Delete a savings goal
  async deleteSavingsGoal(
    userId: string,
    goalId: string,
  ): Promise<{ msg: string }> {
    const goal = await this.savingsGoalRepo.findOne({
      where: { id: goalId, user_id: userId },
    });

    if (!goal) {
      throw new NotFoundException('Savings goal not found');
    }

    await this.savingsGoalRepo.remove(goal);

    return { msg: 'Savings goal deleted successfully' };
  }

  // Get summary/statistics for dashboard
  async getSavingsGoalsSummary(userId: string): Promise<any> {
    const goals = await this.savingsGoalRepo.find({
      where: { user_id: userId },
    });

    const totalTarget = goals.reduce(
      (sum, goal) => sum + parseFloat(goal.target_amount),
      0,
    );

    const totalSaved = goals.reduce(
      (sum, goal) => sum + parseFloat(goal.current_amount),
      0,
    );

    const completedGoals = goals.filter(
      (goal) => goal.status === SavingsGoalStatus.COMPLETED,
    ).length;

    const activeGoals = goals.filter(
      (goal) =>
        goal.status === SavingsGoalStatus.ACTIVE ||
        goal.status === SavingsGoalStatus.ON_TRACK ||
        goal.status === SavingsGoalStatus.BEHIND,
    ).length;

    const totalMonthlyTarget = goals.reduce(
      (sum, goal) => sum + parseFloat(goal.monthly_target || '0'),
      0,
    );

    const progressPercentage =
      totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return {
      total_target: totalTarget.toFixed(2),
      total_saved: totalSaved.toFixed(2),
      progress_percentage: progressPercentage.toFixed(2),
      completed_goals: completedGoals,
      active_goals: activeGoals,
      total_goals: goals.length,
      monthly_target: totalMonthlyTarget.toFixed(2),
    };
  }

  // Filter by status
  async getSavingsGoalsByStatus(
    userId: string,
    status: SavingsGoalStatus | 'all',
  ): Promise<any[]> {
    let goals: SavingsGoal[];

    if (status === 'all') {
      goals = await this.savingsGoalRepo.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
      });
    } else {
      goals = await this.savingsGoalRepo.find({
        where: { user_id: userId, status },
        order: { created_at: 'DESC' },
      });
    }

    return goals.map((goal) => this.calculateGoalProgress(goal));
  }

  // Filter by priority
  async getSavingsGoalsByPriority(
    userId: string,
    priority: string,
  ): Promise<any[]> {
    const goals = await this.savingsGoalRepo.find({
      where: { user_id: userId, priority: priority as any },
      order: { created_at: 'DESC' },
    });

    return goals.map((goal) => this.calculateGoalProgress(goal));
  }

  // Calculate progress and time left for a goal
  private calculateGoalProgress(goal: SavingsGoal): any {
    const currentAmount = parseFloat(goal.current_amount);
    const targetAmount = parseFloat(goal.target_amount);
    const progressPercentage =
      targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

    const today = new Date();
    const targetDate = new Date(goal.target_date);
    const timeLeftMs = targetDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24));
    const monthsLeft = Math.ceil(daysLeft / 30);

    // Calculate if on track
    let calculatedStatus = goal.status;
    if (goal.status !== SavingsGoalStatus.COMPLETED) {
      if (daysLeft < 0) {
        calculatedStatus = SavingsGoalStatus.OVERDUE;
      } else if (progressPercentage >= 100) {
        calculatedStatus = SavingsGoalStatus.COMPLETED;
      } else {
        // Calculate expected progress
        const totalDays = Math.ceil(
          (targetDate.getTime() - new Date(goal.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const daysPassed = totalDays - daysLeft;
        const expectedProgress =
          totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

        if (progressPercentage >= expectedProgress - 10) {
          calculatedStatus = SavingsGoalStatus.ON_TRACK;
        } else {
          calculatedStatus = SavingsGoalStatus.BEHIND;
        }
      }
    }

    return {
      ...goal,
      progress_percentage: progressPercentage.toFixed(2),
      amount_remaining: (targetAmount - currentAmount).toFixed(2),
      days_left: daysLeft,
      months_left: monthsLeft,
      time_left_display:
        daysLeft < 0
          ? 'Overdue'
          : daysLeft === 0
            ? 'Today'
            : daysLeft === 1
              ? '1 day'
              : daysLeft < 30
                ? `${daysLeft} days`
                : `${monthsLeft} month${monthsLeft > 1 ? 's' : ''}`,
      calculated_status: calculatedStatus,
      is_completed: progressPercentage >= 100,
      is_overdue: daysLeft < 0 && progressPercentage < 100,
    };
  }
}
