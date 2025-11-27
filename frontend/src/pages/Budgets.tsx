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
  Filter,
  Search,
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

export const Budgets: React.FC = () => {
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["budgets"] });
              refetch();
            }}
            title="Refresh budget data"
          >
            ⟳ Refresh
          </Button>
          <Button
            className="btn-primary w-fit"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Budget
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-financial">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(totalBudgetAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {budgets.length} active budgets
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatAmount(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((totalSpent / totalBudgetAmount) * 100).toFixed(1)}% of total
              budget
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatAmount(totalRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">Available to spend</p>
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
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Category" />
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
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Periods</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Budget Cards */}
          <div className="space-y-4">
            {filteredBudgets.map((budget) => {
              const spent = budget.spent ?? 0;
              const totalAmount = budget.totalAmount ?? 0;
              const remaining = budget.remaining ?? 0;
              const status = getBudgetStatus(budget);
              const percentage =
                totalAmount > 0 ? (spent / totalAmount) * 100 : 0;

              return (
                <Card key={budget.id} className="card-financial">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{budget.name}</CardTitle>
                        <CardDescription className="flex items-center space-x-4">
                          <Badge variant="secondary" className="capitalize">
                            {budget.period}
                          </Badge>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Until {formatDate(new Date(budget.endDate))}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {budget.participants.length} participant
                            {budget.participants.length > 1 ? "s" : ""}
                          </span>
                        </CardDescription>
                      </div>

                      <div className="flex items-center space-x-2">
                        {status === "warning" && (
                          <AlertCircle className="w-5 h-5 text-warning" />
                        )}
                        {status === "over" && (
                          <AlertCircle className="w-5 h-5 text-destructive" />
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingBudget(budget);
                            setIsCreateDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            handleDeleteBudget(budget.id, budget.name)
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {formatCurrency(spent, budget.currency || "USD")} spent
                      </span>
                      <span
                        className={cn("font-medium", getBudgetColor(status))}
                      >
                        {formatCurrency(remaining, budget.currency || "USD")}{" "}
                        remaining
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
                        <Badge variant="outline">
                          {typeof budget.category === "string"
                            ? budget.category
                            : budget.category?.name ?? "Uncategorized"}
                        </Badge>
                        <span className="text-2xl font-bold">
                          {formatCurrency(
                            totalAmount,
                            budget.currency || "USD"
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
                  <span className="font-medium">2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-warning">Warning</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-destructive">Over Budget</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm">Top Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Food & Dining", amount: 800, color: "bg-primary" },
                { name: "Travel", amount: 3000, color: "bg-success" },
                { name: "Entertainment", amount: 200, color: "bg-warning" },
              ].map((category, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={cn("w-3 h-3 rounded-full", category.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {category.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatAmount(category.amount)}
                    </p>
                  </div>
                </div>
              ))}
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
  );
};
