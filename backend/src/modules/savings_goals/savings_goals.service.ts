import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SavingsGoal,
  SavingsGoalStatus,
  SavingsGoalPriority,
} from './savings_goals.entity';
import { CreateSavingsGoalDTO } from './dtos/createSavingsGoal.dto';
import { UpdateSavingsGoalDTO } from './dtos/updateSavingsGoal.dto';
import { SavingsGoalCalculator } from './savings-goal-calculator.service';
import { SavingsGoalNotificationService } from './savings-goal-notification.service';

@Injectable()
export class SavingsGoalsService {
  constructor(
    @InjectRepository(SavingsGoal)
    private readonly savingsGoalRepo: Repository<SavingsGoal>,
    private readonly savingsGoalCalculator: SavingsGoalCalculator,
    private readonly savingsGoalNotificationService: SavingsGoalNotificationService,
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
      priority: data.priority as SavingsGoalPriority,
      monthly_target: data.monthly_target
        ? data.monthly_target.toString()
        : null,
      user_id: userId,
      status: SavingsGoalStatus.ACTIVE,
      auto_save: false,
      currency: data.currency || 'USD',
    });

    const savedGoal = (await this.savingsGoalRepo.save(
      savingsGoal,
    )) as SavingsGoal;

    return {
      msg: 'Savings goal created successfully',
      goal: savedGoal,
    };
  }

  // Get all savings goals for a user (raw data without heavy calculations)
  async getAllSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    return this.savingsGoalRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  // Get a single savings goal by ID
  async getSavingsGoalById(userId: string, goalId: string): Promise<any> {
    const goal = await this.savingsGoalRepo.findOne({
      where: { id: goalId, user_id: userId },
    });

    if (!goal) {
      throw new NotFoundException('Savings goal not found');
    }

    return this.savingsGoalCalculator.calculateGoalProgress(goal);
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
      goal: this.savingsGoalCalculator.calculateGoalProgress(updatedGoal),
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
    const oldPercentage = (currentAmount / targetAmount) * 100;
    const newAmount = currentAmount + amount;
    const newPercentage = (newAmount / targetAmount) * 100;

    goal.current_amount = newAmount.toString();

    // Auto-update status if goal is reached
    if (newAmount >= targetAmount) {
      goal.status = SavingsGoalStatus.COMPLETED;

      // Send goal achieved notification
      await this.savingsGoalNotificationService.notifySavingsGoalAchieved(
        userId,
        goal.name,
        targetAmount,
      );
    } else {
      // Check for milestone notifications
      const milestone = this.savingsGoalCalculator.calculateMilestone(
        oldPercentage,
        newPercentage,
      );
      if (milestone) {
        await this.savingsGoalNotificationService.notifySavingsGoalMilestone(
          userId,
          goal.name,
          Math.round(newPercentage),
          newAmount,
          targetAmount,
        );
      }
    }

    const updatedGoal = await this.savingsGoalRepo.save(goal);

    return {
      msg: 'Amount added successfully',
      goal: this.savingsGoalCalculator.calculateGoalProgress(updatedGoal),
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
    const newAmount = currentAmount - amount; // Allow negative values

    goal.current_amount = newAmount.toString();

    // Update status if withdrawn
    if (goal.status === SavingsGoalStatus.COMPLETED) {
      goal.status = SavingsGoalStatus.ACTIVE;
    }

    const updatedGoal = await this.savingsGoalRepo.save(goal);

    return {
      msg: 'Amount withdrawn successfully',
      goal: this.savingsGoalCalculator.calculateGoalProgress(updatedGoal),
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

    return goals.map((goal) =>
      this.savingsGoalCalculator.calculateGoalProgress(goal),
    );
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

    return goals.map((goal) =>
      this.savingsGoalCalculator.calculateGoalProgress(goal),
    );
  }
}
