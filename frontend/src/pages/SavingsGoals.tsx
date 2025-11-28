import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Target,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  DollarSign,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  PiggyBank,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { savingsAPI, categoriesAPI } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SavingsGoal {
  id: string;
  name: string;
  description?: string | null;
  target_amount: string;
  current_amount: string;
  target_date: string;
  category_id: string;
  priority: "high" | "medium" | "low";
  monthly_target?: string | null;
  auto_save: boolean;
  status: "active" | "completed" | "behind" | "on_track" | "overdue";
  user_id: string;
  created_at: string;
  updated_at: string;
  currency?: string;
  progress_percentage?: string;
  amount_remaining?: string;
  days_left?: number;
  months_left?: number;
  time_left_display?: string;
  calculated_status?: string;
  is_completed?: boolean;
  is_overdue?: boolean;
}

interface GoalFormData {
  name: string;
  description?: string;
  target_amount: number;
  current_amount?: number;
  target_date: string;
  category_id: string;
  priority: "high" | "medium" | "low";
  monthly_target?: number;
  currency?: string;
}

export const SavingsGoals: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    formatCurrency,
    convertAmount,
    formatAmount,
    formatDate,
    getCurrencySymbol,
    settings,
  } = useUserSettings();
  const [filter, setFilter] = useState<
    "all" | "active" | "completed" | "behind"
  >("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"add" | "withdraw">(
    "add"
  );
  const [transactionGoalId, setTransactionGoalId] = useState<string | null>(
    null
  );
  const [transactionAmount, setTransactionAmount] = useState("");

  useEffect(() => {
    document.title = "Savings Goals - SpendSense";
  }, []);

  const [formData, setFormData] = useState<GoalFormData>({
    name: "",
    description: "",
    target_amount: 0,
    current_amount: 0,
    target_date: "",
    category_id: "",
    priority: "medium",
    monthly_target: 0,
    currency: settings.currency,
  });

  // Helper function to calculate goal progress on the frontend
  const calculateGoalProgress = (goal: SavingsGoal): SavingsGoal => {
    const currentAmount = parseFloat(goal.current_amount);
    const targetAmount = parseFloat(goal.target_amount);
    const progressPercentage =
      targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

    const today = new Date();
    const targetDate = new Date(goal.target_date);
    const timeLeftMs = targetDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24));
    const monthsLeft = Math.ceil(daysLeft / 30);

    // Calculate status
    let calculatedStatus = goal.status;
    if (goal.status !== "completed") {
      if (daysLeft < 0) {
        calculatedStatus = "overdue";
      } else if (progressPercentage >= 100) {
        calculatedStatus = "completed";
      } else {
        const totalDays = Math.ceil(
          (targetDate.getTime() - new Date(goal.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const daysPassed = totalDays - daysLeft;
        const expectedProgress =
          totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

        if (progressPercentage >= expectedProgress - 10) {
          calculatedStatus = "on_track";
        } else {
          calculatedStatus = "behind";
        }
      }
    }

    return {
      ...goal,
      progress_percentage: progressPercentage.toFixed(2),
      amount_remaining: (targetAmount - currentAmount).toFixed(2),
      days_left: daysLeft,
      months_left: monthsLeft,
      time_left_display:
        daysLeft < 0
          ? "Overdue"
          : daysLeft === 0
          ? "Today"
          : daysLeft === 1
          ? "1 day"
          : daysLeft < 30
          ? `${daysLeft} days`
          : `${monthsLeft} month${monthsLeft > 1 ? "s" : ""}`,
      calculated_status: calculatedStatus,
      is_completed: progressPercentage >= 100,
      is_overdue: daysLeft < 0 && progressPercentage < 100,
    };
  };

  // Fetch savings goals
  const { data: rawGoals = [], isLoading } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: async () => {
      const response = await savingsAPI.getGoals();
      return response.data.map((goal: SavingsGoal) => ({
        ...goal,
        currency: goal.currency || settings.currency,
      })) as SavingsGoal[];
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  // Calculate progress for all goals on the frontend
  const goals = rawGoals.map(calculateGoalProgress);

  // Fetch categories for dropdown (using budget categories same as expenses)
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesAPI.getCategories();
      return response.data;
    },
    staleTime: 300000, // Cache for 5 minutes (categories rarely change)
    refetchOnWindowFocus: false,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => savingsAPI.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      toast({
        title: "Success",
        description: "Savings goal deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete goal.",
        variant: "destructive",
      });
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: { id?: string; formData: GoalFormData }) => {
      if (data.id) {
        return savingsAPI.updateGoal(data.id, data.formData);
      }
      return savingsAPI.createGoal(data.formData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      toast({
        title: "Success",
        description: variables.id
          ? "Goal updated successfully."
          : "Goal created successfully.",
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save goal.",
        variant: "destructive",
      });
    },
  });

  // Add/Withdraw mutation
  const transactionMutation = useMutation({
    mutationFn: ({
      id,
      amount,
      type,
    }: {
      id: string;
      amount: number;
      type: "add" | "withdraw";
    }) => {
      if (type === "add") {
        return savingsAPI.addToGoal(id, amount);
      }
      return savingsAPI.withdrawFromGoal(id, amount);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      toast({
        title: "Success",
        description:
          variables.type === "add"
            ? "Amount added successfully."
            : "Amount withdrawn successfully.",
      });
      setTransactionDialogOpen(false);
      setTransactionAmount("");
      setTransactionGoalId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Transaction failed.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      target_amount: 0,
      current_amount: 0,
      target_date: "",
      category_id: "",
      priority: "medium",
      monthly_target: 0,
    });
    setEditingGoal(null);
  };

  const handleCreateClick = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEditClick = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      description: goal.description || "",
      target_amount: parseFloat(goal.target_amount),
      current_amount: parseFloat(goal.current_amount),
      target_date: goal.target_date,
      category_id: goal.category_id,
      priority: goal.priority,
      monthly_target: goal.monthly_target ? parseFloat(goal.monthly_target) : 0,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (goalId: string) => {
    setGoalToDelete(goalId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (goalToDelete) {
      deleteMutation.mutate(goalToDelete);
    }
  };

  const handleSaveGoal = () => {
    // Validate target_date is not in the past when creating new goal
    if (!editingGoal && formData.target_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(formData.target_date);
      if (targetDate < today) {
        toast({
          title: "Validation Error",
          description:
            "Target date cannot be in the past. Please select a current or future date.",
          variant: "destructive",
        });
        return;
      }
    }

    saveMutation.mutate({
      id: editingGoal?.id,
      formData: {
        ...formData,
        currency: settings.currency, // Always use current currency setting
      },
    });
  };

  const handleTransaction = (goalId: string, type: "add" | "withdraw") => {
    setTransactionGoalId(goalId);
    setTransactionType(type);
    setTransactionDialogOpen(true);
  };

  const handleTransactionSubmit = () => {
    if (transactionGoalId && transactionAmount) {
      transactionMutation.mutate({
        id: transactionGoalId,
        amount: parseFloat(transactionAmount),
        type: transactionType,
      });
    }
  };

  const getGoalStatus = (goal: SavingsGoal) => {
    return goal.calculated_status || goal.status;
  };

  const filteredGoals = goals.filter((goal) => {
    const status = getGoalStatus(goal);
    switch (filter) {
      case "active":
        return status === "active" || status === "on_track";
      case "completed":
        return status === "completed";
      case "behind":
        return status === "behind" || status === "overdue";
      default:
        return true;
    }
  });

  const totalTargetAmount = goals.reduce(
    (sum, goal) =>
      sum +
      convertAmount(parseFloat(goal.target_amount), goal.currency || "USD"),
    0
  );
  const totalCurrentAmount = goals.reduce(
    (sum, goal) =>
      sum +
      convertAmount(parseFloat(goal.current_amount), goal.currency || "USD"),
    0
  );
  const overallProgress =
    totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;
  const completedGoals = goals.filter(
    (goal) => getGoalStatus(goal) === "completed"
  ).length;
  const totalMonthlyTarget = goals.reduce(
    (sum, goal) => sum + parseFloat(goal.monthly_target || "0"),
    0
  );

  return (
    <div className="space-y-8 p-2">
      {/* Header with Rose/Pink Gradient */}
      <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-fuchsia-50 dark:from-rose-950/30 dark:via-pink-950/30 dark:to-fuchsia-950/30 rounded-2xl p-8 shadow-sm border border-rose-100/50 dark:border-rose-900/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 rounded-xl">
                <PiggyBank className="w-8 h-8 text-rose-600 dark:text-rose-400" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-rose-700 to-pink-600 dark:from-rose-300 dark:to-pink-300 bg-clip-text text-transparent">
                Savings Goals
              </h1>
            </div>
            <p className="text-muted-foreground ml-20 text-base">
              Track your progress and achieve your financial dreams
            </p>
          </div>
          <Button
            className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 shadow-md h-11 px-6"
            onClick={handleCreateClick}
          >
            <Plus className="w-5 h-5 mr-2" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Overview Cards with Rose/Pink Theme */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-rose-100 dark:border-rose-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-rose-50/30 dark:from-slate-950 dark:to-rose-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Target
                </p>
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                  {formatAmount(totalTargetAmount)}
                </p>
              </div>
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <Target className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across {goals.length} goals
            </p>
          </CardContent>
        </Card>

        <Card className="border-pink-100 dark:border-pink-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-pink-50/30 dark:from-slate-950 dark:to-pink-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Saved
                </p>
                <p className="text-2xl font-bold text-pink-700 dark:text-pink-300">
                  {formatAmount(totalCurrentAmount)}
                </p>
              </div>
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {overallProgress.toFixed(1)}% of total target
            </p>
          </CardContent>
        </Card>

        <Card className="border-fuchsia-100 dark:border-fuchsia-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-fuchsia-50/30 dark:from-slate-950 dark:to-fuchsia-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-300">
                  {completedGoals}
                </p>
              </div>
              <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-lg">
                <Trophy className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Goals achieved</p>
          </CardContent>
        </Card>

        <Card className="border-rose-100 dark:border-rose-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-rose-50/30 dark:from-slate-950 dark:to-rose-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Target
                </p>
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                  {formatAmount(totalMonthlyTarget)}
                </p>
              </div>
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              To stay on track
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="goals" className="w-full">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <TabsList className="grid w-full sm:w-fit grid-cols-2">
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                {["all", "active", "completed", "behind"].map(
                  (filterOption) => (
                    <Button
                      key={filterOption}
                      variant={filter === filterOption ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(filterOption as any)}
                      className="capitalize"
                    >
                      {filterOption}
                    </Button>
                  )
                )}
              </div>
            </div>

            <TabsContent value="goals" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="card-financial">
                      <CardHeader>
                        <div className="space-y-3">
                          <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
                          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-20 bg-muted rounded animate-pulse" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredGoals.length === 0 ? (
                <Card className="card-financial">
                  <CardContent className="p-8 text-center">
                    <PiggyBank className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No savings goals found. Create one to get started!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredGoals.map((goal) => {
                  const progress = parseFloat(goal.progress_percentage || "0");
                  const status = getGoalStatus(goal);
                  const currentAmount = parseFloat(goal.current_amount);
                  const targetAmount = parseFloat(goal.target_amount);
                  const category = categories.find(
                    (cat: any) => cat.id === goal.category_id
                  );

                  return (
                    <Card key={goal.id} className="card-financial">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-xl">
                                {goal.name}
                              </CardTitle>
                              {status === "overdue" && (
                                <Badge variant="destructive">Overdue</Badge>
                              )}
                              {goal.auto_save && (
                                <Badge variant="outline" className="gap-1">
                                  <Plus className="w-3 h-3" />
                                  Auto-save
                                </Badge>
                              )}
                            </div>
                            {goal.description && (
                              <CardDescription className="text-sm">
                                {goal.description}
                              </CardDescription>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditClick(goal)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteClick(goal.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">
                              {formatCurrency(
                                currentAmount,
                                goal.currency || "USD"
                              )}{" "}
                              of{" "}
                              {formatCurrency(
                                targetAmount,
                                goal.currency || "USD"
                              )}
                            </span>
                            <span className="font-bold text-lg">
                              {progress.toFixed(1)}%
                            </span>
                          </div>

                          <Progress
                            value={Math.min(progress, 100)}
                            className="h-2"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium text-foreground">
                                Target Date
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {formatDate(goal.target_date)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium text-foreground">
                                Time Left
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                  goal.is_overdue
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                                )}
                              >
                                {goal.time_left_display || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium text-foreground">
                                Monthly Need
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {formatCurrency(
                                  parseFloat(goal.monthly_target || "0"),
                                  goal.currency || "USD"
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          {category && (
                            <Badge variant="secondary" className="capitalize">
                              {category.icon} {category.name}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <Card className="card-financial">
                <CardHeader>
                  <CardTitle>Progress Overview</CardTitle>
                  <CardDescription>
                    Visual breakdown of your savings progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {goals.map((goal) => {
                      const progress = parseFloat(
                        goal.progress_percentage || "0"
                      );
                      const status = getGoalStatus(goal);
                      const currentAmount = parseFloat(goal.current_amount);
                      const targetAmount = parseFloat(goal.target_amount);

                      return (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{goal.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(progress, 100)}
                            className={cn(
                              "h-2",
                              status === "completed"
                                ? "[&>div]:bg-success"
                                : status === "behind" || status === "overdue"
                                ? "[&>div]:bg-destructive"
                                : "[&>div]:bg-primary"
                            )}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              {formatCurrency(
                                currentAmount,
                                goal.currency || "USD"
                              )}
                            </span>
                            <span>
                              {formatCurrency(
                                targetAmount,
                                goal.currency || "USD"
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Goal Statistics */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm">Goal Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-success">Completed</span>
                  <span className="font-medium">
                    {
                      goals.filter((g) => getGoalStatus(g) === "completed")
                        .length
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-primary">On Track</span>
                  <span className="font-medium">
                    {
                      goals.filter((g) => getGoalStatus(g) === "on_track")
                        .length
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-warning">Active</span>
                  <span className="font-medium">
                    {goals.filter((g) => getGoalStatus(g) === "active").length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-destructive">Behind</span>
                  <span className="font-medium">
                    {
                      goals.filter((g) =>
                        ["behind", "overdue"].includes(getGoalStatus(g))
                      ).length
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm">By Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categories.map((category: any) => {
                const categoryGoals = goals.filter(
                  (g) => g.category_id === category.id
                );
                const categoryTotal = categoryGoals.reduce(
                  (sum, g) => sum + parseFloat(g.target_amount),
                  0
                );

                if (categoryGoals.length === 0) return null;

                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between"
                  >
                    <Badge variant="secondary" className="capitalize">
                      {category.icon && (
                        <span className="mr-2">{category.icon}</span>
                      )}
                      {category.name}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatAmount(categoryTotal)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Edit Goal" : "Create New Goal"}
            </DialogTitle>
            <DialogDescription>
              {editingGoal
                ? "Update your savings goal details"
                : "Set up a new savings goal to track your progress"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Emergency Fund"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of your goal"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="target_amount">
                  Target Amount ({getCurrencySymbol()})
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 font-semibold text-lg"
                    onClick={() => {
                      const current = formData.target_amount || 0;
                      const newValue = Math.max(0, current - 100);
                      setFormData({ ...formData, target_amount: newValue });
                    }}
                  >
                    −
                  </Button>
                  <Input
                    id="target_amount"
                    type="number"
                    value={formData.target_amount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="5000"
                    className="text-center"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 font-semibold text-lg"
                    onClick={() => {
                      const current = formData.target_amount || 0;
                      const newValue = current + 100;
                      setFormData({ ...formData, target_amount: newValue });
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current_amount">
                  Current Amount ({getCurrencySymbol()})
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 font-semibold text-lg"
                    onClick={() => {
                      const current = formData.current_amount || 0;
                      const newValue = Math.max(0, current - 100);
                      setFormData({ ...formData, current_amount: newValue });
                    }}
                  >
                    −
                  </Button>
                  <Input
                    id="current_amount"
                    type="number"
                    value={formData.current_amount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="text-center"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 font-semibold text-lg"
                    onClick={() => {
                      const current = formData.current_amount || 0;
                      const newValue = current + 100;
                      setFormData({ ...formData, current_amount: newValue });
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target_date">Target Date</Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) =>
                  setFormData({ ...formData, target_date: e.target.value })
                }
                className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthly_target">Monthly Target ($)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 font-semibold text-lg"
                    onClick={() => {
                      const current = formData.monthly_target || 0;
                      const newValue = Math.max(0, current - 50);
                      setFormData({ ...formData, monthly_target: newValue });
                    }}
                  >
                    −
                  </Button>
                  <Input
                    id="monthly_target"
                    type="number"
                    value={formData.monthly_target || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthly_target: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="500"
                    className="text-center"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 font-semibold text-lg"
                    onClick={() => {
                      const current = formData.monthly_target || 0;
                      const newValue = current + 50;
                      setFormData({ ...formData, monthly_target: newValue });
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category_id">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon && <span className="mr-2">{cat.icon}</span>}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGoal} disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Saving..."
                : editingGoal
                ? "Update Goal"
                : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {transactionType === "add" ? "Add Funds" : "Withdraw Funds"}
            </DialogTitle>
            <DialogDescription>
              {transactionType === "add"
                ? "Add money to your savings goal"
                : "Withdraw money from your savings goal"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount ({getCurrencySymbol()})</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 font-semibold text-lg"
                  onClick={() => {
                    const current = parseFloat(transactionAmount) || 0;
                    const newValue = Math.max(0, current - 50);
                    setTransactionAmount(newValue.toString());
                  }}
                >
                  −
                </Button>
                <Input
                  id="amount"
                  type="number"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  placeholder="100"
                  className="text-center"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 font-semibold text-lg"
                  onClick={() => {
                    const current = parseFloat(transactionAmount) || 0;
                    const newValue = current + 50;
                    setTransactionAmount(newValue.toString());
                  }}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransactionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransactionSubmit}
              disabled={transactionMutation.isPending}
            >
              {transactionMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              savings goal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
