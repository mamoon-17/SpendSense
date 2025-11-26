import { Injectable } from '@nestjs/common';
import { SavingsGoal, SavingsGoalStatus } from './savings_goals.entity';

export interface GoalProgress {
  progress_percentage: string;
  amount_remaining: string;
  days_left: number;
  months_left: number;
  time_left_display: string;
  calculated_status: SavingsGoalStatus;
  is_completed: boolean;
  is_overdue: boolean;
}

@Injectable()
export class SavingsGoalCalculator {
  calculateGoalProgress(goal: SavingsGoal): SavingsGoal & GoalProgress {
    const currentAmount = parseFloat(goal.current_amount);
    const targetAmount = parseFloat(goal.target_amount);
    const progressPercentage =
      targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

    const today = new Date();
    const targetDate = new Date(goal.target_date);
    const timeLeftMs = targetDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24));
    const monthsLeft = Math.ceil(daysLeft / 30);

    const calculatedStatus = this.determineStatus(
      goal,
      progressPercentage,
      daysLeft,
      targetDate,
    );

    return {
      ...goal,
      progress_percentage: progressPercentage.toFixed(2),
      amount_remaining: (targetAmount - currentAmount).toFixed(2),
      days_left: daysLeft,
      months_left: monthsLeft,
      time_left_display: this.formatTimeLeft(daysLeft),
      calculated_status: calculatedStatus,
      is_completed: progressPercentage >= 100,
      is_overdue: daysLeft < 0 && progressPercentage < 100,
    };
  }

  private determineStatus(
    goal: SavingsGoal,
    progressPercentage: number,
    daysLeft: number,
    targetDate: Date,
  ): SavingsGoalStatus {
    if (goal.status === SavingsGoalStatus.COMPLETED) {
      return SavingsGoalStatus.COMPLETED;
    }

    if (daysLeft < 0) {
      return SavingsGoalStatus.OVERDUE;
    }

    if (progressPercentage >= 100) {
      return SavingsGoalStatus.COMPLETED;
    }

    // Calculate expected progress
    const totalDays = Math.ceil(
      (targetDate.getTime() - new Date(goal.created_at).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const daysPassed = totalDays - daysLeft;
    const expectedProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

    if (progressPercentage >= expectedProgress - 10) {
      return SavingsGoalStatus.ON_TRACK;
    }

    return SavingsGoalStatus.BEHIND;
  }

  private formatTimeLeft(daysLeft: number): string {
    if (daysLeft < 0) return 'Overdue';
    if (daysLeft === 0) return 'Today';
    if (daysLeft === 1) return '1 day';
    if (daysLeft < 30) return `${daysLeft} days`;

    const monthsLeft = Math.ceil(daysLeft / 30);
    return `${monthsLeft} month${monthsLeft > 1 ? 's' : ''}`;
  }

  calculateMilestone(
    oldPercentage: number,
    newPercentage: number,
  ): number | null {
    const milestones = [25, 50, 75];
    for (const milestone of milestones) {
      if (oldPercentage < milestone && newPercentage >= milestone) {
        return milestone;
      }
    }
    return null;
  }
}
