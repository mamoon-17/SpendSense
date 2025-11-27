import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useUserSettings } from "@/hooks/useUserSettings";

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
  {
    id: "1",
    name: "Food & Dining",
    totalAmount: 800,
    spent: 650,
    category: "food",
  },
  {
    id: "2",
    name: "Transportation",
    totalAmount: 400,
    spent: 320,
    category: "transport",
  },
  {
    id: "3",
    name: "Entertainment",
    totalAmount: 300,
    spent: 180,
    category: "entertainment",
  },
  {
    id: "4",
    name: "Shopping",
    totalAmount: 500,
    spent: 420,
    category: "shopping",
  },
  {
    id: "5",
    name: "Housing",
    totalAmount: 1200,
    spent: 1200,
    category: "housing",
  },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(142 76% 55%)",
  "hsl(218 85% 60%)",
];

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  budgets = mockBudgets,
}) => {
  const { formatCurrency, convertAmount } = useUserSettings();

  // Custom tooltip component for better visibility and positioning
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div
          className="bg-gray-900 border-2 border-gray-700 rounded-lg p-4 shadow-2xl"
          style={{
            zIndex: 9999,
            position: "relative",
          }}
        >
          <p className="text-sm font-bold text-white mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-xs text-gray-300">
              <span className="font-medium">Spent:</span>{" "}
              <span className="text-primary font-bold text-base">
                {formatCurrency(data.value, data.payload.currency || "USD")}
              </span>
            </p>
            <p className="text-xs text-gray-300">
              <span className="font-medium">Budget:</span>{" "}
              <span className="text-white font-semibold">
                {formatCurrency(
                  data.payload.total,
                  data.payload.currency || "USD"
                )}
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
              {data.payload.percentage}% used
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartData = budgets.map((budget) => {
    // Handle both camelCase and snake_case from API
    const spent = budget.spent ?? (budget as any).spent_amount ?? 0;
    const totalAmount = budget.totalAmount ?? (budget as any).total_amount ?? 0;
    const budgetCurrency = (budget as any).currency || "USD";

    const spentNum = typeof spent === "string" ? parseFloat(spent) : spent;
    const totalNum =
      typeof totalAmount === "string" ? parseFloat(totalAmount) : totalAmount;

    // Convert to user's currency
    const convertedSpent = convertAmount(spentNum, budgetCurrency);
    const convertedTotal = convertAmount(totalNum, budgetCurrency);

    const percentage =
      convertedTotal > 0
        ? ((convertedSpent / convertedTotal) * 100).toFixed(1)
        : "0.0";

    return {
      name: budget.name,
      value: convertedSpent,
      total: convertedTotal,
      percentage,
      currency: budgetCurrency,
    };
  });

  // Calculate total for center display
  const totalSpent = chartData.reduce((sum, item) => sum + item.value, 0);
  const totalBudget = chartData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      {/* Pie Chart with improved spacing */}
      <div className="h-72 w-full relative" style={{ zIndex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "transparent" }}
              wrapperStyle={{
                zIndex: 9999,
                outline: "none",
              }}
              position={{ x: 0, y: 0 }}
              allowEscapeViewBox={{ x: true, y: true }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-muted-foreground font-medium">
            Total Spent
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {formatCurrency(totalSpent, "USD")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            of {formatCurrency(totalBudget, "USD")}
          </p>
        </div>
      </div>

      {/* Budget List */}
      <div className="space-y-3">
        {budgets.map((budget, index) => {
          // Handle both camelCase and snake_case from API
          const spent = budget.spent ?? (budget as any).spent_amount ?? 0;
          const totalAmount =
            budget.totalAmount ?? (budget as any).total_amount ?? 0;
          const budgetCurrency = (budget as any).currency || "USD";

          const spentNum =
            typeof spent === "string" ? parseFloat(spent) : spent;
          const totalNum =
            typeof totalAmount === "string"
              ? parseFloat(totalAmount)
              : totalAmount;

          // Convert to user's currency
          const convertedSpent = convertAmount(spentNum, budgetCurrency);
          const convertedTotal = convertAmount(totalNum, budgetCurrency);

          const percentage =
            convertedTotal > 0 ? (convertedSpent / convertedTotal) * 100 : 0;
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
                <span
                  className={`text-sm font-medium ${
                    isOverBudget ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {formatCurrency(convertedSpent, budgetCurrency)} /{" "}
                  {formatCurrency(convertedTotal, budgetCurrency)}
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
                    Over budget by{" "}
                    {formatCurrency(
                      convertedSpent - convertedTotal,
                      budgetCurrency
                    )}
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
          <p className="text-sm">
            Create your first budget to see an overview here
          </p>
        </div>
      )}
    </div>
  );
};
