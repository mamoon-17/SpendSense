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
import { useToast } from "@/hooks/use-toast";
import { budgetAPI, categoriesAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Minus } from "lucide-react";

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: {
    id: string;
    name: string;
    total_amount: string;
    spent_amount: string;
    period: string;
    category: { id: string; name: string };
    start_date: string;
    end_date: string;
    participants?: { id: string; name: string }[];
  };
  onSuccess?: () => void;
}

export const BudgetDialog: React.FC<BudgetDialogProps> = ({
  open,
  onOpenChange,
  budget,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { getCurrencySymbol, settings } = useUserSettings();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    total_amount: "",
    spent_amount: "",
    period: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
    category: "",
    start_date: "",
    end_date: "",
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "budget"],
    queryFn: async () => {
      const response = await categoriesAPI.getCategoriesByType("budget");
      return response.data;
    },
    enabled: open,
    staleTime: 300000, // Cache for 5 minutes (categories rarely change)
    refetchOnWindowFocus: false,
  });

  // Initialize form data when dialog opens or budget changes
  useEffect(() => {
    if (open) {
      setShowCustomInput(false);
      setCustomCategoryName("");
      setCategoryToDelete(null);
      if (budget) {
        setFormData({
          name: budget.name,
          total_amount: String(budget.total_amount || "0"),
          spent_amount: String(budget.spent_amount || "0"),
          period: budget.period as "daily" | "weekly" | "monthly" | "yearly",
          category: budget.category?.id || "",
          start_date: budget.start_date?.split("T")[0] || "",
          end_date: budget.end_date?.split("T")[0] || "",
        });
      } else {
        // Reset form for new budget
        const today = new Date().toISOString().split("T")[0];
        setFormData({
          name: "",
          total_amount: "",
          spent_amount: "0",
          period: "monthly",
          category: "",
          start_date: today,
          end_date: "",
        });
      }
    }
  }, [open, budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.total_amount ||
      !formData.start_date ||
      !formData.end_date
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate end_date is not in the past when creating new budget
    if (!budget) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(formData.end_date);
      if (endDate < today) {
        toast({
          title: "Validation Error",
          description:
            "End date cannot be in the past. Please select a current or future date.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let categoryId = formData.category;

      // If "other" is selected, create a custom category first
      if (formData.category === "other" && customCategoryName.trim()) {
        const response = await categoriesAPI.createCustomCategory({
          name: customCategoryName.trim(),
          type: "budget",
        });
        categoryId = response.data.id;
        // Invalidate categories cache to show the new category next time
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      }

      const payload = {
        name: formData.name,
        total_amount: String(formData.total_amount || "0"),
        spent_amount: String(formData.spent_amount || "0"),
        period: formData.period,
        category:
          categoryId === "none" || categoryId === "other" || !categoryId
            ? ""
            : categoryId,
        start_date: formData.start_date,
        end_date: formData.end_date,
        created_by: user.id,
        currency: settings.currency,
      };

      if (budget) {
        await budgetAPI.updateBudget(budget.id, payload);
        toast({
          title: "Success",
          description: "Budget updated successfully.",
        });
      } else {
        await budgetAPI.createBudget(payload);
        toast({
          title: "Success",
          description: "Budget created successfully.",
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save budget.",
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
      if (formData.category === categoryToDelete.id) {
        setFormData({ ...formData, category: "" });
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
          <DialogTitle>{budget ? "Edit Budget" : "Create Budget"}</DialogTitle>
          <DialogDescription>
            {budget
              ? "Update your budget details below."
              : "Create a new budget to track your spending."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Budget Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Monthly Groceries"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_amount">
                Total Amount ({getCurrencySymbol()}){" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 font-semibold text-lg"
                  onClick={() => {
                    const current = parseFloat(formData.total_amount) || 0;
                    const newValue = Math.max(0, current - 10);
                    setFormData({
                      ...formData,
                      total_amount: newValue.toString(),
                    });
                  }}
                >
                  −
                </Button>
                <Input
                  id="total_amount"
                  type="text"
                  value={formData.total_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, total_amount: e.target.value })
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
                    const current = parseFloat(formData.total_amount) || 0;
                    const newValue = current + 10;
                    setFormData({
                      ...formData,
                      total_amount: newValue.toString(),
                    });
                  }}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spent_amount">
                Spent Amount ({getCurrencySymbol()})
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 font-semibold text-lg"
                  onClick={() => {
                    const current = parseFloat(formData.spent_amount) || 0;
                    const newValue = Math.max(0, current - 10);
                    setFormData({
                      ...formData,
                      spent_amount: newValue.toString(),
                    });
                  }}
                >
                  −
                </Button>
                <Input
                  id="spent_amount"
                  type="text"
                  value={formData.spent_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, spent_amount: e.target.value })
                  }
                  placeholder="0.00"
                  className="text-center"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 font-semibold text-lg"
                  onClick={() => {
                    const current = parseFloat(formData.spent_amount) || 0;
                    const newValue = current + 10;
                    setFormData({
                      ...formData,
                      spent_amount: newValue.toString(),
                    });
                  }}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">
                Period <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.period}
                onValueChange={(
                  value: "daily" | "weekly" | "monthly" | "yearly",
                ) => setFormData({ ...formData, period: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  setFormData({ ...formData, category: value });
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">
                End Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                required
              />
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
                : budget
                  ? "Update Budget"
                  : "Create Budget"}
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
                ⚠️ Warning: All budgets and expenses using this category will be
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
