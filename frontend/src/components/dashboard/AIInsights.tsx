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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    overBudget: any[];
    nearingLimit: any[];
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
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-900",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    titleColor: "text-yellow-800 dark:text-yellow-300",
  },
  tip: {
    icon: Lightbulb,
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900",
    iconColor: "text-blue-600 dark:text-blue-400",
    titleColor: "text-blue-800 dark:text-blue-300",
  },
  success: {
    icon: CheckCircle2,
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-900",
    iconColor: "text-green-600 dark:text-green-400",
    titleColor: "text-green-800 dark:text-green-300",
  },
};

const InsightCard: React.FC<{ insight: Insight }> = ({ insight }) => {
  const config = insightConfig[insight.type] || insightConfig.tip;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all hover:shadow-sm",
        config.bgColor,
        config.borderColor,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5", config.iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-semibold text-sm", config.titleColor)}>
            {insight.title}
          </h4>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {insight.description}
          </p>
          {insight.category && (
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
              {insight.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const AIInsights: React.FC = () => {
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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  if (error) {
    return (
      <Card className="card-financial">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Unable to load AI insights right now
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-financial">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
          <CardDescription className="mt-1">
            Personalized tips to improve your finances
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 w-8"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Analyzing your spending...
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {insightsData?.insights?.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
            {insightsData?.generatedAt && (
              <p className="text-xs text-muted-foreground text-right pt-2">
                Updated{" "}
                {new Date(insightsData.generatedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
