import React, { useState, useMemo, useEffect } from "react";
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
  Search,
  X,
  Filter,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InviteDialog } from "@/components/collaboration/InviteDialog";
import { BudgetDialog } from "@/components/budgets/BudgetDialog";
import { budgetAPI, categoriesAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Backend Budget interface (matches the entity)
interface BackendBudget {
  id: string;
  name: string;
  total_amount: string;
  spent_amount: string;
  period: "daily" | "weekly" | "monthly" | "yearly";
  category: { id: string; name: string };
  start_date: string;
  end_date: string;
  created_by: { id: string; name: string };
  participants: { id: string; name: string }[];
}

// Frontend Budget interface (for display)
interface Budget {
  id: string;
  name: string;
  totalAmount: number;
  spent: number;
  remaining: number;
  period: "daily" | "weekly" | "monthly" | "yearly";
  category: string;
  categoryId: string;
  participants: { id: string; name: string }[];
  startDate: string;
  endDate: string;
}

// Helper function to transform backend budget to frontend format
const transformBudget = (backendBudget: BackendBudget): Budget => {
  const totalAmount = parseFloat(backendBudget.total_amount) || 0;
  const spent = parseFloat(backendBudget.spent_amount) || 0;
  const remaining = totalAmount - spent;

  return {
    id: backendBudget.id,
    name: backendBudget.name,
    totalAmount,
    spent,
    remaining,
    period: backendBudget.period,
    category: backendBudget.category?.name || "Uncategorized",
    categoryId: backendBudget.category?.id || "",
    participants: backendBudget.participants || [],
    startDate: backendBudget.start_date,
    endDate: backendBudget.end_date,
  };
};

export const Budgets: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<
    BackendBudget | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Budgets - SpendSense";
  }, []);

  // Fetch budgets
  const { data: budgetsData = [], isLoading } = useQuery({
    queryKey: ["budgets"],
<<<<<<< HEAD
    queryFn: () =>
      budgetAPI.getBudgets().then((res) => {
        // Transform snake_case API response to camelCase
        return res.data.map((budget: any) => ({
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
              ? parseFloat(budget.total_amount) -
                parseFloat(budget.spent_amount)
              : 0),
          endDate: budget.endDate ?? budget.end_date,
          category: budget.category?.name ?? budget.category ?? "Uncategorized",
          participants: budget.participants ?? [],
        }));
      }),
=======
    queryFn: async () => {
      const response = await budgetAPI.getBudgets();
      return response.data;
    },
>>>>>>> origin/feature1
  });

  // Fetch categories for filters
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "budget"],
    queryFn: async () => {
      const response = await categoriesAPI.getCategoriesByType("budget");
      return response.data;
    },
  });

  // Transform budgets to frontend format
  const budgets: Budget[] = useMemo(() => {
    return Array.isArray(budgetsData) ? budgetsData.map(transformBudget) : [];
  }, [budgetsData]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetAPI.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Success",
        description: "Budget deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setBudgetToDelete(null);
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

  const handleCreateClick = () => {
    setEditingBudget(undefined);
    setDialogOpen(true);
  };

  const handleEditClick = (budget: Budget) => {
    // Find the original backend budget
    const backendBudget = budgetsData.find(
      (b: BackendBudget) => b.id === budget.id
    );
    setEditingBudget(backendBudget);
    setDialogOpen(true);
  };

  const handleDeleteClick = (budgetId: string) => {
    setBudgetToDelete(budgetId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (budgetToDelete) {
      deleteMutation.mutate(budgetToDelete);
    }
  };

  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch = budget.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || budget.categoryId === filterCategory;
    const matchesPeriod =
      filterPeriod === "all" || budget.period === filterPeriod;
    return matchesSearch && matchesCategory && matchesPeriod;
  });

  const totalBudgetAmount = budgets.reduce(
    (sum, budget) => sum + (budget.totalAmount ?? 0),
    0
  );
  const totalSpent = budgets.reduce(
    (sum, budget) => sum + (budget.spent ?? 0),
    0
  );
  const totalRemaining = budgets.reduce(
    (sum, budget) => sum + (budget.remaining ?? 0),
    0
  );

  const getBudgetStatus = (budget: Budget) => {
<<<<<<< HEAD
    const spent = budget.spent ?? 0;
    const totalAmount = budget.totalAmount ?? 0;
    const percentage = totalAmount > 0 ? (spent / totalAmount) * 100 : 0;
=======
    const percentage =
      budget.totalAmount > 0 ? (budget.spent / budget.totalAmount) * 100 : 0;
>>>>>>> origin/feature1
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

  // Calculate budget health stats
  const budgetHealth = useMemo(() => {
    const onTrack = budgets.filter((b) => getBudgetStatus(b) === "good").length;
    const warning = budgets.filter(
      (b) => getBudgetStatus(b) === "warning"
    ).length;
    const over = budgets.filter((b) => getBudgetStatus(b) === "over").length;
    return { onTrack, warning, over };
  }, [budgets]);

  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    budgets.forEach((budget) => {
      breakdown[budget.category] =
        (breakdown[budget.category] || 0) + budget.totalAmount;
    });
    return Object.entries(breakdown)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [budgets]);

  // Check if filters are active
  const hasActiveFilters =
    searchTerm !== "" || filterCategory !== "all" || filterPeriod !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterPeriod("all");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="card-financial">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="card-financial">
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Budget Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, track, and manage your budgets effectively
            </p>
          </div>
          <Button className="btn-primary w-fit" onClick={handleCreateClick}>
            <Plus className="w-4 h-4 mr-2" />
            Create Budget
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-financial">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Budget
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalBudgetAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {budgets.length} active budgets
              </p>
            </CardContent>
          </Card>

<<<<<<< HEAD
          {/* Budget Cards */}
          <div className="space-y-4">
            {filteredBudgets.map((budget) => {
              const spent = budget.spent ?? 0;
              const totalAmount = budget.totalAmount ?? 0;
              const remaining = budget.remaining ?? 0;
              const status = getBudgetStatus(budget);
              const percentage =
                totalAmount > 0 ? (spent / totalAmount) * 100 : 0;
=======
          <Card className="card-financial">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                ${totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalBudgetAmount > 0
                  ? `${((totalSpent / totalBudgetAmount) * 100).toFixed(
                      1
                    )}% of total budget`
                  : "No budgets"}
              </p>
            </CardContent>
          </Card>
>>>>>>> origin/feature1

          <Card className="card-financial">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                ${totalRemaining.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Available to spend
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Budget List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters */}
            <Card className="card-financial">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search budgets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setSearchTerm("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
<<<<<<< HEAD
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        ${spent.toLocaleString()} spent
                      </span>
                      <span
                        className={cn("font-medium", getBudgetColor(status))}
                      >
                        ${remaining.toLocaleString()} remaining
                      </span>
                    </div>

                    <Progress
                      value={Math.min(percentage, 100)}
                      className={cn(
                        "h-3",
                        status === "over"
                          ? "[&>div]:bg-destructive"
                          : status === "warning"
                          ? "[&>div]:bg-warning"
                          : "[&>div]:bg-success"
                      )}
                    />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}% used
                      </span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{budget.category}</Badge>
                        <span className="text-lg font-semibold">
                          ${totalAmount.toLocaleString()}
                        </span>
                      </div>
=======
                      )}
>>>>>>> origin/feature1
                    </div>
                  </div>
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <div className="flex items-center">
                        <Filter className="w-3 h-3 mr-2" />
                        <SelectValue placeholder="Category" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon && <span className="mr-2">{cat.icon}</span>}
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-full md:w-[150px]">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Periods</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="w-full md:w-auto"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
                {hasActiveFilters && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Showing {filteredBudgets.length} of {budgets.length} budgets
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Cards */}
            <div className="space-y-4">
              {filteredBudgets.length === 0 ? (
                <Card className="card-financial">
                  <CardContent className="py-12 text-center">
                    {budgets.length === 0 ? (
                      <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Target className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1">
                            No budgets yet
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            Create your first budget to start tracking your
                            spending
                          </p>
                          <Button onClick={handleCreateClick}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Budget
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1">
                            No budgets match your filters
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            Try adjusting your search or filters
                          </p>
                          <Button variant="outline" onClick={clearFilters}>
                            <X className="w-4 h-4 mr-2" />
                            Clear Filters
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredBudgets.map((budget) => {
                  const status = getBudgetStatus(budget);
                  const percentage =
                    budget.totalAmount > 0
                      ? (budget.spent / budget.totalAmount) * 100
                      : 0;

                  return (
                    <Card key={budget.id} className="card-financial">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">
                              {budget.name}
                            </CardTitle>
                            <CardDescription className="flex flex-wrap items-center gap-3">
                              <Badge variant="secondary" className="capitalize">
                                {budget.period}
                              </Badge>
                              <span className="flex items-center text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                Until{" "}
                                {new Date(budget.endDate).toLocaleDateString()}
                              </span>
                              {budget.participants.length > 0 && (
                                <span className="flex items-center text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {budget.participants.length} participant
                                  {budget.participants.length !== 1 ? "s" : ""}
                                </span>
                              )}
                            </CardDescription>
                          </div>

                          <div className="flex items-center space-x-2">
                            {status === "warning" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="w-5 h-5 text-warning cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Warning: You've used {percentage.toFixed(1)}
                                    % of your budget
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {status === "over" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="w-5 h-5 text-destructive cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Over Budget: You've exceeded your budget by
                                    $
                                    {(
                                      budget.spent - budget.totalAmount
                                    ).toLocaleString()}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <InviteDialog
                              budgetId={budget.id}
                              budgetName={budget.name}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-primary"
                                >
                                  <Users className="w-4 h-4 mr-2" />
                                  Invite
                                </Button>
                              }
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditClick(budget)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit budget</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteClick(budget.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete budget</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            ${budget.spent.toLocaleString()} spent
                          </span>
                          <span
                            className={cn(
                              "font-medium",
                              getBudgetColor(status)
                            )}
                          >
                            ${budget.remaining.toLocaleString()} remaining
                          </span>
                        </div>

                        <Progress
                          value={Math.min(percentage, 100)}
                          className={cn(
                            "h-3",
                            status === "over"
                              ? "[&>div]:bg-destructive"
                              : status === "warning"
                              ? "[&>div]:bg-warning"
                              : "[&>div]:bg-success"
                          )}
                        />

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {percentage.toFixed(1)}% used
                          </span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{budget.category}</Badge>
                            <span className="text-lg font-semibold">
                              ${budget.totalAmount.toLocaleString()}
                            </span>
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
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="card-financial">
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <PieChart className="w-4 h-4 mr-2" />
                  Budget Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-success">On Track</span>
                    <span className="font-medium">{budgetHealth.onTrack}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-warning">Warning</span>
                    <span className="font-medium">{budgetHealth.warning}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-destructive">Over Budget</span>
                    <span className="font-medium">{budgetHealth.over}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            {categoryBreakdown.length > 0 && (
              <Card className="card-financial">
                <CardHeader>
                  <CardTitle className="text-sm">Top Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryBreakdown.map((category, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          index === 0
                            ? "bg-primary"
                            : index === 1
                            ? "bg-success"
                            : "bg-warning"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {category.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${category.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Budget Dialog */}
        <BudgetDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          budget={editingBudget}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                budget and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};
