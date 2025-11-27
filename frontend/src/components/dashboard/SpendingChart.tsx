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
import { useUserSettings } from "@/hooks/useUserSettings";

interface SpendingChartProps {
  expenses?: any[];
  budgets?: any[];
}

export const SpendingChart: React.FC<SpendingChartProps> = ({
  expenses = [],
  budgets = [],
}) => {
  const [hoveredLine, setHoveredLine] = React.useState<string | null>(null);
  const { formatCurrency, convertAmount, getCurrencySymbol } =
    useUserSettings();

  // Custom tooltip component for better visibility with intensity highlighting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-gray-900 border-2 border-gray-700 rounded-lg p-3 shadow-2xl"
          style={{ zIndex: 9999 }}
        >
          <p className="text-sm font-bold text-white mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              const isHighlighted = entry.dataKey === hoveredLine;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4"
                  style={{
                    opacity: isHighlighted ? 1 : 0.4,
                    transition: "all 0.2s ease",
                  }}
                >
                  <span
                    className={`font-semibold ${
                      isHighlighted
                        ? "text-white text-sm"
                        : "text-gray-500 text-xs"
                    }`}
                  >
                    {entry.name === "spent" ? "Spent" : "Budget"}:
                  </span>
                  <span
                    className={`font-bold ${
                      isHighlighted ? "text-lg" : "text-sm"
                    }`}
                    style={{
                      color: isHighlighted
                        ? entry.dataKey === "budget"
                          ? "#fff"
                          : entry.color
                        : entry.color,
                      transition: "all 0.2s ease",
                      filter: isHighlighted ? "brightness(1.3)" : "none",
                    }}
                  >
                    {formatCurrency(entry.value, "USD")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

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
            const amount = parseFloat(expense.amount || "0");
            const converted = convertAmount(amount, expense.currency || "USD");
            return sum + converted;
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
            const amount = parseFloat(budget.total_amount || "0");
            const converted = convertAmount(amount, budget.currency || "USD");
            return sum + converted;
          }, 0) || 0;

      months.push({
        month: monthKey,
        spent: Math.round(monthSpent * 100) / 100,
        budget: Math.round(monthBudget * 100) / 100,
        currency: "user", // Mark as user's currency after conversion
      });
    }

    return months;
  }, [expenses, budgets]);

  // Calculate dynamic Y-axis domain for better scaling
  const getYAxisDomain = useMemo(() => {
    const allValues = spendingData.flatMap((d) => [d.spent, d.budget]);
    const maxValue = Math.max(...allValues, 0);
    const minValue = 0;

    // Add 20% padding to max for better visualization
    const padding = maxValue * 0.2;
    return [minValue, Math.ceil(maxValue + padding)];
  }, [spendingData]);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={spendingData}
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
          />
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            dy={10}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickFormatter={(value) =>
              `${getCurrencySymbol()}${value.toLocaleString()}`
            }
            domain={getYAxisDomain}
            allowDataOverflow={false}
            dx={-10}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "hsl(var(--border))",
              strokeWidth: 1,
              strokeDasharray: "5 5",
            }}
            wrapperStyle={{ zIndex: 9999, outline: "none" }}
          />
          <Line
            type="monotone"
            dataKey="budget"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={hoveredLine === "budget" ? 3 : 2}
            strokeDasharray="8 4"
            dot={{
              fill: "hsl(var(--card))",
              stroke: "hsl(var(--muted-foreground))",
              strokeWidth: hoveredLine === "budget" ? 3 : 2,
              r: hoveredLine === "budget" ? 6 : 4,
            }}
            activeDot={{
              r: 8,
              stroke: "hsl(var(--muted-foreground))",
              strokeWidth: 3,
              fill: "hsl(var(--card))",
              onMouseEnter: () => setHoveredLine("budget"),
              onMouseLeave: () => setHoveredLine(null),
            }}
            connectNulls
            name="budget"
            opacity={
              hoveredLine === null ? 0.6 : hoveredLine === "budget" ? 1 : 0.3
            }
          />
          <Line
            type="monotone"
            dataKey="spent"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{
              fill: "hsl(var(--card))",
              stroke: "hsl(var(--primary))",
              strokeWidth: hoveredLine === "spent" ? 3 : 2,
              r: hoveredLine === "spent" ? 7 : 5,
            }}
            activeDot={{
              r: 9,
              stroke: "hsl(var(--primary))",
              strokeWidth: 4,
              fill: "hsl(var(--card))",
              onMouseEnter: () => setHoveredLine("spent"),
              onMouseLeave: () => setHoveredLine(null),
            }}
            connectNulls
            name="spent"
            opacity={
              hoveredLine === null ? 1 : hoveredLine === "spent" ? 1 : 0.3
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
