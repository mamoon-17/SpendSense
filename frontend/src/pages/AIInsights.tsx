import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Insight {
  type: "warning" | "alert" | "tip" | "success";
  title: string;
  description: string;
  category?: string;
  amount?: number;
}

interface InsightsResponse {
  success: boolean;
  insights: Insight[];
  summary?: {
    totalSpent: number;
    topCategories: [string, number][];
    budgetStatus: {
      name: string;
      category: string;
      spent: number;
      total: number;
      percentage: number;
    }[];
    overBudget: any[];
    nearingLimit: any[];
    savingsStatus: {
      name: string;
      current: number;
      target: number;
      percentage: number;
    }[];
    expenseCount: number;
  };
  generatedAt: string;
  fallback?: boolean;
}

const insightConfig = {
  alert: {
    icon: AlertCircle,
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-900",
    iconColor: "text-red-600 dark:text-red-400",
    titleColor: "text-red-800 dark:text-red-300",
    badge: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-900",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    titleColor: "text-yellow-800 dark:text-yellow-300",
    badge: "secondary" as const,
  },
  tip: {
    icon: Lightbulb,
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900",
    iconColor: "text-blue-600 dark:text-blue-400",
    titleColor: "text-blue-800 dark:text-blue-300",
    badge: "default" as const,
  },
  success: {
    icon: CheckCircle2,
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-900",
    iconColor: "text-green-600 dark:text-green-400",
    titleColor: "text-green-800 dark:text-green-300",
    badge: "outline" as const,
  },
};

const InsightCard: React.FC<{ insight: Insight; index: number }> = ({
  insight,
  index,
}) => {
  const config = insightConfig[insight.type] || insightConfig.tip;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "p-5 rounded-xl border-2 transition-all hover:shadow-lg animate-in fade-in slide-in-from-bottom-4",
        config.bgColor,
        config.borderColor,
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "p-2 rounded-lg bg-white/50 dark:bg-black/20",
            config.iconColor,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn("font-bold text-base", config.titleColor)}>
              {insight.title}
            </h4>
            <Badge variant={config.badge} className="text-xs">
              {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insight.description}
          </p>
          <div className="flex items-center gap-3 mt-3">
            {insight.category && (
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                <Wallet className="w-3 h-3 mr-1" />
                {insight.category}
              </span>
            )}
            {insight.amount && (
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                <DollarSign className="w-3 h-3 mr-0.5" />
                {insight.amount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AIInsightsPage: React.FC = () => {
  const {
    data: insightsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<InsightsResponse>({
    queryKey: ["ai-insights"],
    queryFn: async () => {
      const response = await api.get("/ai/insights");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const summary = insightsData?.summary;

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">
                Unable to Load Insights
              </h3>
              <p className="text-muted-foreground mb-6">
                We couldn't analyze your financial data right now. Please try
                again.
              </p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            AI Financial Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            Personalized analysis and recommendations based on your spending
            patterns
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Analysis
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full animate-ping opacity-20" />
          </div>
          <p className="mt-6 text-lg font-medium text-muted-foreground">
            Analyzing your financial data...
          </p>
          <p className="text-sm text-muted-foreground">
            This may take a few seconds
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2 hover:border-primary/20 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">
                        Total Spent
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        $
                        {summary.totalSpent?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                      <TrendingDown className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    From {summary.expenseCount} recent expenses
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/20 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">
                        Budget Health
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        {summary.overBudget?.length === 0 ? (
                          <span className="text-green-600">On Track</span>
                        ) : (
                          <span className="text-red-600">
                            {summary.overBudget.length} Over
                          </span>
                        )}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "p-3 rounded-xl",
                        summary.overBudget?.length === 0
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30",
                      )}
                    >
                      <Wallet
                        className={cn(
                          "h-6 w-6",
                          summary.overBudget?.length === 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400",
                        )}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {summary.nearingLimit?.length > 0
                      ? `${summary.nearingLimit.length} budget(s) nearing limit`
                      : "All budgets within limits"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/20 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">
                        Top Category
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        {summary.topCategories?.[0]?.[0] || "N/A"}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {summary.topCategories?.[0]?.[1]
                      ? `$${summary.topCategories[0][1].toFixed(2)} spent`
                      : "No spending data"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/20 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">
                        Savings Goals
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        {summary.savingsStatus?.length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Active savings goals
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Insights - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI Recommendations
                  </CardTitle>
                  <CardDescription>
                    Actionable insights to improve your financial health
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insightsData?.insights?.length === 0 ? (
                    <div className="text-center py-8">
                      <PiggyBank className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        Add some expenses and budgets to get personalized
                        insights
                      </p>
                    </div>
                  ) : (
                    insightsData?.insights?.map((insight, index) => (
                      <InsightCard
                        key={index}
                        insight={insight}
                        index={index}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Side Panel */}
            <div className="space-y-4">
              {/* Top Spending Categories */}
              {summary?.topCategories && summary.topCategories.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      Top Spending Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {summary.topCategories
                      .slice(0, 5)
                      .map(([name, amount], i) => (
                        <div key={name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{name}</span>
                            <span className="text-muted-foreground">
                              ${amount.toFixed(2)}
                            </span>
                          </div>
                          <Progress
                            value={
                              summary.totalSpent > 0
                                ? (amount / summary.totalSpent) * 100
                                : 0
                            }
                            className="h-2"
                          />
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}

              {/* Savings Progress */}
              {summary?.savingsStatus && summary.savingsStatus.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      Savings Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {summary.savingsStatus.slice(0, 3).map((goal) => (
                      <div key={goal.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate max-w-[150px]">
                            {goal.name}
                          </span>
                          <span className="text-muted-foreground">
                            {goal.percentage.toFixed(0)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(goal.percentage, 100)}
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          ${goal.current.toFixed(0)} / ${goal.target.toFixed(0)}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Budget Alerts */}
              {summary &&
                (summary.overBudget?.length > 0 ||
                  summary.nearingLimit?.length > 0) && (
                  <Card className="border-yellow-200 dark:border-yellow-900">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Budget Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {summary.overBudget?.map((budget: any) => (
                        <div
                          key={budget.name}
                          className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20"
                        >
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700 dark:text-red-300">
                            {budget.name}
                          </span>
                          <Badge variant="destructive" className="ml-auto">
                            {budget.percentage.toFixed(0)}%
                          </Badge>
                        </div>
                      ))}
                      {summary.nearingLimit?.map((budget: any) => (
                        <div
                          key={budget.name}
                          className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20"
                        >
                          <ArrowDownRight className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                            {budget.name}
                          </span>
                          <Badge variant="secondary" className="ml-auto">
                            {budget.percentage.toFixed(0)}%
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
            </div>
          </div>

          {/* Footer */}
          {insightsData?.generatedAt && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Analysis generated at{" "}
              {new Date(insightsData.generatedAt).toLocaleString()}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AIInsightsPage;
