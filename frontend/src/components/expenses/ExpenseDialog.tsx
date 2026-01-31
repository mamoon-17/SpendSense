import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Wallet,
  PiggyBank,
  Info,
  X,
  Minus,
  Split,
  DollarSign,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Distribution types
type DistributionType = "none" | "manual" | "equal_split" | "half";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: {
    id: string;
    description: string;
    amount: string;
    category_id: string | null;
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
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
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

  // Distribution type states
  const [budgetDistribution, setBudgetDistribution] =
    useState<DistributionType>("none");
  const [savingsGoalDistribution, setSavingsGoalDistribution] =
    useState<DistributionType>("none");

  // Selected budgets and savings goals with custom amounts for manual distribution
  const [selectedBudgets, setSelectedBudgets] = useState<
    { id: string; amount: string }[]
  >([]);
  const [selectedSavingsGoals, setSelectedSavingsGoals] = useState<
    { id: string; amount: string }[]
  >([]);

  // Track linked budgets/savings goals that can be unlinked
  const [linkedBudgetIds, setLinkedBudgetIds] = useState<string[]>([]);
  const [linkedSavingsGoalIds, setLinkedSavingsGoalIds] = useState<string[]>(
    [],
  );

  // Unlink confirmation dialog
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [itemToUnlink, setItemToUnlink] = useState<{
    type: "budget" | "savings_goal";
    id: string;
    name: string;
  } | null>(null);

  // Unlink mutation
  const unlinkMutation = useMutation({
    mutationFn: async ({
      budgetIds,
      savingsGoalIds,
    }: {
      budgetIds?: string[];
      savingsGoalIds?: string[];
    }) => {
      if (!expense) return;
      return expenseAPI.unlinkExpense(expense.id, {
        budget_ids: budgetIds,
        savings_goal_ids: savingsGoalIds,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully unlinked and restored the amount.",
      });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });

      // Update local state to reflect the unlink
      if (itemToUnlink) {
        if (itemToUnlink.type === "budget") {
          setLinkedBudgetIds((prev) =>
            prev.filter((id) => id !== itemToUnlink.id),
          );
        } else {
          setLinkedSavingsGoalIds((prev) =>
            prev.filter((id) => id !== itemToUnlink.id),
          );
        }
      }
      setItemToUnlink(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to unlink expense.",
        variant: "destructive",
      });
    },
  });

  // Fetch categories (all categories for expenses)
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
      setShowCustomInput(false);
      setCustomCategoryName("");
      setCategoryToDelete(null);
      setBudgetDistribution("none");
      setSavingsGoalDistribution("none");
      setSelectedBudgets([]);
      setSelectedSavingsGoals([]);

      if (expense) {
        setFormData({
          description: expense.description,
          amount: expense.amount,
          category_id: expense.category_id || "",
          date: expense.date.split("T")[0],
          payment_method: expense.payment_method || "",
          notes: expense.notes || "",
          location: expense.location || "",
        });
        // Initialize linked IDs for unlinking
        setLinkedBudgetIds(expense.linkedBudgetIds || []);
        setLinkedSavingsGoalIds(expense.linkedSavingsGoalIds || []);
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
        setLinkedBudgetIds([]);
        setLinkedSavingsGoalIds([]);
      }
    }
  }, [open, expense]);

  // Get currently linked IDs (use local state to reflect unlinks)
  const alreadyLinkedBudgetIds = linkedBudgetIds;
  const alreadyLinkedSavingsGoalIds = linkedSavingsGoalIds;

  // Get all available budgets (not already linked)
  const availableBudgets = useMemo(() => {
    return budgets.filter((b: any) => !alreadyLinkedBudgetIds.includes(b.id));
  }, [budgets, alreadyLinkedBudgetIds]);

  // Get all available savings goals (not already linked)
  const availableSavingsGoals = useMemo(() => {
    return savingsGoals.filter(
      (g: any) => !alreadyLinkedSavingsGoalIds.includes(g.id),
    );
  }, [savingsGoals, alreadyLinkedSavingsGoalIds]);

  // Calculate preview amounts based on distribution type
  const expenseAmount = parseFloat(formData.amount) || 0;

  // Calculate the amount each budget gets based on selection count and distribution type
  const getBudgetAmount = (budgetId: string) => {
    if (selectedBudgets.length === 0) return 0;

    // If only one budget selected, it gets the full expense amount
    if (selectedBudgets.length === 1) {
      return expenseAmount;
    }

    // Multiple budgets - use distribution type
    const selectedItem = selectedBudgets.find((item) => item.id === budgetId);
    switch (budgetDistribution) {
      case "manual":
        return parseFloat(selectedItem?.amount || "0") || 0;
      case "equal_split":
        // Each budget gets the full expense amount
        return expenseAmount;
      case "half":
        // Each budget gets half of the expense amount
        return expenseAmount / 2;
      default:
        return expenseAmount;
    }
  };

  // Calculate total budget distribution (informational - can exceed expense amount)
  const totalBudgetDistribution = useMemo(() => {
    if (selectedBudgets.length === 0) return 0;
    if (selectedBudgets.length === 1) return expenseAmount;

    if (budgetDistribution === "manual") {
      return selectedBudgets.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0,
      );
    } else if (budgetDistribution === "equal_split") {
      // Each gets full amount
      return expenseAmount * selectedBudgets.length;
    } else if (budgetDistribution === "half") {
      // Each gets half amount
      return (expenseAmount / 2) * selectedBudgets.length;
    }
    return 0;
  }, [selectedBudgets, budgetDistribution, expenseAmount]);

  const calculateBudgetAmounts = () => {
    if (selectedBudgets.length === 0) return [];

    return selectedBudgets.map((item) => {
      return { id: item.id, amount: getBudgetAmount(item.id).toFixed(2) };
    });
  };

  // Calculate the amount each savings goal gets based on selection count and distribution type
  const getSavingsGoalAmount = (goalId: string) => {
    if (selectedSavingsGoals.length === 0) return 0;

    // If only one goal selected, it gets the full expense amount
    if (selectedSavingsGoals.length === 1) {
      return expenseAmount;
    }

    // Multiple goals - use distribution type
    const selectedItem = selectedSavingsGoals.find(
      (item) => item.id === goalId,
    );
    switch (savingsGoalDistribution) {
      case "manual":
        return parseFloat(selectedItem?.amount || "0") || 0;
      case "equal_split":
        // Each goal gets the full expense amount
        return expenseAmount;
      case "half":
        // Each goal gets half of the expense amount
        return expenseAmount / 2;
      default:
        return expenseAmount;
    }
  };

  // Calculate total savings goal distribution (informational - can exceed expense amount)
  const totalSavingsGoalDistribution = useMemo(() => {
    if (selectedSavingsGoals.length === 0) return 0;
    if (selectedSavingsGoals.length === 1) return expenseAmount;

    if (savingsGoalDistribution === "manual") {
      return selectedSavingsGoals.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0,
      );
    } else if (savingsGoalDistribution === "equal_split") {
      // Each gets full amount
      return expenseAmount * selectedSavingsGoals.length;
    } else if (savingsGoalDistribution === "half") {
      // Each gets half amount
      return (expenseAmount / 2) * selectedSavingsGoals.length;
    }
    return 0;
  }, [selectedSavingsGoals, savingsGoalDistribution, expenseAmount]);

  const calculateSavingsGoalAmounts = () => {
    if (selectedSavingsGoals.length === 0) return [];

    return selectedSavingsGoals.map((item) => {
      return { id: item.id, amount: getSavingsGoalAmount(item.id).toFixed(2) };
    });
  };

  const handleUnlinkBudget = (budgetId: string, budgetName: string) => {
    setItemToUnlink({ type: "budget", id: budgetId, name: budgetName });
    setUnlinkConfirmOpen(true);
  };

  const handleUnlinkSavingsGoal = (goalId: string, goalName: string) => {
    setItemToUnlink({ type: "savings_goal", id: goalId, name: goalName });
    setUnlinkConfirmOpen(true);
  };

  const confirmUnlink = () => {
    if (!itemToUnlink) return;

    if (itemToUnlink.type === "budget") {
      unlinkMutation.mutate({ budgetIds: [itemToUnlink.id] });
    } else {
      unlinkMutation.mutate({ savingsGoalIds: [itemToUnlink.id] });
    }
    setUnlinkConfirmOpen(false);
  };

  const handleBudgetToggle = (budgetId: string, checked: boolean) => {
    if (checked) {
      const newSelected = [...selectedBudgets, { id: budgetId, amount: "" }];
      setSelectedBudgets(newSelected);
      // Reset distribution type to equal_split when going from 1 to multiple
      if (newSelected.length === 2) {
        setBudgetDistribution("equal_split");
      }
    } else {
      const newSelected = selectedBudgets.filter(
        (item) => item.id !== budgetId,
      );
      setSelectedBudgets(newSelected);
      // Reset distribution when going back to single selection
      if (newSelected.length <= 1) {
        setBudgetDistribution("none");
      }
    }
  };

  const handleBudgetAmountChange = (budgetId: string, amount: string) => {
    setSelectedBudgets((prev) =>
      prev.map((item) => (item.id === budgetId ? { ...item, amount } : item)),
    );
  };

  const handleSavingsGoalToggle = (goalId: string, checked: boolean) => {
    if (checked) {
      const newSelected = [...selectedSavingsGoals, { id: goalId, amount: "" }];
      setSelectedSavingsGoals(newSelected);
      // Reset distribution type to equal_split when going from 1 to multiple
      if (newSelected.length === 2) {
        setSavingsGoalDistribution("equal_split");
      }
    } else {
      const newSelected = selectedSavingsGoals.filter(
        (item) => item.id !== goalId,
      );
      setSelectedSavingsGoals(newSelected);
      // Reset distribution when going back to single selection
      if (newSelected.length <= 1) {
        setSavingsGoalDistribution("none");
      }
    }
  };

  const handleSavingsGoalAmountChange = (goalId: string, amount: string) => {
    setSelectedSavingsGoals((prev) =>
      prev.map((item) => (item.id === goalId ? { ...item, amount } : item)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if category is selected (allow "other" for custom category creation)
    if (!formData.category_id || formData.category_id === "none") {
      toast({
        title: "Validation Error",
        description: "Please select a category.",
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
      let categoryId = formData.category_id;

      // Validate manual distribution amounts
      if (selectedBudgets.length > 1 && budgetDistribution === "manual") {
        if (Math.abs(totalBudgetDistribution - expenseAmount) >= 0.01) {
          toast({
            title: "Validation Error",
            description: `Budget distribution total (${totalBudgetDistribution.toFixed(2)}) must equal expense amount (${expenseAmount.toFixed(2)}).`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      if (
        selectedSavingsGoals.length > 1 &&
        savingsGoalDistribution === "manual"
      ) {
        if (Math.abs(totalSavingsGoalDistribution - expenseAmount) >= 0.01) {
          toast({
            title: "Validation Error",
            description: `Savings goal distribution total (${totalSavingsGoalDistribution.toFixed(2)}) must equal expense amount (${expenseAmount.toFixed(2)}).`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // If "other" is selected, create a custom category first
      if (formData.category_id === "other" && customCategoryName.trim()) {
        const response = await categoriesAPI.createCustomCategory({
          name: customCategoryName.trim(),
          type: "budget", // Use budget type since expenses and budgets share categories
        });
        categoryId = response.data.id;
        // Invalidate categories cache to show the new category next time
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      } else if (
        formData.category_id === "other" &&
        !customCategoryName.trim()
      ) {
        toast({
          title: "Validation Error",
          description: "Please enter a custom category name.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const payload: any = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category_id:
          categoryId !== "none" && categoryId !== "other"
            ? categoryId
            : undefined,
        date: new Date(formData.date).toISOString(),
        payment_method: formData.payment_method || undefined,
        notes: formData.notes || undefined,
        location: formData.location || undefined,
        currency: settings.currency,
      };

      // Add budget links if any budgets are selected
      if (selectedBudgets.length > 0) {
        // For single budget, use full amount with "manual" distribution; for multiple, use the calculated amounts
        const budgetAmounts = calculateBudgetAmounts();
        payload.budget_distribution =
          selectedBudgets.length === 1 ? "manual" : budgetDistribution;
        payload.budget_links = budgetAmounts.map((item) => ({
          id: item.id,
          amount: parseFloat(item.amount),
        }));
      }

      // Add savings goal links if any are selected
      if (selectedSavingsGoals.length > 0) {
        // For single goal, use full amount with "manual" distribution; for multiple, use the calculated amounts
        const savingsAmounts = calculateSavingsGoalAmounts();
        payload.savings_goal_distribution =
          selectedSavingsGoals.length === 1
            ? "manual"
            : savingsGoalDistribution;
        payload.savings_goal_links = savingsAmounts.map((item) => ({
          id: item.id,
          amount: parseFloat(item.amount),
        }));
      }

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

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await categoriesAPI.deleteCategory(categoryToDelete.id);
      toast({
        title: "Success",
        description: `Category "${categoryToDelete.name}" deleted successfully.`,
      });
      // Reset selection if deleted category was selected
      if (formData.category_id === categoryToDelete.id) {
        setFormData({ ...formData, category_id: "" });
      }
      // Refresh categories
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete category.",
        variant: "destructive",
      });
    } finally {
      setCategoryToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {expense ? "Edit Expense" : "Add Expense"}
            </DialogTitle>
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
                  onValueChange={(value) => {
                    setFormData({ ...formData, category_id: value });
                    setShowCustomInput(value === "other");
                    if (value !== "other") {
                      setCustomCategoryName("");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((cat: any) => (
                      <div key={cat.id} className="flex items-center">
                        <SelectItem value={cat.id} className="flex-1">
                          {cat.name}
                          {cat.is_custom && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (Custom)
                            </span>
                          )}
                        </SelectItem>
                        {cat.is_custom && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 mr-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCategoryToDelete({
                                id: cat.id,
                                name: cat.name,
                              });
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <SelectItem value="other">Other (Create New)</SelectItem>
                  </SelectContent>
                </Select>
                {showCustomInput && (
                  <Input
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="Enter custom category name"
                    className="mt-2"
                  />
                )}
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
                    <SelectItem value="digital_wallet">
                      Digital Wallet
                    </SelectItem>
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
                        Only budgets and savings goals with matching categories
                        are shown. Choose how to distribute the expense amount.
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
                      Linked Budgets
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            Click the unlink button to remove the connection and
                            restore the budget's spent amount.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {alreadyLinkedBudgetIds.map((id) => {
                      const budget = budgets.find((b: any) => b.id === id);
                      return budget ? (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="bg-blue-500/20 flex items-center gap-1 pr-1"
                        >
                          {budget.name}
                          <button
                            type="button"
                            className="h-4 w-4 ml-1 flex items-center justify-center hover:bg-destructive/20 hover:text-destructive rounded-full text-muted-foreground"
                            onClick={() => handleUnlinkBudget(id, budget.name)}
                            disabled={unlinkMutation.isPending}
                            title="Unlink from budget"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Add New Budgets with Distribution Options */}
              <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  <Label className="text-sm font-medium">
                    {expense ? "Add More Budgets" : "Link to Budgets"}
                  </Label>
                  {availableBudgets.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {availableBudgets.length} available
                    </Badge>
                  )}
                </div>

                {availableBudgets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No budgets available to link.
                  </p>
                ) : (
                  <>
                    {/* Budget Selection Checkboxes */}
                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
                      {availableBudgets.map((budget: any) => {
                        const isSelected = selectedBudgets.some(
                          (item) => item.id === budget.id,
                        );
                        const selectedItem = selectedBudgets.find(
                          (item) => item.id === budget.id,
                        );
                        const calculatedAmount = getBudgetAmount(budget.id);

                        return (
                          <div
                            key={budget.id}
                            className={`p-2 rounded border ${isSelected ? "border-blue-500 bg-blue-500/10" : "hover:bg-secondary/50"}`}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`budget-${budget.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleBudgetToggle(budget.id, !!checked)
                                }
                              />
                              <label
                                htmlFor={`budget-${budget.id}`}
                                className="text-sm flex-1 cursor-pointer"
                              >
                                {budget.name}{" "}
                                <span className="text-muted-foreground">
                                  (
                                  {parseFloat(budget.spent_amount || 0).toFixed(
                                    2,
                                  )}{" "}
                                  / {parseFloat(budget.total_amount).toFixed(2)}
                                  )
                                </span>
                              </label>
                            </div>

                            {/* Manual amount input - only show when multiple budgets selected and manual distribution */}
                            {isSelected &&
                              selectedBudgets.length > 1 &&
                              budgetDistribution === "manual" && (
                                <div className="mt-2 ml-6 flex items-center gap-2">
                                  <Label className="text-xs">Amount:</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={expenseAmount}
                                    value={selectedItem?.amount || ""}
                                    onChange={(e) =>
                                      handleBudgetAmountChange(
                                        budget.id,
                                        e.target.value,
                                      )
                                    }
                                    className="h-7 w-24 text-sm"
                                    placeholder="0.00"
                                  />
                                </div>
                              )}

                            {/* Preview calculated amount */}
                            {isSelected && (
                              <div className="mt-1 ml-6 text-xs text-blue-600">
                                Will deduct: {getCurrencySymbol()}
                                {calculatedAmount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Distribution Type Selection - only show when more than 1 budget is selected */}
                    {selectedBudgets.length > 1 && (
                      <div className="space-y-2 p-2 rounded bg-blue-500/5 border border-blue-500/20">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">
                            Distribution Type
                          </Label>
                          <span className="text-xs font-medium text-blue-600">
                            Expense: {getCurrencySymbol()}
                            {expenseAmount.toFixed(2)}
                          </span>
                        </div>
                        <RadioGroup
                          value={budgetDistribution}
                          onValueChange={(value) => {
                            setBudgetDistribution(value as DistributionType);
                          }}
                          className="flex flex-wrap gap-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="equal_split"
                              id="budget-equal"
                            />
                            <Label
                              htmlFor="budget-equal"
                              className="text-sm cursor-pointer"
                            >
                              Equal Split
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="half" id="budget-half" />
                            <Label
                              htmlFor="budget-half"
                              className="text-sm cursor-pointer"
                            >
                              Half (50%)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="manual" id="budget-manual" />
                            <Label
                              htmlFor="budget-manual"
                              className="text-sm cursor-pointer"
                            >
                              Manual
                            </Label>
                          </div>
                        </RadioGroup>

                        {/* Total distribution summary */}
                        <div
                          className={`text-xs ${budgetDistribution === "manual" && Math.abs(totalBudgetDistribution - expenseAmount) >= 0.01 ? "text-red-600" : "text-muted-foreground"}`}
                        >
                          Total: {getCurrencySymbol()}
                          {totalBudgetDistribution.toFixed(2)}
                          {budgetDistribution === "manual" &&
                            Math.abs(totalBudgetDistribution - expenseAmount) >=
                              0.01 && (
                              <span className="ml-1 text-red-600">
                                (must equal {getCurrencySymbol()}
                                {expenseAmount.toFixed(2)})
                              </span>
                            )}
                        </div>
                      </div>
                    )}

                    {selectedBudgets.length > 0 && (
                      <p className="text-xs text-blue-600">
                        ✓ {selectedBudgets.length} budget(s) selected
                        {selectedBudgets.length === 1 &&
                          ` - ${getCurrencySymbol()}${expenseAmount.toFixed(2)} (full amount)`}
                        {selectedBudgets.length > 1 &&
                          budgetDistribution === "equal_split" &&
                          ` - ${getCurrencySymbol()}${expenseAmount.toFixed(2)} each (full amount)`}
                        {selectedBudgets.length > 1 &&
                          budgetDistribution === "half" &&
                          ` - ${getCurrencySymbol()}${(expenseAmount / 2).toFixed(2)} each (50%)`}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Already Linked Savings Goals (for editing) */}
              {alreadyLinkedSavingsGoalIds.length > 0 && (
                <div className="space-y-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-green-500" />
                    <Label className="text-sm font-medium">
                      Linked Savings Goals
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            Click the unlink button to remove the connection and
                            restore the savings goal's amount.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {alreadyLinkedSavingsGoalIds.map((id) => {
                      const goal = savingsGoals.find((g: any) => g.id === id);
                      return goal ? (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="bg-green-500/20 flex items-center gap-1 pr-1"
                        >
                          {goal.name}
                          <button
                            type="button"
                            className="h-4 w-4 ml-1 flex items-center justify-center hover:bg-destructive/20 hover:text-destructive rounded-full text-muted-foreground"
                            onClick={() =>
                              handleUnlinkSavingsGoal(id, goal.name)
                            }
                            disabled={unlinkMutation.isPending}
                            title="Unlink from savings goal"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Add New Savings Goals with Distribution Options */}
              <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-green-500" />
                  <Label className="text-sm font-medium">
                    {expense
                      ? "Add More Savings Goals"
                      : "Link to Savings Goals"}
                  </Label>
                  {availableSavingsGoals.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {availableSavingsGoals.length} available
                    </Badge>
                  )}
                </div>

                {availableSavingsGoals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No savings goals available to link.
                  </p>
                ) : (
                  <>
                    {/* Savings Goal Selection Checkboxes */}
                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
                      {availableSavingsGoals.map((goal: any) => {
                        const isSelected = selectedSavingsGoals.some(
                          (item) => item.id === goal.id,
                        );
                        const selectedItem = selectedSavingsGoals.find(
                          (item) => item.id === goal.id,
                        );
                        const calculatedAmount = getSavingsGoalAmount(goal.id);

                        return (
                          <div
                            key={goal.id}
                            className={`p-2 rounded border ${isSelected ? "border-green-500 bg-green-500/10" : "hover:bg-secondary/50"}`}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`goal-${goal.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleSavingsGoalToggle(goal.id, !!checked)
                                }
                              />
                              <label
                                htmlFor={`goal-${goal.id}`}
                                className="text-sm flex-1 cursor-pointer"
                              >
                                {goal.name}{" "}
                                <span className="text-muted-foreground">
                                  (
                                  {parseFloat(goal.current_amount || 0).toFixed(
                                    2,
                                  )}{" "}
                                  / {parseFloat(goal.target_amount).toFixed(2)})
                                </span>
                              </label>
                            </div>

                            {/* Manual amount input - only show when multiple goals selected and manual distribution */}
                            {isSelected &&
                              selectedSavingsGoals.length > 1 &&
                              savingsGoalDistribution === "manual" && (
                                <div className="mt-2 ml-6 flex items-center gap-2">
                                  <Label className="text-xs">Amount:</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={expenseAmount}
                                    value={selectedItem?.amount || ""}
                                    onChange={(e) =>
                                      handleSavingsGoalAmountChange(
                                        goal.id,
                                        e.target.value,
                                      )
                                    }
                                    className="h-7 w-24 text-sm"
                                    placeholder="0.00"
                                  />
                                </div>
                              )}

                            {/* Preview calculated amount */}
                            {isSelected && (
                              <div className="mt-1 ml-6 text-xs text-amber-600">
                                Will withdraw: {getCurrencySymbol()}
                                {calculatedAmount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Distribution Type Selection - only show when more than 1 goal is selected */}
                    {selectedSavingsGoals.length > 1 && (
                      <div className="space-y-2 p-2 rounded bg-green-500/5 border border-green-500/20">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">
                            Distribution Type
                          </Label>
                          <span className="text-xs font-medium text-green-600">
                            Expense: {getCurrencySymbol()}
                            {expenseAmount.toFixed(2)}
                          </span>
                        </div>
                        <RadioGroup
                          value={savingsGoalDistribution}
                          onValueChange={(value) => {
                            setSavingsGoalDistribution(
                              value as DistributionType,
                            );
                          }}
                          className="flex flex-wrap gap-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="equal_split"
                              id="savings-equal"
                            />
                            <Label
                              htmlFor="savings-equal"
                              className="text-sm cursor-pointer"
                            >
                              Equal Split
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="half" id="savings-half" />
                            <Label
                              htmlFor="savings-half"
                              className="text-sm cursor-pointer"
                            >
                              Half (50%)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="manual"
                              id="savings-manual"
                            />
                            <Label
                              htmlFor="savings-manual"
                              className="text-sm cursor-pointer"
                            >
                              Manual
                            </Label>
                          </div>
                        </RadioGroup>

                        {/* Total distribution summary */}
                        <div
                          className={`text-xs ${savingsGoalDistribution === "manual" && Math.abs(totalSavingsGoalDistribution - expenseAmount) >= 0.01 ? "text-red-600" : "text-muted-foreground"}`}
                        >
                          Total: {getCurrencySymbol()}
                          {totalSavingsGoalDistribution.toFixed(2)}
                          {savingsGoalDistribution === "manual" &&
                            Math.abs(
                              totalSavingsGoalDistribution - expenseAmount,
                            ) >= 0.01 && (
                              <span className="ml-1 text-red-600">
                                (must equal {getCurrencySymbol()}
                                {expenseAmount.toFixed(2)})
                              </span>
                            )}
                        </div>
                      </div>
                    )}

                    {selectedSavingsGoals.length > 0 && (
                      <p className="text-xs text-amber-600">
                        ⚠️ {selectedSavingsGoals.length} savings goal(s)
                        selected
                        {selectedSavingsGoals.length === 1 &&
                          ` - ${getCurrencySymbol()}${expenseAmount.toFixed(2)} (full amount)`}
                        {selectedSavingsGoals.length > 1 &&
                          savingsGoalDistribution === "equal_split" &&
                          ` - ${getCurrencySymbol()}${expenseAmount.toFixed(2)} each (full amount)`}
                        {selectedSavingsGoals.length > 1 &&
                          savingsGoalDistribution === "half" &&
                          ` - ${getCurrencySymbol()}${(expenseAmount / 2).toFixed(2)} each (50%)`}
                      </p>
                    )}
                  </>
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

      {/* Category Delete Confirmation Dialog */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "
              {categoryToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog
        open={unlinkConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setUnlinkConfirmOpen(false);
            setItemToUnlink(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unlink{" "}
              {itemToUnlink?.type === "budget" ? "Budget" : "Savings Goal"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this expense from "
              {itemToUnlink?.name}"?
              {itemToUnlink?.type === "budget"
                ? " The budget's spent amount will be restored."
                : " The savings goal's amount will be restored."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnlink}
              disabled={unlinkMutation.isPending}
            >
              {unlinkMutation.isPending ? "Unlinking..." : "Unlink"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
