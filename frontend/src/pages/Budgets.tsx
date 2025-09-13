import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { InviteDialog } from "@/components/collaboration/InviteDialog";
import { budgetAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

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
}

// Mock data
const mockBudgets: Budget[] = [
  {
    id: "1",
    name: "Monthly Groceries",
    totalAmount: 800,
    spent: 650,
    remaining: 150,
    period: "monthly",
    category: "Food & Dining",
    participants: ["you", "spouse"],
    createdAt: "2024-01-01",
    endDate: "2024-01-31",
  },
  {
    id: "2",
    name: "Vacation Fund",
    totalAmount: 3000,
    spent: 1200,
    remaining: 1800,
    period: "yearly",
    category: "Travel",
    participants: ["you"],
    createdAt: "2024-01-01",
    endDate: "2024-12-31",
  },
  {
    id: "3",
    name: "Weekly Entertainment",
    totalAmount: 200,
    spent: 180,
    remaining: 20,
    period: "weekly",
    category: "Entertainment",
    participants: ["you", "roommate"],
    createdAt: "2024-01-01",
    endDate: "2024-01-07",
  },
];

export const Budgets: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");

  // Mock query - replace with real API call
  const { data: budgets = mockBudgets } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetAPI.getBudgets().then((res) => res.data),
  });

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

  const totalBudgetAmount = budgets.reduce(
    (sum, budget) => sum + budget.totalAmount,
    0
  );
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = budgets.reduce(
    (sum, budget) => sum + budget.remaining,
    0
  );

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.totalAmount) * 100;
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
        <Button className="btn-primary w-fit">
          <Plus className="w-4 h-4 mr-2" />
          Create Budget
        </Button>
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
              ${totalBudgetAmount.toLocaleString()}
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
            <div className="text-2xl font-bold text-warning">
              ${totalSpent.toLocaleString()}
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
              ${totalRemaining.toLocaleString()}
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
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
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
              const status = getBudgetStatus(budget);
              const percentage = (budget.spent / budget.totalAmount) * 100;

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
                            Until{" "}
                            {new Date(budget.endDate).toLocaleDateString()}
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
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        ${budget.spent.toLocaleString()} spent
                      </span>
                      <span
                        className={cn("font-medium", getBudgetColor(status))}
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
            })}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* AI Assistant */}
          <AIAssistant compact context="budgets" />

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
                      ${category.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant context="budgets" />
    </div>
  );
};
