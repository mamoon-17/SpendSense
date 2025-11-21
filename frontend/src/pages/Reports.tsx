import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  Download,
  FileText,
  Eye,
  DollarSign,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { expenseAPI, budgetAPI, savingsAPI } from "@/lib/api";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const Reports: React.FC = () => {
  const { formatCurrency, convertAmount, formatAmount, formatDate, settings } =
    useUserSettings();
  const [reportPeriod, setReportPeriod] = useState("month");
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Reports - SpendSense";
  }, []);

  // Fetch expenses
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const response = await expenseAPI.getExpenses();
      return response.data;
    },
  });

  // Fetch budgets
  const { data: budgets = [], isLoading: isLoadingBudgets } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const response = await budgetAPI.getBudgets();
      return response.data;
    },
  });

  // Fetch savings goals
  const { data: savingsGoals = [], isLoading: isLoadingGoals } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: async () => {
      const response = await savingsAPI.getGoals();
      return response.data;
    },
  });

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (reportPeriod) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "quarter":
        startDate = subMonths(new Date(), 3);
        break;
      case "year":
        startDate = subMonths(new Date(), 12);
        break;
      case "month":
      default:
        startDate = startOfMonth(new Date());
        break;
    }

    return { start: startDate, end: new Date() };
  }, [reportPeriod]);

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense: any) => {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, dateRange);
    });
  }, [expenses, dateRange]);

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce(
      (sum: number, expense: any) =>
        sum +
        convertAmount(
          parseFloat(expense.amount || 0),
          expense.currency || "USD"
        ),
      0
    );
  }, [filteredExpenses, convertAmount]);

  // Calculate income (from budgets)
  const totalIncome = useMemo(() => {
    return budgets.reduce(
      (sum: number, budget: any) =>
        sum +
        convertAmount(
          parseFloat(budget.total_amount || 0),
          budget.currency || "USD"
        ),
      0
    );
  }, [budgets, convertAmount]);

  // Calculate savings
  const totalSavings = useMemo(() => {
    return savingsGoals.reduce(
      (sum: number, goal: any) =>
        sum +
        convertAmount(
          parseFloat(goal.current_amount || 0),
          goal.currency || "USD"
        ),
      0
    );
  }, [savingsGoals, convertAmount]);

  const savingsRate =
    totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : "0.0";

  // Budget health
  const budgetsOnTrack = useMemo(() => {
    return budgets.filter((budget: any) => {
      const spent = parseFloat(budget.spent_amount || 0);
      const total = parseFloat(budget.total_amount || 0);
      return spent <= total;
    }).length;
  }, [budgets]);

  // Monthly spending data for trend chart
  const monthlySpendingData = useMemo(() => {
    const monthsData = [];
    const monthsCount = reportPeriod === "year" ? 12 : 6;

    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthExpenses = expenses.filter((expense: any) => {
        const expenseDate = parseISO(expense.date);
        return isWithinInterval(expenseDate, {
          start: monthStart,
          end: monthEnd,
        });
      });

      const monthTotal = monthExpenses.reduce(
        (sum: number, expense: any) =>
          sum +
          convertAmount(
            parseFloat(expense.amount || 0),
            expense.currency || "USD"
          ),
        0
      );

      monthsData.push({
        month: format(monthDate, "MMM"),
        income: totalIncome / monthsCount,
        expenses: monthTotal,
        savings: totalIncome / monthsCount - monthTotal,
      });
    }

    return monthsData;
  }, [expenses, totalIncome, reportPeriod]);

  // Category spending data
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();

    filteredExpenses.forEach((expense: any) => {
      const categoryName = expense.category?.name || "Uncategorized";
      const amount = convertAmount(
        parseFloat(expense.amount || 0),
        expense.currency || "USD"
      );
      categoryMap.set(
        categoryName,
        (categoryMap.get(categoryName) || 0) + amount
      );
    });

    const totalCategoryExpenses = Array.from(categoryMap.values()).reduce(
      (sum, val) => sum + val,
      0
    );

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
        percentage:
          totalCategoryExpenses > 0
            ? Math.round((value / totalCategoryExpenses) * 100)
            : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredExpenses]);

  // Savings goals data for chart
  const savingsGoalsData = useMemo(() => {
    return savingsGoals.map((goal: any) => ({
      name: goal.name,
      target: convertAmount(
        parseFloat(goal.target_amount || 0),
        goal.currency || "USD"
      ),
      current: convertAmount(
        parseFloat(goal.current_amount || 0),
        goal.currency || "USD"
      ),
      progress: parseFloat(goal.progress || 0),
    }));
  }, [savingsGoals, convertAmount]);

  const handleExportReport = async () => {
    toast({
      title: "Exporting Report",
      description: "PDF report generation feature coming soon!",
    });
  };

  const isLoading = isLoadingExpenses || isLoadingBudgets || isLoadingGoals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Financial Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your financial health
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button className="btn-primary" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Report Controls */}
      <Card className="card-financial">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            <Select value="spending" disabled>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Spending Analysis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spending">Spending Analysis</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={handleExportReport}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Income
                </p>
                <p className="text-2xl font-bold text-success">
                  {formatAmount(Math.round(totalIncome))}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +5.2% vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold">
                  {formatAmount(Math.round(totalExpenses))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +2.1% vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Net Savings
                </p>
                <p className="text-2xl font-bold text-success">
                  {formatAmount(Math.round(totalSavings))}
                </p>
              </div>
              <Target className="w-8 h-8 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Savings rate: {savingsRate}%
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Budget Health
                </p>
                <p className="text-2xl font-bold text-warning">
                  {budgetsOnTrack > budgets.length / 2
                    ? "Good"
                    : "Needs Attention"}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {budgetsOnTrack} budget{budgetsOnTrack !== 1 ? "s" : ""} on track
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Charts Area */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="trends" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="mt-6">
              <Card className="card-financial">
                <CardHeader>
                  <CardTitle>Income vs Expenses Trend</CardTitle>
                  <CardDescription>6-month financial overview</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-80 w-full flex items-center justify-center">
                      <p className="text-muted-foreground">Loading data...</p>
                    </div>
                  ) : (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlySpendingData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="opacity-30"
                          />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis
                            className="text-xs"
                            tickFormatter={(value) => formatAmount(value)}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "calc(var(--radius) - 2px)",
                            }}
                            formatter={(value: number, name: string) => [
                              formatAmount(Math.round(value)),
                              name === "income"
                                ? "Income"
                                : name === "expenses"
                                ? "Expenses"
                                : "Savings",
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="income"
                            stroke="hsl(var(--success))"
                            strokeWidth={3}
                          />
                          <Line
                            type="monotone"
                            dataKey="expenses"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                          />
                          <Line
                            type="monotone"
                            dataKey="savings"
                            stroke="hsl(var(--warning))"
                            strokeWidth={3}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="card-financial">
                  <CardHeader>
                    <CardTitle>Spending by Category</CardTitle>
                    <CardDescription>Current month breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-64 w-full flex items-center justify-center">
                        <p className="text-muted-foreground">Loading data...</p>
                      </div>
                    ) : categoryData.length === 0 ? (
                      <div className="h-64 w-full flex items-center justify-center">
                        <p className="text-muted-foreground">
                          No category data available
                        </p>
                      </div>
                    ) : (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {categoryData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [
                                formatAmount(value),
                                "Amount",
                              ]}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="card-financial">
                  <CardHeader>
                    <CardTitle>Category Details</CardTitle>
                    <CardDescription>
                      Spending breakdown with trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <p className="text-muted-foreground text-center py-8">
                        Loading...
                      </p>
                    ) : categoryData.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No data available
                      </p>
                    ) : (
                      categoryData.map((category, index) => (
                        <div
                          key={category.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatAmount(category.value)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {category.percentage}%
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="goals" className="mt-6">
              <Card className="card-financial">
                <CardHeader>
                  <CardTitle>Savings Goals Progress</CardTitle>
                  <CardDescription>
                    Track your progress toward financial goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 w-full flex items-center justify-center">
                      <p className="text-muted-foreground">Loading data...</p>
                    </div>
                  ) : savingsGoalsData.length === 0 ? (
                    <div className="h-64 w-full flex items-center justify-center">
                      <p className="text-muted-foreground">
                        No savings goals yet. Create one to track progress!
                      </p>
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={savingsGoalsData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="opacity-30"
                          />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis
                            className="text-xs"
                            tickFormatter={(value) => formatAmount(value)}
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              formatAmount(value),
                              "Amount",
                            ]}
                          />
                          <Bar
                            dataKey="current"
                            fill="hsl(var(--success))"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="target"
                            fill="hsl(var(--muted))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExportReport}
              >
                <Download className="w-4 h-4 mr-2" />
                Monthly Summary
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExportReport}
              >
                <FileText className="w-4 h-4 mr-2" />
                Tax Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExportReport}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Budget Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
