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
    queryKey: ["categories", "budget"],
    queryFn: async () => {
      const response = await categoriesAPI.getCategoriesByType("budget");
      return response.data;
    },
    enabled: open,
  });

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
      !formData.category ||
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
      const payload = {
        name: formData.name,
        total_amount: formData.total_amount,
        spent_amount: formData.spent_amount || "0",
        period: formData.period,
        category: formData.category,
        start_date: formData.start_date,
        end_date: formData.end_date,
        created_by: user.id,
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
      <DialogContent className="sm:max-w-[600px]">
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
                Total Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.total_amount}
                onChange={(e) =>
                  setFormData({ ...formData, total_amount: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spent_amount">Spent Amount</Label>
              <Input
                id="spent_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.spent_amount}
                onChange={(e) =>
                  setFormData({ ...formData, spent_amount: e.target.value })
                }
                placeholder="0.00"
              />
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
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
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
