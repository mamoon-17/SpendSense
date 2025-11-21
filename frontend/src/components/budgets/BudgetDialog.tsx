import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { budgetAPI, categoriesAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useUserSettings } from "@/hooks/useUserSettings";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesAPI.getCategories();
      return response.data;
    },
    enabled: open,
    staleTime: 300000, // Cache for 5 minutes (categories rarely change)
    refetchOnWindowFocus: false,
  });

  // Default categories if API returns empty
  const defaultCategories = [
    { id: "food-dining", name: "Food & Dining" },
    { id: "travel", name: "Travel" },
    { id: "entertainment", name: "Entertainment" },
    { id: "shopping", name: "Shopping" },
  ];

  const displayCategories =
    categories.length > 0 ? categories : defaultCategories;

  // Initialize form data when dialog opens or budget changes
  useEffect(() => {
    if (open) {
      if (budget) {
        setFormData({
          name: budget.name,
          total_amount: budget.total_amount,
          spent_amount: budget.spent_amount || "0",
          period: budget.period as "daily" | "weekly" | "monthly" | "yearly",
          category: budget.category?.id || "",
          start_date: budget.start_date,
          end_date: budget.end_date,
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
      // Check if selected category is from default list (doesn't exist in DB)
      const defaultCategoryIds = [
        "food-dining",
        "travel",
        "entertainment",
        "shopping",
      ];
      const isDefaultCategory = defaultCategoryIds.includes(formData.category);

      const payload = {
        name: formData.name,
        total_amount: formData.total_amount,
        spent_amount: formData.spent_amount || "0",
        period: formData.period,
        category:
          formData.category === "none" || isDefaultCategory
            ? ""
            : formData.category,
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
                  value: "daily" | "weekly" | "monthly" | "yearly"
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
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="none">None</SelectItem>
                  {displayCategories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon && <span className="mr-2">{cat.icon}</span>}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </Dialog>
  );
};
