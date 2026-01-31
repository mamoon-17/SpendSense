import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { expenseAPI, categoriesAPI, budgetAPI, savingsAPI } from "@/lib/api";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Wallet, PiggyBank, Info, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: {
    id: string;
    description: string;
    amount: string;
    category_id: string;
    date: string;
    payment_method?: string;
    notes?: string;
    location?: string;
    linkedBudgetIds?: string[];
    linkedSavingsGoalIds?: string[];
  };
  onSuccess?: () => void;
}

export const ExpenseDialog: React.FC<ExpenseDialogProps> = ({
  open,
  onOpenChange,
  expense,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getCurrencySymbol, settings } = useUserSettings();
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category_id: "",
    date: new Date().toISOString().split("T")[0],
    payment_method: "",
    notes: "",
    location: "",
  });

  // Selected budgets and savings goals to ADD (new links only)
  const [selectedBudgetIds, setSelectedBudgetIds] = useState<string[]>([]);
  const [selectedSavingsGoalIds, setSelectedSavingsGoalIds] = useState<
    string[]
  >([]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesAPI.getCategories();
      return response.data;
    },
    enabled: open,
  });

  // Fetch budgets for linking
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const response = await budgetAPI.getBudgets();
      return response.data;
    },
    enabled: open,
  });

  // Fetch savings goals for linking
  const { data: savingsGoals = [] } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: async () => {
      const response = await savingsAPI.getGoals();
      return response.data;
    },
    enabled: open,
  });

  // Initialize form data when dialog opens or expense changes
  useEffect(() => {
    if (open) {
      if (expense) {
        setFormData({
          description: expense.description,
          amount: expense.amount,
          category_id: expense.category_id,
          date: expense.date.split("T")[0],
          payment_method: expense.payment_method || "",
          notes: expense.notes || "",
          location: expense.location || "",
        });
        // Reset selections - don't pre-select already linked ones
        setSelectedBudgetIds([]);
        setSelectedSavingsGoalIds([]);
      } else {
        // Reset form for new expense
        const today = new Date().toISOString().split("T")[0];
        setFormData({
          description: "",
          amount: "",
          category_id: "",
          date: today,
          payment_method: "",
          notes: "",
          location: "",
        });
        setSelectedBudgetIds([]);
        setSelectedSavingsGoalIds([]);
      }
    }
  }, [open, expense]);

  // Get already linked IDs (for existing expense)
  const alreadyLinkedBudgetIds = expense?.linkedBudgetIds || [];
  const alreadyLinkedSavingsGoalIds = expense?.linkedSavingsGoalIds || [];

  // Filter out already linked budgets/savings goals from available options
  const availableBudgets = budgets.filter(
    (b: any) => !alreadyLinkedBudgetIds.includes(b.id),
  );
  const availableSavingsGoals = savingsGoals.filter(
    (g: any) => !alreadyLinkedSavingsGoalIds.includes(g.id),
  );

  const handleBudgetToggle = (budgetId: string) => {
    setSelectedBudgetIds((prev) =>
      prev.includes(budgetId)
        ? prev.filter((id) => id !== budgetId)
        : [...prev, budgetId],
    );
  };

  const handleSavingsGoalToggle = (goalId: string) => {
    setSelectedSavingsGoalIds((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.description ||
      !formData.amount ||
      !formData.category_id ||
      !formData.date
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate date is not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const expenseDate = new Date(formData.date);
    if (expenseDate > today) {
      toast({
        title: "Validation Error",
        description:
          "Expense date cannot be in the future. Please select today or a past date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id,
        date: new Date(formData.date).toISOString(),
        payment_method: formData.payment_method || undefined,
        notes: formData.notes || undefined,
        location: formData.location || undefined,
        currency: settings.currency,
        // Arrays of budget/savings goal IDs to link
        budget_ids:
          selectedBudgetIds.length > 0 ? selectedBudgetIds : undefined,
        savings_goal_ids:
          selectedSavingsGoalIds.length > 0
            ? selectedSavingsGoalIds
            : undefined,
      };

      if (expense) {
        await expenseAPI.updateExpense(expense.id, payload);
        toast({
          title: "Success",
          description: "Expense updated successfully.",
        });
      } else {
        await expenseAPI.createExpense(payload);
        toast({
          title: "Success",
          description: "Expense created successfully.",
        });
      }

      // Invalidate related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save expense.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription>
            {expense
              ? "Update your expense details below."
              : "Record a new expense to track your spending."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g., Grocery shopping at Whole Foods"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount ({getCurrencySymbol()}){" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 font-semibold text-lg"
                  onClick={() => {
                    const current = parseFloat(formData.amount) || 0;
                    const newValue = Math.max(0, current - 10);
                    setFormData({ ...formData, amount: newValue.toString() });
                  }}
                >
                  −
                </Button>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0.00"
                  className="text-center"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 font-semibold text-lg"
                  onClick={() => {
                    const current = parseFloat(formData.amount) || 0;
                    const newValue = current + 10;
                    setFormData({ ...formData, amount: newValue.toString() });
                  }}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="e.g., Whole Foods Market"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes about this expense..."
              rows={3}
            />
          </div>

          {/* Budget & Savings Goal Linking Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">
                Link to Budgets or Savings Goals
              </h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Link this expense to one or more budgets/savings goals.
                      Once linked, they cannot be linked again to the same
                      expense.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Already Linked Budgets (for editing) */}
            {alreadyLinkedBudgetIds.length > 0 && (
              <div className="space-y-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  <Label className="text-sm font-medium">
                    Already Linked Budgets
                  </Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {alreadyLinkedBudgetIds.map((id) => {
                    const budget = budgets.find((b: any) => b.id === id);
                    return budget ? (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="bg-blue-500/20"
                      >
                        {budget.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Add New Budgets */}
            <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-500" />
                <Label className="text-sm font-medium">
                  {expense ? "Add More Budgets" : "Link to Budgets"}
                </Label>
              </div>

              {availableBudgets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {alreadyLinkedBudgetIds.length > 0
                    ? "All budgets are already linked to this expense."
                    : "No budgets available."}
                </p>
              ) : (
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {availableBudgets.map((budget: any) => (
                    <div
                      key={budget.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-secondary/50"
                    >
                      <Checkbox
                        id={`budget-${budget.id}`}
                        checked={selectedBudgetIds.includes(budget.id)}
                        onCheckedChange={() => handleBudgetToggle(budget.id)}
                      />
                      <label
                        htmlFor={`budget-${budget.id}`}
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {budget.name}{" "}
                        <span className="text-muted-foreground">
                          ({parseFloat(budget.spent_amount || 0).toFixed(2)} /{" "}
                          {parseFloat(budget.total_amount).toFixed(2)})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {selectedBudgetIds.length > 0 && (
                <p className="text-xs text-blue-600">
                  ✓ {selectedBudgetIds.length} budget(s) will have this expense
                  added to their spending.
                </p>
              )}
            </div>

            {/* Already Linked Savings Goals (for editing) */}
            {alreadyLinkedSavingsGoalIds.length > 0 && (
              <div className="space-y-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-green-500" />
                  <Label className="text-sm font-medium">
                    Already Linked Savings Goals
                  </Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {alreadyLinkedSavingsGoalIds.map((id) => {
                    const goal = savingsGoals.find((g: any) => g.id === id);
                    return goal ? (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="bg-green-500/20"
                      >
                        {goal.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Add New Savings Goals */}
            <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-green-500" />
                <Label className="text-sm font-medium">
                  {expense ? "Add More Savings Goals" : "Link to Savings Goals"}
                </Label>
              </div>

              {availableSavingsGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {alreadyLinkedSavingsGoalIds.length > 0
                    ? "All savings goals are already linked to this expense."
                    : "No savings goals available."}
                </p>
              ) : (
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {availableSavingsGoals.map((goal: any) => (
                    <div
                      key={goal.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-secondary/50"
                    >
                      <Checkbox
                        id={`goal-${goal.id}`}
                        checked={selectedSavingsGoalIds.includes(goal.id)}
                        onCheckedChange={() => handleSavingsGoalToggle(goal.id)}
                      />
                      <label
                        htmlFor={`goal-${goal.id}`}
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {goal.name}{" "}
                        <span className="text-muted-foreground">
                          ({parseFloat(goal.current_amount || 0).toFixed(2)} /{" "}
                          {parseFloat(goal.target_amount).toFixed(2)})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {selectedSavingsGoalIds.length > 0 && (
                <p className="text-xs text-amber-600">
                  ⚠️ {selectedSavingsGoalIds.length} savings goal(s) will have
                  this expense deducted from their balance.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : expense
                  ? "Update Expense"
                  : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
