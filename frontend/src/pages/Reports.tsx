import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  FileText,
  Eye,
  DollarSign,
  Target,
  AlertCircle,
  Zap,
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
import { Badge } from "@/components/ui/badge";
import { AIAssistant } from "@/components/ai/AIAssistant";
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
import { reportsAPI } from "@/lib/api";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

// Mock data for charts
const monthlySpendingData = [
  { month: "Aug", income: 5000, expenses: 3200, savings: 1800 },
  { month: "Sep", income: 5200, expenses: 3100, savings: 2100 },
  { month: "Oct", income: 4800, expenses: 3400, savings: 1400 },
  { month: "Nov", income: 5500, expenses: 3600, savings: 1900 },
  { month: "Dec", income: 5300, expenses: 4200, savings: 1100 },
  { month: "Jan", income: 5000, expenses: 3500, savings: 1500 },
];

const categoryData = [
  { name: "Food & Dining", value: 850, percentage: 35 },
  { name: "Transportation", value: 420, percentage: 17 },
  { name: "Shopping", value: 380, percentage: 16 },
  { name: "Entertainment", value: 290, percentage: 12 },
  { name: "Bills", value: 480, percentage: 20 },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--muted))",
];

const savingsGoalsData = [
  { name: "Emergency Fund", target: 15000, current: 8750, progress: 58 },
  { name: "Vacation", target: 5000, current: 3200, progress: 64 },
  { name: "New Car", target: 25000, current: 12500, progress: 50 },
];

export const Reports: React.FC = () => {
  const [reportPeriod, setReportPeriod] = useState("month");
  const [reportType, setReportType] = useState("spending");

  useEffect(() => {
    document.title = "Reports - SpendSense";
  }, []);

  // Mock query - replace with real API call
  const { data: reportData } = useQuery({
    queryKey: ["reports", reportPeriod, reportType],
    queryFn: () =>
      reportsAPI.getSpendingReport(reportPeriod).then((res) => res.data),
  });

  const handleExportReport = (format: "pdf" | "csv" | "excel") => {
    // Mock export functionality
    console.log(`Exporting ${reportType} report as ${format}`);
  };

  const totalIncome =
    monthlySpendingData[monthlySpendingData.length - 1].income;
  const totalExpenses =
    monthlySpendingData[monthlySpendingData.length - 1].expenses;
  const totalSavings =
    monthlySpendingData[monthlySpendingData.length - 1].savings;
  const savingsRate = ((totalSavings / totalIncome) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Financial Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your financial health with AI analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button className="btn-primary">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Report Controls */}
      <Card className="card-financial">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
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

            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spending">Spending Analysis</SelectItem>
                <SelectItem value="income">Income Report</SelectItem>
                <SelectItem value="savings">Savings Progress</SelectItem>
                <SelectItem value="budget">Budget Performance</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => handleExportReport("pdf")}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportReport("csv")}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportReport("excel")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Excel
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
                  ${totalIncome.toLocaleString()}
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
                  ${totalExpenses.toLocaleString()}
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
                  ${totalSavings.toLocaleString()}
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
                <p className="text-2xl font-bold text-warning">Good</p>
              </div>
              <BarChart3 className="w-8 h-8 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              3 budgets on track
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
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="mt-6">
              <Card className="card-financial">
                <CardHeader>
                  <CardTitle>Income vs Expenses Trend</CardTitle>
                  <CardDescription>
                    6-month financial overview with AI predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                              `$${value}`,
                              "Amount",
                            ]}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
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
                    {categoryData.map((category, index) => (
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
                          <p className="font-semibold">${category.value}</p>
                          <p className="text-xs text-muted-foreground">
                            {category.percentage}%
                          </p>
                        </div>
                      </div>
                    ))}
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
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `$${value.toLocaleString()}`,
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              <div className="space-y-4">
                <Card className="card-financial">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-primary" />
                      AI Financial Analysis
                    </CardTitle>
                    <CardDescription>
                      Personalized insights based on your spending patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                      <div className="flex items-start space-x-3">
                        <TrendingUp className="w-5 h-5 text-success mt-0.5" />
                        <div>
                          <h4 className="font-medium text-success">
                            Positive Trend
                          </h4>
                          <p className="text-sm text-foreground mt-1">
                            Your savings rate improved by 3.2% this month.
                            You're on track to meet your emergency fund goal 2
                            months early!
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                        <div>
                          <h4 className="font-medium text-warning">
                            Optimization Opportunity
                          </h4>
                          <p className="text-sm text-foreground mt-1">
                            Your dining expenses increased 23% this month.
                            Consider meal planning to reduce costs by an
                            estimated $200/month.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-start space-x-3">
                        <Target className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium text-primary">
                            Smart Recommendation
                          </h4>
                          <p className="text-sm text-foreground mt-1">
                            Based on your income growth, consider increasing
                            your investment contribution by $300/month to
                            maximize long-term wealth building.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-financial">
                  <CardHeader>
                    <CardTitle>Monthly Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border border-border rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          vs Last Month
                        </p>
                        <p className="text-2xl font-bold text-success">+$320</p>
                        <p className="text-xs text-muted-foreground">
                          More saved
                        </p>
                      </div>
                      <div className="p-4 border border-border rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          Budget Adherence
                        </p>
                        <p className="text-2xl font-bold text-primary">87%</p>
                        <p className="text-xs text-muted-foreground">
                          Avg across categories
                        </p>
                      </div>
                      <div className="p-4 border border-border rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          Goal Progress
                        </p>
                        <p className="text-2xl font-bold text-warning">+12%</p>
                        <p className="text-xs text-muted-foreground">
                          Closer to targets
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <AIAssistant compact context="reports" />

          {/* Quick Export */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Monthly Summary
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Tax Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Budget Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant context="reports" />
    </div>
  );
};
