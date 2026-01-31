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
import { useToast } from "@/hooks/use-toast";
import { expenseAPI, categoriesAPI } from "@/lib/api";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Minus } from "lucide-react";

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

  // Fetch categories (using budget categories)
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "budget"],
    queryFn: async () => {
      const response = await categoriesAPI.getCategoriesByType("budget");
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
      }
    }
  }, [open, expense]);

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

      // If "other" is selected, create a custom category first
      if (formData.category_id === "other" && customCategoryName.trim()) {
        const response = await categoriesAPI.createCustomCategory({
          name: customCategoryName.trim(),
          type: "budget", // Expenses use budget categories
        });
        categoryId = response.data.id;
        // Invalidate categories cache to show the new category next time
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      }

      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category_id:
          categoryId && categoryId !== "none" && categoryId !== "other"
            ? categoryId
            : undefined,
        date: new Date(formData.date).toISOString(),
        payment_method: formData.payment_method || undefined,
        notes: formData.notes || undefined,
        location: formData.location || undefined,
        currency: settings.currency,
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
              <Label htmlFor="category_id">Category (Optional)</Label>
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
                  <SelectValue placeholder="Select category (optional)" />
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
                            setCategoryToDelete({ id: cat.id, name: cat.name });
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

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={() => setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Are you sure you want to delete the category "
                {categoryToDelete?.name}"?
              </span>
              <span className="block text-amber-500 font-medium">
                ⚠️ Warning: All expenses and budgets using this category will be
                unlinked.
              </span>
              <span className="block">This action cannot be undone.</span>
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
    </Dialog>
  );
};
