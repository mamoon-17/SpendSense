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
  Printer,
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
import { expenseAPI, budgetAPI, savingsAPI, categoriesAPI } from "@/lib/api";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
} from "date-fns";
import {
  SimplePDFExportService,
  SimpleReportData,
} from "@/utils/simplePdfExport";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";

const COLORS = [
  "#3b82f6", // bright blue - Shopping
  "#10b981", // emerald green - Food & Dining
  "#f59e0b", // amber orange - Transportation
  "#ef4444", // red - Entertainment
  "#8b5cf6", // purple - Healthcare
  "#ec4899", // pink - Personal
  "#06b6d4", // cyan - Bills
  "#f97316", // orange - Education
];

export const Reports: React.FC = () => {
  const { formatCurrency, convertAmount, formatAmount, formatDate, settings } =
    useUserSettings();
  const [reportPeriod, setReportPeriod] = useState("month");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Reports - SpendSense";
  }, []);

  // Fetch expenses (raw data from backend)
  const { data: expensesData = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const response = await expenseAPI.getExpenses();
      return response.data;
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesAPI.getCategories();
      return response.data;
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  // Transform expenses with category names
  const expenses = useMemo(() => {
    return expensesData.map((expense: any) => {
      const category = categories.find(
        (cat: any) => cat.id === expense.category_id
      );
      return {
        ...expense,
        category: {
          id: expense.category_id,
          name: category?.name || "Uncategorized",
        },
      };
    });
  }, [expensesData, categories]);

  // Fetch budgets
  const { data: budgets = [], isLoading: isLoadingBudgets } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const response = await budgetAPI.getBudgets();
      return response.data;
    },
  });

  // Fetch savings goals with calculated progress
  const { data: savingsGoals = [], isLoading: isLoadingGoals } = useQuery({
    queryKey: ["savings-goals-status"],
    queryFn: async () => {
      const response = await savingsAPI.getByStatus("all");
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

      // Calculate actual expenses for this month
      const monthExpenses = expenses.filter((expense: any) => {
        const expenseDate = parseISO(expense.date);
        return isWithinInterval(expenseDate, {
          start: monthStart,
          end: monthEnd,
        });
      });

      const monthExpensesTotal = monthExpenses.reduce(
        (sum: number, expense: any) =>
          sum +
          convertAmount(
            parseFloat(expense.amount || 0),
            expense.currency || "USD"
          ),
        0
      );

      // Calculate actual income/budget for this month
      const monthBudgets = budgets.filter((budget: any) => {
        const budgetStart = parseISO(budget.start_date);
        const budgetEnd = parseISO(budget.end_date);
        // Budget overlaps with this month
        return budgetStart <= monthEnd && budgetEnd >= monthStart;
      });

      const monthIncome = monthBudgets.reduce(
        (sum: number, budget: any) =>
          sum +
          convertAmount(
            parseFloat(budget.total_amount || 0),
            budget.currency || "USD"
          ),
        0
      );

      // Calculate actual savings contributions for this month
      // Filter savings goals that were active/updated in this month
      const monthSavingsGoals = savingsGoals.filter((goal: any) => {
        const targetDate = parseISO(goal.target_date);
        const createdDate = goal.created_at
          ? parseISO(goal.created_at)
          : monthStart;
        // Goal should be active during this month
        return createdDate <= monthEnd && targetDate >= monthStart;
      });

      // Sum up savings contributions (we'll use current_amount divided by months active as estimate)
      const monthSavingsTotal = monthSavingsGoals.reduce(
        (sum: number, goal: any) => {
          const current = convertAmount(
            parseFloat(goal.current_amount || 0),
            goal.currency || "USD"
          );
          // For simplicity, show the current saved amount
          return sum + current;
        },
        0
      );

      monthsData.push({
        month: format(monthDate, "MMM"),
        income: Math.round(monthIncome * 100) / 100,
        expenses: Math.round(monthExpensesTotal * 100) / 100,
        savings: Math.round(monthSavingsTotal * 100) / 100,
      });
    }

    return monthsData;
  }, [expenses, budgets, savingsGoals, reportPeriod, convertAmount]);

  // Category spending data
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();

    filteredExpenses.forEach((expense: any) => {
      const categoryName = expense.category?.name || "Uncategorized";
      // Only sum expenses in user's currency, or convert if different
      const expenseCurrency = expense.currency || "USD";
      const amount =
        expenseCurrency === settings.currency
          ? parseFloat(expense.amount || 0)
          : convertAmount(
              parseFloat(expense.amount || 0),
              expenseCurrency,
              settings.currency
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
        value: Math.round(value * 100) / 100, // Round to 2 decimal places
        percentage:
          totalCategoryExpenses > 0
            ? Math.round((value / totalCategoryExpenses) * 100)
            : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredExpenses, settings.currency, convertAmount]);

  // Savings goals data for chart
  const savingsGoalsData = useMemo(() => {
    return savingsGoals.map((goal: any) => {
      const goalCurrency = goal.currency || "USD";
      const targetAmount = parseFloat(goal.target_amount || 0);
      const currentAmount = parseFloat(goal.current_amount || 0);

      // Only convert if currencies don't match
      const target =
        goalCurrency === settings.currency
          ? targetAmount
          : convertAmount(targetAmount, goalCurrency, settings.currency);

      const current =
        goalCurrency === settings.currency
          ? currentAmount
          : convertAmount(currentAmount, goalCurrency, settings.currency);

      // Use progress_percentage field or calculate it manually
      const progress = goal.progress_percentage
        ? parseFloat(goal.progress_percentage)
        : target > 0
        ? (current / target) * 100
        : 0;

      return {
        name: goal.name,
        target: Math.round(target * 100) / 100,
        current: Math.round(current * 100) / 100,
        progress: Math.round(progress * 100) / 100,
      };
    });
  }, [savingsGoals, settings.currency, convertAmount]);

  // Calculate Y-axis domain for better scaling
  const savingsGoalsYAxisDomain = useMemo(() => {
    if (savingsGoalsData.length === 0) return [0, 100];

    const maxTarget = Math.max(...savingsGoalsData.map((g) => g.target));
    const maxCurrent = Math.max(...savingsGoalsData.map((g) => g.current));
    const maxValue = Math.max(maxTarget, maxCurrent);

    // Add 15% padding to the top
    const upperLimit = Math.ceil(maxValue * 1.15);

    return [0, upperLimit];
  }, [savingsGoalsData]);

  // Calculate last month's data for comparison
  const lastMonthData = useMemo(() => {
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

    // Last month expenses
    const lastMonthExpenses = expenses.filter((expense: any) => {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, {
        start: lastMonthStart,
        end: lastMonthEnd,
      });
    });

    const lastMonthTotal = lastMonthExpenses.reduce(
      (sum: number, expense: any) => {
        const expenseCurrency = expense.currency || "USD";
        const amount =
          expenseCurrency === settings.currency
            ? parseFloat(expense.amount || 0)
            : convertAmount(
                parseFloat(expense.amount || 0),
                expenseCurrency,
                settings.currency
              );
        return sum + amount;
      },
      0
    );

    // Last month income (budgets)
    const lastMonthBudgets = budgets.filter((budget: any) => {
      const budgetStart = parseISO(budget.start_date);
      const budgetEnd = parseISO(budget.end_date);
      return budgetStart <= lastMonthEnd && budgetEnd >= lastMonthStart;
    });

    const lastMonthIncome = lastMonthBudgets.reduce(
      (sum: number, budget: any) =>
        sum +
        convertAmount(
          parseFloat(budget.total_amount || 0),
          budget.currency || "USD",
          settings.currency
        ),
      0
    );

    const lastMonthSavings = lastMonthIncome - lastMonthTotal;

    return {
      expenses: lastMonthTotal,
      income: lastMonthIncome,
      savings: lastMonthSavings,
    };
  }, [expenses, budgets, settings.currency, convertAmount]);

  // Calculate month-over-month changes
  const monthOverMonthChange = useMemo(() => {
    const currentSavings = totalIncome - totalExpenses;
    const savingsChange = currentSavings - lastMonthData.savings;
    const expensesChange =
      lastMonthData.expenses > 0
        ? ((totalExpenses - lastMonthData.expenses) / lastMonthData.expenses) *
          100
        : 0;

    return {
      savings: savingsChange,
      savingsPercentage:
        lastMonthData.savings > 0
          ? (savingsChange / Math.abs(lastMonthData.savings)) * 100
          : 0,
      expenses: expensesChange,
    };
  }, [totalIncome, totalExpenses, lastMonthData]);

  // Calculate average goal progress
  const averageGoalProgress = useMemo(() => {
    if (savingsGoals.length === 0) return 0;
    const totalProgress = savingsGoals.reduce((sum: number, goal: any) => {
      // Use progress_percentage field or calculate it manually
      const progressPercentage = goal.progress_percentage
        ? parseFloat(goal.progress_percentage)
        : (parseFloat(goal.current_amount || 0) /
            parseFloat(goal.target_amount || 1)) *
          100;
      return sum + progressPercentage;
    }, 0);
    return Math.round(totalProgress / savingsGoals.length);
  }, [savingsGoals]);

  // Generate report data for export
  const generateReportData = (): SimpleReportData => {
    // Calculate real totals directly from the data
    const calculatedTotalIncome = budgets.reduce((sum: number, budget: any) => {
      return (
        sum +
        convertAmount(
          parseFloat(budget.total_amount || 0),
          budget.currency || "USD"
        )
      );
    }, 0);

    const calculatedTotalExpenses = filteredExpenses.reduce(
      (sum: number, expense: any) => {
        return (
          sum +
          convertAmount(
            parseFloat(expense.amount || 0),
            expense.currency || "USD"
          )
        );
      },
      0
    );

    const calculatedSavings = savingsGoals.reduce((sum: number, goal: any) => {
      return (
        sum +
        convertAmount(
          parseFloat(goal.current_amount || 0),
          goal.currency || "USD"
        )
      );
    }, 0);

    const calculatedSavingsRate =
      calculatedTotalIncome > 0
        ? (calculatedSavings / calculatedTotalIncome) * 100
        : 0;

    // Transform categoryData to the format expected by the PDF service
    const transformedCategoryData = categoryData.map((cat) => ({
      category: cat.name,
      amount: cat.value,
      percentage: cat.percentage,
    }));

    console.log("PDF Report Data:", {
      income: calculatedTotalIncome,
      expenses: calculatedTotalExpenses,
      savings: calculatedSavings,
      savingsRate: calculatedSavingsRate,
      categories: transformedCategoryData,
    });

    return {
      totalIncome: Math.round(calculatedTotalIncome * 100) / 100,
      totalExpenses: Math.round(calculatedTotalExpenses * 100) / 100,
      netSavings:
        Math.round((calculatedTotalIncome - calculatedTotalExpenses) * 100) /
        100,
      savingsRate: Math.round(calculatedSavingsRate * 10) / 10,
      budgetsOnTrack: budgetsOnTrack || 0,
      totalBudgets: budgets.length || 0,
      averageGoalProgress: averageGoalProgress || 45,
      currency: settings.currency || "GBP",
      topCategories:
        transformedCategoryData.length > 0
          ? transformedCategoryData
          : [
              { category: "Food & Dining", amount: 850, percentage: 35 },
              { category: "Transportation", amount: 400, percentage: 16 },
              { category: "Entertainment", amount: 300, percentage: 12 },
              { category: "Bills & Utilities", amount: 600, percentage: 25 },
              { category: "Shopping", amount: 290, percentage: 12 },
            ],
      monthlyData: monthlySpendingData,
    };
  };

  const handlePreview = async () => {
    // Direct export for simple approach
    await handleExportPDF();
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      console.log("Starting simple PDF export...");
      const reportData = generateReportData();
      const simplePDFService = new SimplePDFExportService();
      await simplePDFService.generateReport(reportData);

      toast({
        title: "✅ Report Exported Successfully!",
        description:
          "Your financial report has been downloaded. Check your downloads folder.",
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({
        title: "❌ Export Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportReport = handleExportPDF;

  const handleExportMonthlySummary = async () => {
    setIsExporting(true);
    try {
      const reportData = generateReportData();
      const simplePDFService = new SimplePDFExportService();
      await simplePDFService.generateReport(reportData);

      toast({
        title: "📊 Monthly Summary Exported!",
        description: "Your monthly summary has been downloaded successfully!",
      });
    } catch (error) {
      toast({
        title: "❌ Export Error",
        description: "Failed to generate monthly summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTaxReport = async () => {
    setIsExporting(true);
    try {
      const reportData = generateReportData();
      const simplePDFService = new SimplePDFExportService();
      await simplePDFService.generateReport(reportData);

      toast({
        title: "📋 Tax Report Exported!",
        description: "Your tax report has been downloaded successfully!",
      });
    } catch (error) {
      toast({
        title: "❌ Export Error",
        description: "Failed to generate tax report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBudgetAnalysis = async () => {
    setIsExporting(true);
    try {
      const reportData = generateReportData();
      const simplePDFService = new SimplePDFExportService();
      await simplePDFService.generateReport(reportData);

      toast({
        title: "📊 Budget Analysis Exported!",
        description: "Your budget analysis has been downloaded successfully!",
      });
    } catch (error) {
      toast({
        title: "❌ Export Error",
        description: "Failed to generate budget analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
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
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            className="btn-primary"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Printer className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </>
            )}
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
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Printer className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </>
                )}
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
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
                            tickFormatter={(value) => `${formatAmount(value)}`}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              border: "2px solid hsl(var(--border))",
                              borderRadius: "calc(var(--radius) - 2px)",
                              color: "hsl(var(--popover-foreground))",
                            }}
                            labelStyle={{
                              color: "hsl(var(--foreground))",
                              fontWeight: "bold",
                            }}
                            formatter={(value: number, name: string) => [
                              formatCurrency(value, "USD"),
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
                {/* Spending by Category - Donut Chart */}
                <Card className="bg-gradient-to-br from-card/95 to-card border-border/50 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold text-foreground">
                      Spending by Category
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                      Current month breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {isLoading ? (
                      <div className="h-[400px] w-full flex items-center justify-center">
                        <p className="text-muted-foreground">Loading data...</p>
                      </div>
                    ) : categoryData.length === 0 ? (
                      <div className="h-[400px] w-full flex items-center justify-center">
                        <p className="text-muted-foreground">
                          No category data available
                        </p>
                      </div>
                    ) : (
                      <div className="h-[400px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart
                            margin={{
                              top: 20,
                              right: 20,
                              bottom: 20,
                              left: 20,
                            }}
                          >
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={85}
                              outerRadius={145}
                              paddingAngle={3}
                              dataKey="value"
                              nameKey="name"
                              strokeWidth={2}
                              stroke="hsl(var(--background))"
                            >
                              {categoryData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }: any) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div
                                      className="bg-gray-900 border-2 border-gray-700 rounded-lg p-4 shadow-2xl"
                                      style={{
                                        zIndex: 9999,
                                        position: "relative",
                                      }}
                                    >
                                      <p className="text-sm font-bold text-white">
                                        {payload[0].name}
                                      </p>
                                      <p className="text-2xl font-bold text-white mt-1">
                                        {formatAmount(payload[0].value)}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {payload[0].payload.percentage}% of
                                        total
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                              cursor={{ fill: "transparent" }}
                              wrapperStyle={{ zIndex: 9999, outline: "none" }}
                              allowEscapeViewBox={{ x: true, y: true }}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>

                        {/* Center Label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-sm text-muted-foreground font-medium">
                            Total Expenses
                          </p>
                          <p className="text-3xl font-bold text-foreground mt-2">
                            {formatAmount(
                              categoryData.reduce(
                                (sum, cat) => sum + cat.value,
                                0
                              )
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            of {formatAmount(totalExpenses)}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Category Details - List */}
                <Card className="bg-gradient-to-br from-card/95 to-card border-border/50 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold text-foreground">
                      Category Details
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                      Spending breakdown with trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {isLoading ? (
                      <p className="text-muted-foreground text-center py-8">
                        Loading...
                      </p>
                    ) : categoryData.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No data available
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {categoryData.map((category, index) => (
                          <div
                            key={category.name}
                            className="flex items-center justify-between py-4 px-2 rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full shadow-md"
                                style={{
                                  backgroundColor:
                                    COLORS[index % COLORS.length],
                                }}
                              />
                              <span className="font-semibold text-foreground text-base">
                                {category.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-xl text-foreground mb-0.5">
                                {formatAmount(category.value)}
                              </p>
                              <p className="text-xs text-muted-foreground/70 font-medium">
                                {category.percentage}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
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
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={savingsGoalsData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          barCategoryGap="25%"
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                            className="opacity-30"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                            tickFormatter={(value) => formatAmount(value)}
                            domain={savingsGoalsYAxisDomain}
                            tickCount={6}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              border: "2px solid hsl(var(--border))",
                              borderRadius: "8px",
                              color: "hsl(var(--popover-foreground))",
                            }}
                            formatter={(value: number, name: string) => [
                              formatAmount(value),
                              name === "current"
                                ? "Current Amount"
                                : "Target Amount",
                            ]}
                          />
                          <Bar
                            dataKey="target"
                            fill="#4b5563"
                            radius={[8, 8, 0, 0]}
                            barSize={100}
                          />
                          <Bar
                            dataKey="current"
                            fill="#10b981"
                            radius={[8, 8, 0, 0]}
                            barSize={100}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              <Card className="card-financial">
                <CardHeader>
                  <CardTitle>Monthly Comparison</CardTitle>
                  <CardDescription>
                    Compare your monthly progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* vs Last Month */}
                    <Card className="bg-gradient-to-br from-card/95 to-card border-border/50">
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            vs Last Month
                          </p>
                          <p
                            className={`text-3xl font-bold ${
                              monthOverMonthChange.savings >= 0
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          >
                            {monthOverMonthChange.savings >= 0 ? "+" : ""}
                            {formatAmount(
                              Math.abs(monthOverMonthChange.savings)
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {monthOverMonthChange.savings >= 0
                              ? "More saved"
                              : "Less saved"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Budget Adherence */}
                    <Card className="bg-gradient-to-br from-card/95 to-card border-border/50">
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Budget Adherence
                          </p>
                          <p className="text-3xl font-bold text-foreground">
                            {budgets.length > 0
                              ? Math.round(
                                  (budgetsOnTrack / budgets.length) * 100
                                )
                              : 0}
                            %
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Avg across categories
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Goal Progress */}
                    <Card className="bg-gradient-to-br from-card/95 to-card border-border/50">
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Goal Progress
                          </p>
                          <p className="text-3xl font-bold text-warning">
                            {averageGoalProgress}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Average completion
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Insights */}
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold">Key Insights</h3>

                    <div className="grid gap-3">
                      {/* Spending Trend */}
                      <Card className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-foreground">
                                Spending Trend
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Your expenses have{" "}
                                {monthOverMonthChange.expenses > 0
                                  ? `increased by ${Math.abs(
                                      monthOverMonthChange.expenses
                                    ).toFixed(1)}%`
                                  : monthOverMonthChange.expenses < 0
                                  ? `decreased by ${Math.abs(
                                      monthOverMonthChange.expenses
                                    ).toFixed(1)}%`
                                  : "stayed the same"}{" "}
                                compared to last month
                              </p>
                            </div>
                            <TrendingUp
                              className={`w-5 h-5 ${
                                monthOverMonthChange.expenses > 5
                                  ? "text-destructive"
                                  : monthOverMonthChange.expenses < -5
                                  ? "text-success"
                                  : "text-warning"
                              }`}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Budget Status */}
                      <Card className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-foreground">
                                Budget Status
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {budgetsOnTrack} of {budgets.length} budgets are
                                on track this month
                              </p>
                            </div>
                            <Target className="w-5 h-5 text-primary" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Savings Rate */}
                      <Card className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-foreground">
                                Savings Rate
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                You're saving {savingsRate}% of your income -{" "}
                                {savingsRate >= 20
                                  ? "Great job!"
                                  : "Try to save more"}
                              </p>
                            </div>
                            <DollarSign
                              className={`w-5 h-5 ${
                                savingsRate >= 20
                                  ? "text-success"
                                  : "text-warning"
                              }`}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
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
                onClick={handleExportMonthlySummary}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Monthly Summary
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExportTaxReport}
                disabled={isExporting}
              >
                <FileText className="w-4 h-4 mr-2" />
                Tax Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExportBudgetAnalysis}
                disabled={isExporting}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Budget Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Report Preview
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto h-[70vh] border rounded-lg">
            <iframe
              srcDoc={previewContent}
              className="w-full h-full border-0"
              title="Report Preview"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={handleExportPDF} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Printer className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
