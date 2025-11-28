import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Filter,
  Search,
  Edit,
  Trash2,
  Receipt,
  Calendar,
  Tag,
  TrendingUp,
  TrendingDown,
  X,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Upload,
  Download,
  FileUp,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { expenseAPI, categoriesAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { useUserSettings } from "@/hooks/useUserSettings";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Backend Expense interface
interface BackendExpense {
  id: string;
  description: string;
  amount: string;
  category_id: string;
  date: string;
  payment_method?: string;
  notes?: string;
  tags?: string[] | null;
  location?: string;
  ai_categorized?: boolean;
  budget_id?: string;
  user_id: string;
  currency?: string;
}

// Frontend Expense interface
interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  categoryId: string;
  date: string;
  payment_method?: string;
  notes?: string;
  tags: string[];
  location?: string;
  currency: string;
}

// Helper function to transform backend expense to frontend format
const transformExpense = (
  backendExpense: BackendExpense,
  categories: any[]
): Expense => {
  const category = categories.find(
    (cat) => cat.id === backendExpense.category_id
  );

  return {
    id: backendExpense.id,
    description: backendExpense.description,
    amount: parseFloat(backendExpense.amount) || 0,
    category: category?.name || "Uncategorized",
    categoryId: backendExpense.category_id,
    date: backendExpense.date,
    payment_method: backendExpense.payment_method,
    notes: backendExpense.notes,
    tags: backendExpense.tags || [],
    location: backendExpense.location,
    currency: backendExpense.currency || "USD",
  };
};

export const Expenses: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency, convertAmount, formatAmount, formatDate, settings } =
    useUserSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<
    BackendExpense | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Expenses - SpendSense";
  }, []);

  // Fetch expenses
  const { data: expensesData = [], isLoading } = useQuery({
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
    staleTime: 300000, // Cache for 5 minutes (categories rarely change)
    refetchOnWindowFocus: false,
  });

  // Transform expenses to frontend format
  const expenses: Expense[] = useMemo(() => {
    if (!Array.isArray(expensesData)) return [];
    return expensesData.map((exp: BackendExpense) =>
      transformExpense(exp, categories)
    );
  }, [expensesData, categories]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseAPI.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({
        title: "Success",
        description: "Expense deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete expense.",
        variant: "destructive",
      });
    },
  });

  const handleCreateClick = () => {
    setEditingExpense(undefined);
    setDialogOpen(true);
  };

  const handleEditClick = (expense: Expense) => {
    // Find the original backend expense
    const backendExpense = expensesData.find(
      (e: BackendExpense) => e.id === expense.id
    );
    setEditingExpense(backendExpense);
    setDialogOpen(true);
  };

  const handleDeleteClick = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (expenseToDelete) {
      deleteMutation.mutate(expenseToDelete);
    }
  };

  // Export expenses to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    doc.setFillColor(15, 23, 42); // Dark background
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Expense Report", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on ${format(new Date(), "MMMM dd, yyyy")}`,
      pageWidth / 2,
      30,
      { align: "center" }
    );

    // Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, 55);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const summaryY = 65;
    doc.text(
      `Period: ${
        filterPeriod === "month"
          ? "This Month"
          : filterPeriod === "week"
          ? "This Week"
          : filterPeriod === "year"
          ? "This Year"
          : "All Time"
      }`,
      14,
      summaryY
    );
    doc.text(
      `Total Expenses: ${formatAmount(totalExpenses)}`,
      14,
      summaryY + 7
    );
    doc.text(
      `Total Transactions: ${filteredExpenses.length}`,
      14,
      summaryY + 14
    );
    doc.text(
      `Average per Transaction: ${formatAmount(avgExpense)}`,
      14,
      summaryY + 21
    );
    if (topCategory) {
      doc.text(
        `Top Category: ${topCategory[0]} (${formatAmount(
          topCategory[1] as number
        )})`,
        14,
        summaryY + 28
      );
    }

    // Expenses Table
    const tableData = sortedExpenses.map((expense) => [
      formatDate(expense.date),
      expense.description,
      expense.category,
      expense.payment_method || "N/A",
      formatCurrency(expense.amount, expense.currency || "USD"),
    ]);

    autoTable(doc, {
      startY: summaryY + 40,
      head: [["Date", "Description", "Category", "Payment Method", "Amount"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 60 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25, halign: "right" },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });
      },
    });

    // Save the PDF
    doc.save(`expense-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);

    toast({
      title: "Success",
      description: "Expense report exported successfully.",
    });
  };

  // Check if filters are active
  const hasActiveFilters =
    searchTerm !== "" || filterCategory !== "all" || filterPeriod !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterPeriod("month");
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      (expense.location &&
        expense.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      filterCategory === "all" || expense.categoryId === filterCategory;

    // Filter by period
    const expenseDate = new Date(expense.date);
    const now = new Date();
    let matchesPeriod = true;

    switch (filterPeriod) {
      case "week":
        matchesPeriod = expenseDate >= subDays(now, 7);
        break;
      case "month":
        matchesPeriod =
          expenseDate >= startOfMonth(now) && expenseDate <= endOfMonth(now);
        break;
      case "year":
        matchesPeriod = expenseDate.getFullYear() === now.getFullYear();
        break;
    }

    return matchesSearch && matchesCategory && matchesPeriod;
  });

  // Sort expenses
  const sortedExpenses = useMemo(() => {
    const sorted = [...filteredExpenses];
    switch (sortBy) {
      case "amount":
        return sorted.sort((a, b) => b.amount - a.amount);
      case "category":
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      case "date":
      default:
        return sorted.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }
  }, [filteredExpenses, sortBy]);

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) =>
      sum + convertAmount(expense.amount, expense.currency || "USD"),
    0
  );
  const avgExpense =
    filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;

  const categoryTotals = filteredExpenses.reduce((acc, expense) => {
    const convertedAmount = convertAmount(
      expense.amount,
      expense.currency || "USD"
    );
    acc[expense.category] = (acc[expense.category] || 0) + convertedAmount;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryTotals).sort(
    ([, a], [, b]) => b - a
  )[0];

  // Analytics calculations
  const analytics = useMemo(() => {
    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date = now;
    let previousStart: Date;
    let previousEnd: Date;

    // Determine date ranges based on filter period
    switch (filterPeriod) {
      case "week":
        currentStart = subDays(now, 7);
        previousStart = subDays(now, 14);
        previousEnd = subDays(now, 7);
        break;
      case "month":
        currentStart = startOfMonth(now);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "year":
        currentStart = new Date(now.getFullYear(), 0, 1);
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        currentStart = startOfMonth(now);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    // Calculate current period total
    const currentPeriodTotal = expenses
      .filter((e) => {
        const date = new Date(e.date);
        return date >= currentStart && date <= currentEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    // Calculate previous period total
    const previousPeriodTotal = expenses
      .filter((e) => {
        const date = new Date(e.date);
        return date >= previousStart && date <= previousEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    // Calculate percentage change
    const change =
      previousPeriodTotal > 0
        ? ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) *
          100
        : 0;

    // Category breakdown with percentages
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([category, amount]) => {
        const count = filteredExpenses.filter(
          (e) => e.category === category
        ).length;
        return {
          category,
          amount: amount as number,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          count,
          average: count > 0 ? (amount as number) / count : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Top spending days
    const dailyTotals = expenses.reduce((acc, expense) => {
      const dateKey = format(new Date(expense.date), "yyyy-MM-dd");
      acc[dateKey] = (acc[dateKey] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const topDays = Object.entries(dailyTotals)
      .map(([date, amount]) => ({
        date,
        amount,
        formattedDate: format(new Date(date), "MMM dd, yyyy"),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      currentPeriodTotal,
      previousPeriodTotal,
      change,
      categoryBreakdown,
      topDays,
    };
  }, [expenses, filteredExpenses, categoryTotals, totalExpenses, filterPeriod]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading expenses...</div>
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
              Expense Tracking
            </h1>
            <p className="text-muted-foreground mt-1">
              Track, categorize, and analyze your spending
            </p>
          </div>
          <Button className="btn-primary" onClick={handleCreateClick}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-financial">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Spent
                  </p>
                  <p className="text-2xl font-bold">
                    {formatAmount(totalExpenses)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">This Month</p>
            </CardContent>
          </Card>

          <Card className="card-financial">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Average
                  </p>
                  <p className="text-2xl font-bold">
                    {formatAmount(avgExpense)}
                  </p>
                </div>
                <Receipt className="w-8 h-8 text-success" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">This Month</p>
            </CardContent>
          </Card>

          <Card className="card-financial">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Transactions
                  </p>
                  <p className="text-2xl font-bold">
                    {filteredExpenses.length}
                  </p>
                </div>
                <Tag className="w-8 h-8 text-warning" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">This Month</p>
            </CardContent>
          </Card>

          <Card className="card-financial">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Top Category
                  </p>
                  <p className="text-lg font-bold truncate">
                    {topCategory?.[0] || "N/A"}
                  </p>
                </div>
                <Filter className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {formatAmount((topCategory?.[1] as number) || 0)} spent
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs defaultValue="list" className="w-full">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <TabsList className="grid w-full sm:w-fit grid-cols-3">
                  <TabsTrigger value="list">List View</TabsTrigger>
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Card className="card-financial">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search expenses, tags, or locations..."
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
                        )}
                      </div>
                    </div>
                    <Select
                      value={filterCategory}
                      onValueChange={setFilterCategory}
                    >
                      <SelectTrigger className="w-full lg:w-[180px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon && (
                              <span className="mr-2">{cat.icon}</span>
                            )}
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filterPeriod}
                      onValueChange={setFilterPeriod}
                    >
                      <SelectTrigger className="w-full lg:w-[150px]">
                        <SelectValue placeholder="Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full lg:w-[120px]">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                      </SelectContent>
                    </Select>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="w-full lg:w-auto"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>
                  {hasActiveFilters && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      Showing {filteredExpenses.length} of {expenses.length}{" "}
                      expenses
                    </div>
                  )}
                </CardContent>
              </Card>

              <TabsContent value="list" className="space-y-4 mt-6">
                {sortedExpenses.length === 0 ? (
                  <Card className="card-financial">
                    <CardContent className="py-12 text-center">
                      {expenses.length === 0 ? (
                        <div className="space-y-4">
                          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <Receipt className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-1">
                              No expenses yet
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              Start tracking your spending by adding your first
                              expense
                            </p>
                            <Button onClick={handleCreateClick}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Your First Expense
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
                              No expenses match your filters
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
                  sortedExpenses.map((expense) => (
                    <Card
                      key={expense.id}
                      className="card-financial hover:shadow-elevated transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-foreground truncate">
                                {expense.description}
                              </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(expense.date)}
                              </span>
                              <Badge variant="outline">
                                {expense.category}
                              </Badge>
                              {expense.location && (
                                <span className="truncate">
                                  {expense.location}
                                </span>
                              )}
                              {expense.payment_method && (
                                <span className="text-xs">
                                  {expense.payment_method
                                    .split("_")
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1)
                                    )
                                    .join(" ")}
                                </span>
                              )}
                            </div>

                            {expense.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {expense.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {expense.notes && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                <p className="italic">{expense.notes}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-3 ml-4">
                            <div className="text-right">
                              <p className="text-lg font-bold text-foreground">
                                {formatCurrency(
                                  expense.amount,
                                  expense.currency || "USD"
                                )}
                              </p>
                            </div>

                            <div className="flex items-center space-x-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditClick(expense)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit expense</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() =>
                                      handleDeleteClick(expense.id)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete expense</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="categories" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(categoryTotals).map(([category, amount]) => (
                    <Card key={category} className="card-financial">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold">{category}</h3>
                          <p className="text-lg font-bold">
                            {formatAmount(amount as number)}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {
                            filteredExpenses.filter(
                              (e) => e.category === category
                            ).length
                          }{" "}
                          transactions
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-6 space-y-6">
                {/* Spending Trend */}
                <Card className="card-financial">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Spending Trend
                    </CardTitle>
                    <CardDescription>
                      Compare current period with previous period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            Current Period
                          </span>
                          {analytics.change > 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-destructive" />
                          ) : analytics.change < 0 ? (
                            <ArrowDownRight className="w-4 h-4 text-success" />
                          ) : null}
                        </div>
                        <p className="text-2xl font-bold">
                          {formatAmount(analytics.currentPeriodTotal)}
                        </p>
                        {analytics.previousPeriodTotal > 0 && (
                          <p
                            className={`text-sm mt-1 ${
                              analytics.change > 0
                                ? "text-destructive"
                                : analytics.change < 0
                                ? "text-success"
                                : "text-muted-foreground"
                            }`}
                          >
                            {analytics.change > 0 ? "+" : ""}
                            {analytics.change.toFixed(1)}% vs previous period
                          </p>
                        )}
                      </div>
                      <div className="p-4 border border-border rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Previous Period
                        </span>
                        <p className="text-2xl font-bold mt-2">
                          {formatAmount(analytics.previousPeriodTotal)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card className="card-financial">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Category Breakdown
                    </CardTitle>
                    <CardDescription>
                      Spending distribution across categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.categoryBreakdown.map((cat) => (
                        <div key={cat.category}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{cat.category}</span>
                            <div className="text-right">
                              <span className="font-bold">
                                {formatAmount(cat.amount)}
                              </span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({cat.percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{cat.count} transactions</span>
                            <span>Avg: {formatAmount(cat.average)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Spending Days */}
                {analytics.topDays.length > 0 && (
                  <Card className="card-financial">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Top Spending Days
                      </CardTitle>
                      <CardDescription>
                        Your highest spending days
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.topDays.map((day, index) => (
                          <div
                            key={day.date}
                            className="flex items-center justify-between p-3 border border-border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">
                                  {day.formattedDate}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {
                                    expenses.filter(
                                      (e) =>
                                        format(
                                          new Date(e.date),
                                          "yyyy-MM-dd"
                                        ) === day.date
                                    ).length
                                  }{" "}
                                  transactions
                                </p>
                              </div>
                            </div>
                            <p className="text-lg font-bold">
                              {formatAmount(day.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="card-financial">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Total Transactions
                      </p>
                      <p className="text-2xl font-bold">
                        {filteredExpenses.length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This {filterPeriod}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="card-financial">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Average Transaction
                      </p>
                      <p className="text-2xl font-bold">
                        {formatAmount(avgExpense)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Per expense
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="card-financial">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Categories Used
                      </p>
                      <p className="text-2xl font-bold">
                        {Object.keys(categoryTotals).length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Active categories
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

        </div>

        {/* Expense Dialog */}
        <ExpenseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          expense={editingExpense}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                expense.
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
