import React from 'react';
import { Target, TrendingUp, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format, differenceInDays } from 'date-fns';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  description?: string;
}

interface SavingsGoalsProps {
  goals?: SavingsGoal[];
}

// Mock data for demonstration
const mockGoals: SavingsGoal[] = [
  {
    id: '1',
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 6750,
    targetDate: '2024-12-31',
    description: '6 months of expenses',
  },
  {
    id: '2',
    name: 'Vacation to Europe',
    targetAmount: 5000,
    currentAmount: 2200,
    targetDate: '2024-07-15',
    description: 'Summer 2024 trip',
  },
  {
    id: '3',
    name: 'New Laptop',
    targetAmount: 2500,
    currentAmount: 1800,
    targetDate: '2024-06-01',
    description: 'MacBook Pro upgrade',
  },
];

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({ 
  goals = mockGoals.slice(0, 3) 
}) => {
  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
        const isOverdue = daysLeft < 0;
        
        return (
          <div 
            key={goal.id} 
            className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-foreground">{goal.name}</h4>
                {goal.description && (
                  <p className="text-xs text-muted-foreground">{goal.description}</p>
                )}
              </div>
              <Target className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                </span>
                <span className="font-medium text-foreground">
                  {progress.toFixed(1)}%
                </span>
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {isOverdue 
                      ? `Overdue by ${Math.abs(daysLeft)} days`
                      : daysLeft === 0 
                        ? 'Due today'
                        : `${daysLeft} days left`
                    }
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <span className="text-success font-medium">
                    ${(goal.targetAmount - goal.currentAmount).toLocaleString()} to go
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {goals.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No savings goals</p>
          <p className="text-sm">Create a goal to start saving</p>
        </div>
      )}
    </div>
  );
};