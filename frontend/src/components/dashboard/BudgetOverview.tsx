import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Budget {
  id: string;
  name: string;
  totalAmount: number;
  spent: number;
  category: string;
}

interface BudgetOverviewProps {
  budgets?: Budget[];
}

// Mock data for demonstration
const mockBudgets: Budget[] = [
  { id: '1', name: 'Food & Dining', totalAmount: 800, spent: 650, category: 'food' },
  { id: '2', name: 'Transportation', totalAmount: 400, spent: 320, category: 'transport' },
  { id: '3', name: 'Entertainment', totalAmount: 300, spent: 180, category: 'entertainment' },
  { id: '4', name: 'Shopping', totalAmount: 500, spent: 420, category: 'shopping' },
  { id: '5', name: 'Housing', totalAmount: 1200, spent: 1200, category: 'housing' },
];

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(142 76% 55%)',
  'hsl(218 85% 60%)',
];

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({ 
  budgets = mockBudgets 
}) => {
  const chartData = budgets.map((budget) => ({
    name: budget.name,
    value: budget.spent,
    total: budget.totalAmount,
    percentage: ((budget.spent / budget.totalAmount) * 100).toFixed(1),
  }));

  return (
    <div className="space-y-4">
      {/* Pie Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'calc(var(--radius) - 2px)',
              }}
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`,
                'Spent'
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Budget List */}
      <div className="space-y-3">
        {budgets.map((budget, index) => {
          const percentage = (budget.spent / budget.totalAmount) * 100;
          const isOverBudget = percentage > 100;
          
          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {budget.name}
                  </span>
                </div>
                <span className={`text-sm font-medium ${
                  isOverBudget ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  ${budget.spent.toLocaleString()} / ${budget.totalAmount.toLocaleString()}
                </span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    isOverBudget ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{ 
                    width: `${Math.min(percentage, 100)}%`,
                  }}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}% used
                </span>
                {isOverBudget && (
                  <span className="text-xs text-destructive font-medium">
                    Over budget by ${(budget.spent - budget.totalAmount).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No budgets created</p>
          <p className="text-sm">Create your first budget to see an overview here</p>
        </div>
      )}
    </div>
  );
};