import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  CreditCard,
  PiggyBank,
  AlertTriangle,
  Plus,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { BudgetOverview } from "@/components/dashboard/BudgetOverview";
import { SavingsGoals } from "@/components/dashboard/SavingsGoals";
import { userAPI, budgetAPI, expenseAPI, savingsAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    document.title = "Dashboard - SpendSense";
  }, []);

  // Fetch dashboard data
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => userAPI.getProfile().then((res) => res.data),
  });

  const { data: budgets } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetAPI.getBudgets().then((res) => res.data),
  });

  const { data: expenses } = useQuery({
    queryKey: ["expenses", "recent"],
    queryFn: () => expenseAPI.getExpenses().then((res) => res.data),
  });

  const { data: savingsGoals } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: () => savingsAPI.getGoals().then((res) => res.data),
  });

  // Calculate summary stats
  const totalBudget =
    budgets?.reduce(
      (sum: number, budget: any) =>
        sum + parseFloat(budget.total_amount || "0"),
      0
    ) || 0;
  const totalSpent =
    budgets?.reduce(
      (sum: number, budget: any) =>
        sum + parseFloat(budget.spent_amount || "0"),
      0
    ) || 0;
  const remainingBudget = totalBudget - totalSpent;
  const spendingProgress =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your financial overview for this month
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Budget */}
        <Card className="card-financial">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalBudget.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {budgets?.length || 0} budgets
            </p>
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card className="card-financial">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalSpent.toFixed(0)}
            </div>
            <Progress value={spendingProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {spendingProgress.toFixed(1)}% of budget used
            </p>
          </CardContent>
        </Card>

        {/* Remaining Budget */}
        <Card className="card-financial">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            {remainingBudget >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                remainingBudget >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              ${Math.abs(remainingBudget).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {remainingBudget >= 0 ? "Under budget" : "Over budget"}
            </p>
          </CardContent>
        </Card>

        {/* Savings Goals */}
        <Card className="card-financial">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Goals</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {savingsGoals?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active goals</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {spendingProgress > 80 && (
        <Card className="border-warning bg-warning-light/50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium text-warning-foreground">
                High Spending Alert
              </p>
              <p className="text-sm text-warning-foreground/80">
                You've used {spendingProgress.toFixed(1)}% of your monthly
                budget. Consider reviewing your expenses.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Chart */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>Monthly Spending</CardTitle>
            <CardDescription>
              Your spending trend over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SpendingChart expenses={expenses} budgets={budgets} />
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions expenses={expenses?.slice(0, 5)} />
          </CardContent>
        </Card>
      </div>

      {/* Savings Goals and Budget Overview - Interchanged positions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings Goals - Now in first position */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>Savings Goals</CardTitle>
            <CardDescription>
              Track your progress toward your goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SavingsGoals goals={savingsGoals} />
          </CardContent>
        </Card>

        {/* Budget Overview - Now in second position */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Current month budget breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetOverview budgets={budgets} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
