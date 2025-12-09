import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  AlertCircle,
  Calendar,
  DollarSign,
  Target,
  PieChart,
  Activity,
  Search,
  Wallet,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
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
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteDialog } from "@/components/collaboration/InviteDialog";
import { BudgetDialog } from "@/components/budgets/BudgetDialog";
import { budgetAPI, categoriesAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useToast } from "@/hooks/use-toast";

interface Budget {
  id: string;
  name: string;
  totalAmount: number;
  spent: number;
  remaining: number;
  period: "weekly" | "monthly" | "yearly";
  category: string;
  participants: string[];
  createdAt: string;
  endDate: string;
  currency: string;
}

export function Budgets(): JSX.Element {
  const { formatCurrency, convertAmount, formatAmount, formatDate, settings } =
    useUserSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesAPI.getCategories();
      return response.data;
    },
    staleTime: 300000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch budgets from API
  const {
    data: budgets = [],
    refetch,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const response = await budgetAPI.getBudgets();

      // Transform snake_case API response to camelCase
      return response.data.map((budget: any) => ({
        ...budget,
        totalAmount:
          budget.totalAmount ??
          (budget.total_amount ? parseFloat(budget.total_amount) : 0),
        spent:
          budget.spent ??
          (budget.spent_amount ? parseFloat(budget.spent_amount) : 0),
        remaining:
          budget.remaining ??
          (budget.total_amount && budget.spent_amount
            ? parseFloat(budget.total_amount) - parseFloat(budget.spent_amount)
            : 0),
        endDate: budget.endDate ?? budget.end_date,
        category: budget.category?.name ?? budget.category ?? "Uncategorized",
        participants: budget.participants ?? [],
        // Use current user currency as fallback for old budgets without currency
        currency: budget.currency ?? settings.currency,
      }));
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
    retry: 3,
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Delete budget mutation
  const deleteMutation = useMutation({
    mutationFn: (budgetId: string) => budgetAPI.deleteBudget(budgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Success",
        description: "Budget deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete budget.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteBudget = (budgetId: string, budgetName: string) => {
    setBudgetToDelete({ id: budgetId, name: budgetName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBudget = () => {
    if (budgetToDelete) {
      deleteMutation.mutate(budgetToDelete.id);
      setDeleteDialogOpen(false);
      setBudgetToDelete(null);
    }
  };

  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch = budget.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || budget.category === filterCategory;
    const matchesPeriod =
      filterPeriod === "all" || budget.period === filterPeriod;
    return matchesSearch && matchesCategory && matchesPeriod;
  });

  // Debug: Log budget data
  React.useEffect(() => {
    console.log("Current budgets data:", budgets);
    console.log("Budgets length:", budgets.length);
    if (budgets.length > 0) {
      console.log("Sample budget:", budgets[0]);
    }
  }, [budgets]);

  const totalBudgetAmount = budgets.reduce((sum, budget) => {
    const amount = convertAmount(
      budget.totalAmount ?? 0,
      budget.currency || "USD"
    );
    console.log(
      `Budget ${budget.name}: totalAmount=${budget.totalAmount}, converted=${amount}`
    );
    return sum + amount;
  }, 0);
  const totalSpent = budgets.reduce(
    (sum, budget) =>
      sum + convertAmount(budget.spent ?? 0, budget.currency || "USD"),
    0
  );
  const totalRemaining = budgets.reduce(
    (sum, budget) =>
      sum + convertAmount(budget.remaining ?? 0, budget.currency || "USD"),
    0
  );

  const getBudgetStatus = (budget: Budget) => {
    const spent = budget.spent ?? 0;
    const totalAmount = budget.totalAmount ?? 0;
    const percentage = totalAmount > 0 ? (spent / totalAmount) * 100 : 0;
    if (percentage >= 100) return "over";
    if (percentage >= 80) return "warning";
    return "good";
  };

  const getBudgetColor = (status: string) => {
    switch (status) {
      case "over":
        return "text-destructive";
      case "warning":
        return "text-warning";
      default:
        return "text-success";
    }
  };

  // Add loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Budget Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, track, and manage your budgets effectively
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading budgets...</p>
        </div>
      </div>
    );
  }

  // Add error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Budget Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, track, and manage your budgets effectively
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64 flex-col gap-4">
          <p className="text-destructive">
            Error loading budgets: {error.message}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 p-6">
        {/* Header - coherent with Expenses */}
        <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-lime-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-lime-950/30 rounded-2xl p-8 shadow-sm border border-emerald-100/50 dark:border-emerald-900/30">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl">
                  <Wallet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-emerald-700 to-green-600 dark:from-emerald-300 dark:to-green-300 bg-clip-text text-transparent">
                  Budget Tracking
                </h1>
              </div>
              <p className="text-muted-foreground ml-20 text-base">
                Monitor budgets, stay on track, and optimize your goals
              </p>
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 shadow-md h-11 px-6"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Budget
            </Button>
          </div>
        </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-100 dark:border-emerald-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-950 dark:to-emerald-950/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {formatAmount(totalBudgetAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Across {budgets.length} active budgets
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
        </Card>

        <Card className="border-emerald-100 dark:border-emerald-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-950 dark:to-emerald-950/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {formatAmount(totalSpent)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalBudgetAmount > 0
                  ? ((totalSpent / totalBudgetAmount) * 100).toFixed(1)
                  : 0}
                % of total budget
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
        </Card>

        <Card className="border-emerald-100 dark:border-emerald-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-950 dark:to-emerald-950/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {formatAmount(totalRemaining)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Available to spend
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Budget List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              <Input
                placeholder="Search budgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-emerald-200 focus-visible:ring-emerald-400 dark:border-emerald-900/50"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px] border-emerald-200 dark:border-emerald-900/50">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-full sm:w-[150px] border-emerald-200 dark:border-emerald-900/50">
                <SelectValue placeholder="All Periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Budget Cards with Circular Progress */}
          <div className="space-y-4">
            {filteredBudgets.length === 0 ? (
              <Card className="p-12 border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-950 dark:to-emerald-950/10">
                <div className="text-center text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                  <p className="text-lg font-medium">No budgets found</p>
                  <p className="text-sm mt-1">
                    Create your first budget to start tracking your spending
                  </p>
                </div>
              </Card>
            ) : (
              filteredBudgets.map((budget) => {
                const spent = budget.spent ?? 0;
                const totalAmount = budget.totalAmount ?? 0;
                const remaining = budget.remaining ?? 0;
                const status = getBudgetStatus(budget);
                const percentage =
                  totalAmount > 0 ? (spent / totalAmount) * 100 : 0;

                // Determine color based on status
                const getProgressColor = () => {
                  if (percentage >= 100) return "text-red-500";
                  if (percentage >= 80) return "text-orange-500";
                  return "text-emerald-500";
                };

                const getProgressBg = () => {
                  if (percentage >= 100) return "bg-red-100 dark:bg-red-950/30";
                  if (percentage >= 80)
                    return "bg-orange-100 dark:bg-orange-950/30";
                  return "bg-emerald-100 dark:bg-emerald-950/30";
                };

                return (
                  <Card
                    key={budget.id}
                    className="card-financial hover:shadow-elevated transition-shadow border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-950 dark:to-emerald-950/10"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-6">
                        {/* Circular Progress */}
                        <div className="relative flex items-center justify-center">
                          <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="42"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className={getProgressBg()}
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="42"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${(Math.min(percentage, 100) / 100) * 264} 264`}
                              className={getProgressColor()}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span
                              className={cn(
                                "text-2xl font-bold",
                                getProgressColor()
                              )}
                            >
                              {Math.round(percentage)}%
                            </span>
                            <span className="text-xs text-muted-foreground">
                              USED
                            </span>
                          </div>
                        </div>

                        {/* Budget Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">
                                {budget.name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <Badge
                                  variant="secondary"
                                  className="capitalize"
                                >
                                  {budget.period}
                                </Badge>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Until {formatDate(new Date(budget.endDate))}
                                </span>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingBudget(budget);
                                    setIsCreateDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    handleDeleteBudget(budget.id, budget.name)
                                  }
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Budget
                              </p>
                              <p className="font-semibold">
                                {formatCurrency(
                                  totalAmount,
                                  budget.currency || "USD"
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Spent
                              </p>
                              <p className="font-semibold">
                                {formatCurrency(spent, budget.currency || "USD")}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Remaining
                              </p>
                              <p
                                className={cn(
                                  "font-semibold",
                                  getProgressColor()
                                )}
                              >
                                {formatCurrency(
                                  remaining,
                                  budget.currency || "USD"
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {typeof budget.category === "string"
                                  ? budget.category
                                  : budget.category?.name ?? "Uncategorized"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center text-sm text-muted-foreground">
                                <Users className="w-4 h-4 mr-1" />
                                {budget.participants.length} participant
                                {budget.participants.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Budget Health */}
          <Card className="border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-950 dark:to-emerald-950/10 hover:shadow-elevated transition-shadow">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Budget Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">On Track</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 bg-emerald-500 rounded-full" />
                  <span className="text-sm font-semibold text-emerald-600">
                    {
                      budgets.filter((b) => getBudgetStatus(b) === "good")
                        .length
                    }
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Warning</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 bg-orange-500 rounded-full" />
                  <span className="text-sm font-semibold text-orange-600">
                    {
                      budgets.filter((b) => getBudgetStatus(b) === "warning")
                        .length
                    }
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Over Budget</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 bg-red-500 rounded-full" />
                  <span className="text-sm font-semibold text-red-600">
                    {
                      budgets.filter((b) => getBudgetStatus(b) === "over")
                        .length
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card className="border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-950 dark:to-emerald-950/10 hover:shadow-elevated transition-shadow">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                Top Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                // Calculate top categories from budgets
                const categoryMap = new Map<
                  string,
                  { name: string; amount: number }
                >();
                budgets.forEach((budget) => {
                  const categoryName =
                    typeof budget.category === "string"
                      ? budget.category
                      : budget.category?.name ?? "Uncategorized";
                  const existing = categoryMap.get(categoryName);
                  if (existing) {
                    existing.amount += budget.totalAmount ?? 0;
                  } else {
                    categoryMap.set(categoryName, {
                      name: categoryName,
                      amount: budget.totalAmount ?? 0,
                    });
                  }
                });

                const topCategories = Array.from(categoryMap.values())
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 4);

                const colors = [
                  "bg-emerald-500",
                  "bg-purple-500",
                  "bg-orange-500",
                  "bg-blue-500",
                ];

                return topCategories.length > 0 ? (
                  topCategories.map((category, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          colors[index % colors.length]
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {category.name}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatAmount(category.amount)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No categories yet
                  </p>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Budget Dialog */}
      <BudgetDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        budget={editingBudget}
        onSuccess={() => {
          // Invalidate all budget-related queries to ensure fresh data
          queryClient.invalidateQueries({ queryKey: ["budgets"] });
          setEditingBudget(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              budget.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBudget}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </PageTransition>
  );
}
