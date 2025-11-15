import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";

interface SpendingChartProps {
  expenses?: any[];
  budgets?: any[];
}

export const SpendingChart: React.FC<SpendingChartProps> = ({
  expenses = [],
  budgets = [],
}) => {
  const spendingData = useMemo(() => {
    // Generate last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthKey = format(date, "MMM");

      // Calculate spent amount for this month from expenses
      const monthSpent =
        expenses
          ?.filter((expense: any) => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= monthStart && expenseDate <= monthEnd;
          })
          .reduce((sum: number, expense: any) => {
            return sum + parseFloat(expense.amount || "0");
          }, 0) || 0;

      // Calculate budget for this month
      const monthBudget =
        budgets
          ?.filter((budget: any) => {
            const budgetStart = new Date(budget.start_date);
            const budgetEnd = new Date(budget.end_date);
            // Budget overlaps with this month
            return budgetStart <= monthEnd && budgetEnd >= monthStart;
          })
          .reduce((sum: number, budget: any) => {
            return sum + parseFloat(budget.total_amount || "0");
          }, 0) || 0;

      months.push({
        month: monthKey,
        spent: Math.round(monthSpent * 100) / 100,
        budget: Math.round(monthBudget * 100) / 100,
      });
    }

    return months;
  }, [expenses, budgets]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={spendingData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
          <YAxis
            className="text-xs fill-muted-foreground"
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "calc(var(--radius) - 2px)",
            }}
            formatter={(value: number, name: string) => [
              `$${value.toLocaleString()}`,
              name === "spent" ? "Spent" : "Budget",
            ]}
          />
          <Line
            type="monotone"
            dataKey="budget"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="spent"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
