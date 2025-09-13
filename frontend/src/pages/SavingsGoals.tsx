import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Target, 
  Calendar, 
  TrendingUp, 
  Edit, 
  Trash2,
  DollarSign,
  Zap,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { savingsAPI } from '@/lib/api';
import { format, differenceInDays, differenceInMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface SavingsGoal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'emergency' | 'vacation' | 'purchase' | 'investment' | 'other';
  priority: 'high' | 'medium' | 'low';
  autoSave: boolean;
  monthlyTarget?: number;
  createdAt: string;
}

// Mock data
const mockGoals: SavingsGoal[] = [
  {
    id: '1',
    name: 'Emergency Fund',
    description: '6 months of living expenses',
    targetAmount: 15000,
    currentAmount: 8750,
    targetDate: '2024-12-31',
    category: 'emergency',
    priority: 'high',
    autoSave: true,
    monthlyTarget: 1250,
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Europe Vacation',
    description: 'Summer 2024 trip to Italy and France',
    targetAmount: 5000,
    currentAmount: 3200,
    targetDate: '2024-07-15',
    category: 'vacation',
    priority: 'medium',
    autoSave: false,
    monthlyTarget: 600,
    createdAt: '2024-01-15'
  },
  {
    id: '3',
    name: 'MacBook Pro',
    description: 'New laptop for work',
    targetAmount: 2500,
    currentAmount: 2100,
    targetDate: '2024-05-01',
    category: 'purchase',
    priority: 'medium',
    autoSave: true,
    monthlyTarget: 400,
    createdAt: '2024-02-01'
  },
  {
    id: '4',
    name: 'Investment Portfolio',
    description: 'Long-term wealth building',
    targetAmount: 50000,
    currentAmount: 12500,
    targetDate: '2026-12-31',
    category: 'investment',
    priority: 'low',
    autoSave: true,
    monthlyTarget: 1500,
    createdAt: '2024-01-01'
  }
];

export const SavingsGoals: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'behind'>('all');

  // Mock query - replace with real API call
  const { data: goals = mockGoals } = useQuery({
    queryKey: ['savings-goals'],
    queryFn: () => savingsAPI.getGoals().then(res => res.data),
  });

  const getGoalStatus = (goal: SavingsGoal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
    
    if (progress >= 100) return 'completed';
    if (daysLeft < 0) return 'overdue';
    if (progress < 50 && daysLeft < 90) return 'behind';
    if (progress >= 80) return 'on-track';
    return 'active';
  };

  const filteredGoals = goals.filter(goal => {
    const status = getGoalStatus(goal);
    switch (filter) {
      case 'active':
        return status === 'active' || status === 'on-track';
      case 'completed':
        return status === 'completed';
      case 'behind':
        return status === 'behind' || status === 'overdue';
      default:
        return true;
    }
  });

  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const overallProgress = (totalCurrentAmount / totalTargetAmount) * 100;

  const completedGoals = goals.filter(goal => getGoalStatus(goal) === 'completed').length;
  const totalMonthlyTarget = goals.reduce((sum, goal) => sum + (goal.monthlyTarget || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Savings Goals</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and achieve your financial dreams
          </p>
        </div>
        <Button className="btn-primary w-fit">
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Target</p>
                <p className="text-2xl font-bold">${totalTargetAmount.toLocaleString()}</p>
              </div>
              <Target className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across {goals.length} goals
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Saved</p>
                <p className="text-2xl font-bold text-success">${totalCurrentAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {overallProgress.toFixed(1)}% of total target
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-warning">{completedGoals}</p>
              </div>
              <Trophy className="w-8 h-8 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Goals achieved
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Target</p>
                <p className="text-2xl font-bold">${totalMonthlyTarget.toLocaleString()}</p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              To stay on track
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="goals" className="w-full">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <TabsList className="grid w-full sm:w-fit grid-cols-3">
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                {['all', 'active', 'completed', 'behind'].map((filterOption) => (
                  <Button
                    key={filterOption}
                    variant={filter === filterOption ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(filterOption as any)}
                    className="capitalize"
                  >
                    {filterOption}
                  </Button>
                ))}
              </div>
            </div>

            <TabsContent value="goals" className="space-y-4 mt-6">
              {filteredGoals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                const status = getGoalStatus(goal);
                const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
                const monthsLeft = differenceInMonths(new Date(goal.targetDate), new Date());
                
                return (
                  <Card key={goal.id} className="card-financial">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-xl">{goal.name}</CardTitle>
                            <Badge 
                              variant={status === 'completed' ? 'default' : status === 'behind' ? 'destructive' : 'secondary'}
                              className="capitalize"
                            >
                              {status === 'on-track' ? 'On Track' : status}
                            </Badge>
                            {goal.autoSave && (
                              <Badge variant="outline">
                                <Zap className="w-3 h-3 mr-1" />
                                Auto-save
                              </Badge>
                            )}
                          </div>
                          {goal.description && (
                            <CardDescription>{goal.description}</CardDescription>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {status === 'completed' && <CheckCircle className="w-5 h-5 text-success" />}
                          {status === 'behind' && <AlertCircle className="w-5 h-5 text-destructive" />}
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            ${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}
                          </span>
                          <span className="font-semibold text-lg">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        
                        <Progress 
                          value={Math.min(progress, 100)} 
                          className={cn(
                            "h-3",
                            status === 'completed' ? '[&>div]:bg-success' :
                            status === 'behind' ? '[&>div]:bg-destructive' :
                            '[&>div]:bg-primary'
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Target Date</p>
                            <p className="text-muted-foreground">
                              {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Time Left</p>
                            <p className={cn(
                              "text-muted-foreground",
                              daysLeft < 30 && progress < 80 && "text-warning",
                              daysLeft < 0 && "text-destructive"
                            )}>
                              {daysLeft < 0 ? 'Overdue' : `${monthsLeft} months`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Monthly Need</p>
                            <p className="text-muted-foreground">
                              ${goal.monthlyTarget?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <Badge variant="outline" className="capitalize">
                          {goal.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <Card className="card-financial">
                <CardHeader>
                  <CardTitle>Progress Overview</CardTitle>
                  <CardDescription>
                    Visual breakdown of your savings progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {goals.map((goal) => {
                      const progress = (goal.currentAmount / goal.targetAmount) * 100;
                      const status = getGoalStatus(goal);
                      
                      return (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{goal.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(progress, 100)} 
                            className={cn(
                              "h-2",
                              status === 'completed' ? '[&>div]:bg-success' :
                              status === 'behind' ? '[&>div]:bg-destructive' :
                              '[&>div]:bg-primary'
                            )}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>${goal.currentAmount.toLocaleString()}</span>
                            <span>${goal.targetAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              <div className="space-y-4">
                <Card className="card-financial">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-primary" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <h4 className="font-medium text-primary mb-2">Optimization Tip</h4>
                      <p className="text-sm text-foreground">
                        You're $300 behind on your Europe vacation goal. Consider reducing dining out by $75/week to get back on track.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                      <h4 className="font-medium text-success mb-2">Great Progress!</h4>
                      <p className="text-sm text-foreground">
                        Your MacBook Pro goal is 84% complete and ahead of schedule. You could achieve it 2 months early!
                      </p>
                    </div>
                    
                    <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                      <h4 className="font-medium text-warning mb-2">Smart Strategy</h4>
                      <p className="text-sm text-foreground">
                        Based on your spending patterns, consider setting up automatic transfers of $200/week to boost your emergency fund.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <AIAssistant compact context="savings" />
          
          {/* Goal Statistics */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm">Goal Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-success">Completed</span>
                  <span className="font-medium">{goals.filter(g => getGoalStatus(g) === 'completed').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-primary">On Track</span>
                  <span className="font-medium">{goals.filter(g => getGoalStatus(g) === 'on-track').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-warning">Active</span>
                  <span className="font-medium">{goals.filter(g => getGoalStatus(g) === 'active').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-destructive">Behind</span>
                  <span className="font-medium">{goals.filter(g => ['behind', 'overdue'].includes(getGoalStatus(g))).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm">By Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from(new Set(goals.map(g => g.category))).map((category: string) => {
                const categoryGoals = goals.filter(g => g.category === category);
                const categoryTotal = categoryGoals.reduce((sum, g) => sum + g.targetAmount, 0);
                
                return (
                  <div key={category} className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {category}
                    </Badge>
                    <span className="text-sm font-medium">
                      ${categoryTotal.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant context="savings" />
    </div>
  );
};