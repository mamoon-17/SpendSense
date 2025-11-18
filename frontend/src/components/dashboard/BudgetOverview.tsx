import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(142 76% 55%)",
  "hsl(218 85% 60%)",
];

<<<<<<< HEAD
export const BudgetOverview: React.FC<BudgetOverviewProps> = ({ 
  budgets = mockBudgets 
}) => {
  const chartData = budgets.map((budget) => {
    // Handle both camelCase and snake_case from API
    const spent = budget.spent ?? (budget as any).spent_amount ?? 0;
    const totalAmount = budget.totalAmount ?? (budget as any).total_amount ?? 0;
    const spentNum = typeof spent === 'string' ? parseFloat(spent) : spent;
    const totalNum = typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount;
    const percentage = totalNum > 0 ? ((spentNum / totalNum) * 100).toFixed(1) : '0.0';
    
    return {
      name: budget.name,
      value: spentNum,
      total: totalNum,
      percentage,
    };
  });
=======
export const BudgetOverview: React.FC<BudgetOverviewProps> = ({ budgets }) => {
  // Custom tooltip for better visibility
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-1">
            {payload[0].name}
          </p>
          <p className="text-sm text-foreground">
            <span className="font-medium">Spent:</span>{" "}
            <span className="text-primary font-bold">
              ${payload[0].value.toLocaleString()}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {payload[0].payload.percentage}% of budget
          </p>
        </div>
      );
    }
    return null;
  };

  // Don't render anything if no data yet
  if (!budgets || budgets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No budgets yet</p>
        <p className="text-sm">Create a budget to see the overview</p>
      </div>
    );
  }

  // Transform API data to expected format
  const transformedBudgets = budgets.map((budget: any) => ({
    id: budget.id,
    name: budget.name,
    totalAmount: parseFloat(budget.total_amount || "0"),
    spent: parseFloat(budget.spent_amount || "0"),
    category: budget.category?.name || "Other",
  }));

  // Safety check: filter out invalid budgets
  const validBudgets = transformedBudgets.filter(
    (budget) =>
      budget &&
      typeof budget.spent === "number" &&
      typeof budget.totalAmount === "number"
  );

  const chartData = validBudgets.map((budget) => ({
    name: budget.name,
    value: budget.spent,
    total: budget.totalAmount,
    percentage: ((budget.spent / budget.totalAmount) * 100).toFixed(1),
  }));
>>>>>>> origin/feature1

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
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Budget List */}
      <div className="space-y-3">
<<<<<<< HEAD
        {budgets.map((budget, index) => {
          // Handle both camelCase and snake_case from API
          const spent = budget.spent ?? (budget as any).spent_amount ?? 0;
          const totalAmount = budget.totalAmount ?? (budget as any).total_amount ?? 0;
          const spentNum = typeof spent === 'string' ? parseFloat(spent) : spent;
          const totalNum = typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount;
          const percentage = totalNum > 0 ? (spentNum / totalNum) * 100 : 0;
=======
        {validBudgets.map((budget, index) => {
          const percentage = (budget.spent / budget.totalAmount) * 100;
>>>>>>> origin/feature1
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
<<<<<<< HEAD
                <span className={`text-sm font-medium ${
                  isOverBudget ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  ${spentNum.toLocaleString()} / ${totalNum.toLocaleString()}
=======
                <span
                  className={`text-sm font-medium ${
                    isOverBudget ? "text-destructive" : "text-foreground"
                  }`}
                >
                  ${(budget.spent || 0).toLocaleString()} / $
                  {(budget.totalAmount || 0).toLocaleString()}
>>>>>>> origin/feature1
                </span>
              </div>

              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isOverBudget ? "bg-destructive" : "bg-primary"
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
<<<<<<< HEAD
                    Over budget by ${(spentNum - totalNum).toLocaleString()}
=======
                    Over budget by $
                    {(
                      (budget.spent || 0) - (budget.totalAmount || 0)
                    ).toLocaleString()}
>>>>>>> origin/feature1
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {validBudgets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No budgets created</p>
          <p className="text-sm">
            Create your first budget to see an overview here
          </p>
        </div>
      )}
    </div>
  );
};
