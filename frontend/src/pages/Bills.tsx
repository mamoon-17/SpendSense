import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Receipt,
  Users,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Share2,
  Edit,
  Trash2,
  Filter,
  Search,
  X,
  Split,
} from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { billsAPI, categoriesAPI, connectionsAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string;
}

interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
}

interface Participant extends User {
  amount?: number;
  percentage?: number;
  status?: "pending" | "paid";
  paidAt?: string;
}

interface Bill {
  id: string;
  name: string;
  description?: string;
  total_amount: string;
  split_type: "equal" | "percentage" | "manual";
  split_type_display?: string;
  due_date: string;
  status: "pending" | "partial" | "completed";
  category: Category;
  created_by: User;
  participants: Participant[];
  participant_count?: number;
  payment_progress?: string;
  currency?: string;
}

export const Bills: React.FC = () => {
  const {
    formatCurrency,
    convertAmount,
    formatAmount,
    formatDate,
    getCurrencySymbol,
    settings,
  } = useUserSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    total_amount: "",
    split_type: "equal",
    due_date: "",
    category_id: "",
    participant_ids: [] as string[],
    percentages: [] as number[],
    custom_amounts: [] as number[],
  });
  const [isRequestPaymentOpen, setIsRequestPaymentOpen] = useState(false);
  const [selectedBillForRequest, setSelectedBillForRequest] = useState<
    string | null
  >(null);
  const [selectedUsersForRequest, setSelectedUsersForRequest] = useState<
    string[]
  >([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBillIdForEdit, setSelectedBillIdForEdit] = useState<
    string | null
  >(null);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Bills - SpendSense";
  }, []);

  // Fetch bills from backend
  const { data: bills = [], isLoading } = useQuery({
    queryKey: ["bills"],
    queryFn: async () => {
      const response = await billsAPI.getBills();
      return response.data.map((bill: any) => ({
        ...bill,
        currency: bill.currency || settings.currency,
        participants: bill.participants.map((participant: any) => ({
          ...participant,
          amount: participant.amount_owed
            ? parseFloat(participant.amount_owed)
            : 0,
        })),
      })) as Bill[];
    },
  });

  // Get the current bill data from the bills array (ensures fresh data)
  const selectedBillForEdit = selectedBillIdForEdit
    ? bills.find((b) => b.id === selectedBillIdForEdit) || null
    : null;

  // Fetch categories for the form
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesAPI.getCategories();
      return response.data;
    },
    staleTime: 300000, // Cache for 5 minutes (categories rarely change)
    refetchOnWindowFocus: false,
  });

  // Fetch connections for selecting participants
  const { data: connections = [] } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => {
      const response = await connectionsAPI.getConnections();
      return response.data;
    },
  });

  // Create a list of available participants excluding the current user
  const availableParticipants = React.useMemo(() => {
    const participants = [];
    // Add connections (others only)
    connections.forEach((connection: any) => {
      const otherUser =
        connection.requester?.id === user?.id
          ? connection.receiver
          : connection.requester;
      participants.push({
        ...otherUser,
        isCurrentUser: false,
      });
    });

    return participants;
  }, [connections, user]);

  // Create bill mutation
  const createBillMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      billsAPI.createBill({
        ...data,
        total_amount: parseFloat(data.total_amount),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Bill created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create bill",
        variant: "destructive",
      });
    },
  });

  // Send payment request mutation
  const sendPaymentRequestMutation = useMutation({
    mutationFn: ({
      billId,
      userIds,
      message,
    }: {
      billId: string;
      userIds: string[];
      message?: string;
    }) => billsAPI.requestPayment(billId, { userIds, message }),
    onSuccess: () => {
      toast({
        title: "Payment request sent!",
        description:
          "Selected users will receive a notification about the payment request.",
      });
      setIsRequestPaymentOpen(false);
      setSelectedBillForRequest(null);
      setSelectedUsersForRequest([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send payment request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mark payment as paid mutation
  const markPaymentPaidMutation = useMutation({
    mutationFn: ({
      billId,
      participantId,
    }: {
      billId: string;
      participantId: string;
    }) => billsAPI.markPaymentAsPaid(billId, participantId),
    onSuccess: async () => {
      // Invalidate and refetch bills - the modal will automatically update via selectedBillForEdit computed value
      await queryClient.invalidateQueries({ queryKey: ["bills"] });

      toast({
        title: "Payment marked as paid!",
        description: "Your payment status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark payment as paid. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete bill mutation
  const deleteBillMutation = useMutation({
    mutationFn: (billId: string) => billsAPI.deleteBill(billId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast({
        title: "Bill deleted successfully",
        description: "The bill has been removed from your list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete bill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      total_amount: "",
      split_type: "equal",
      due_date: "",
      category_id: "",
      participant_ids: [],
      percentages: [],
      custom_amounts: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.total_amount ||
      !formData.due_date ||
      !formData.category_id ||
      formData.participant_ids.length === 0
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields and select at least one participant",
        variant: "destructive",
      });
      return;
    }

    // Additional validation for manual split
    if (formData.split_type === "manual") {
      const total = parseFloat(formData.total_amount) || 0;
      const enteredSum = formData.custom_amounts.reduce(
        (sum, a) => sum + (a || 0),
        0
      );
      const creatorIncluded = formData.participant_ids.includes(user?.id || "");

      if (!creatorIncluded) {
        // Sum must be strictly less than total so creator gets remaining share.
        if (enteredSum >= total) {
          toast({
            title: "Manual Split Error",
            description:
              "Assigned amounts for other participants must be less than the total so your share remains.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // When creator is selected, sums must match exactly.
        if (Math.abs(enteredSum - total) > 0.01) {
          toast({
            title: "Manual Split Error",
            description:
              "Manual split amounts must add up exactly to the total when you are included as a participant.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    // Additional validation for percentage split
    if (formData.split_type === "percentage") {
      const totalPct = formData.percentages.reduce(
        (sum, p) => sum + (p || 0),
        0
      );
      const creatorIncluded = formData.participant_ids.includes(user?.id || "");

      if (!creatorIncluded) {
        // Others must be strictly less than 100% so creator has remaining share.
        if (totalPct >= 100) {
          toast({
            title: "Percentage Split Error",
            description:
              "Assigned percentages for other participants must total less than 100% so your share remains.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // When creator included, percentage must total exactly 100%.
        if (Math.abs(totalPct - 100) > 0.01) {
          toast({
            title: "Percentage Split Error",
            description:
              "Percentages must add up exactly to 100% when you are included as a participant.",
            variant: "destructive",
          });
          return;
        }
      }
    }
    createBillMutation.mutate(formData);
  };

  const toggleParticipant = (userId: string) => {
    setFormData((prev) => {
      const currentIndex = prev.participant_ids.indexOf(userId);

      if (currentIndex >= 0) {
        // Remove participant
        const newParticipantIds = prev.participant_ids.filter(
          (id) => id !== userId
        );
        const newPercentages = [...prev.percentages];
        const newCustomAmounts = [...prev.custom_amounts];

        // Remove the corresponding percentage/amount
        newPercentages.splice(currentIndex, 1);
        newCustomAmounts.splice(currentIndex, 1);

        return {
          ...prev,
          participant_ids: newParticipantIds,
          percentages: newPercentages,
          custom_amounts: newCustomAmounts,
        };
      } else {
        // Add participant
        return {
          ...prev,
          participant_ids: [...prev.participant_ids, userId],
          percentages: [...prev.percentages, 0], // Default to 0%
          custom_amounts: [...prev.custom_amounts, 0], // Default to $0
        };
      }
    });
  };

  const filteredBills = bills.filter((bill) => {
    const matchesSearch = bill.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || bill.status === filterStatus;
    const matchesCategory =
      filterCategory === "all" || bill.category?.name === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalBillAmount = bills.reduce(
    (sum, bill) =>
      sum +
      convertAmount(
        parseFloat(bill.total_amount || "0"),
        bill.currency || "USD"
      ),
    0
  );
  const totalOwed = 0; // Will be calculated from participant payments
  const totalOwedToYou = 0; // Will be calculated from participant payments

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-success";
      case "partial":
        return "text-warning";
      case "pending":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const getBillProgress = (bill: Bill) => {
    if (bill.payment_progress) {
      return parseFloat(bill.payment_progress);
    }
    return 0;
  };

  return (
    <PageTransition>
      <div className="space-y-8 p-2">
        {/* Header with Purple/Indigo Gradient */}
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-violet-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-violet-950/30 rounded-2xl p-8 shadow-sm border border-purple-100/50 dark:border-purple-900/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl">
                <Split className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-purple-700 to-indigo-600 dark:from-purple-300 dark:to-indigo-300 bg-clip-text text-transparent">
                Bills & Splitting
              </h1>
            </div>
            <p className="text-muted-foreground ml-20 text-base">
              Split bills fairly, track shared expenses, and settle up with
              friends
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 shadow-md h-11 px-6"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Split Bill
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Cards with Purple/Indigo Theme */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card className="border-purple-100 dark:border-purple-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-950 dark:to-purple-950/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Total Bills
                </p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {formatAmount(totalBillAmount)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Receipt className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {bills.length} bills this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 dark:border-indigo-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-950 dark:to-indigo-950/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                  You Owe
                </p>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  {formatAmount(totalOwed)}
                </p>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pending payments
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-100 dark:border-violet-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-violet-50/30 dark:from-slate-950 dark:to-violet-950/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-900 dark:text-violet-100">
                  Owed to You
                </p>
                <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                  {formatAmount(totalOwedToYou)}
                </p>
              </div>
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">From others</p>
          </CardContent>
        </Card>

        <Card className="border-purple-100 dark:border-purple-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-950 dark:to-purple-950/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Active Bills
                </p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {bills.filter((b) => b.status !== "completed").length}
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Awaiting settlement
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="bills" className="w-full">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
              <TabsList className="grid w-full sm:w-fit grid-cols-3 bg-purple-100/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
                <TabsTrigger
                  value="bills"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  All Bills
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  Pending
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  History
                </TabsTrigger>
              </TabsList>

              <Button
                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 shadow-md"
                onClick={() => {
                  if (bills.length === 0) {
                    toast({
                      title: "No bills available",
                      description:
                        "Create a bill first before requesting payment.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setIsRequestPaymentOpen(true);
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Request Payment
              </Button>
            </div>

            {/* Filters with Purple Theme */}
            <Card className="border-purple-100/50 dark:border-purple-900/20 shadow-sm bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-4 h-4" />
                      <Input
                        placeholder="Search bills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-purple-200 focus-visible:ring-purple-400 dark:border-purple-900/50"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full lg:w-[150px] border-purple-200 dark:border-purple-900/50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger className="w-full lg:w-[150px]">
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
                </div>
              </CardContent>
            </Card>

            <TabsContent value="bills" className="space-y-4 mt-6">
              {isLoading ? (
                <p className="text-center text-muted-foreground">
                  Loading bills...
                </p>
              ) : filteredBills.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No bills found
                </p>
              ) : (
                filteredBills.map((bill) => {
                  const progress = getBillProgress(bill);

                  return (
                    <Card
                      key={bill.id}
                      className="border-purple-100 dark:border-purple-900/30 shadow-md hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 bg-gradient-to-br from-white via-white to-purple-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-purple-950/10"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <CardTitle className="text-lg text-purple-900 dark:text-purple-100">
                                {bill.name}
                              </CardTitle>
                              <Badge
                                variant={
                                  bill.status === "completed"
                                    ? "default"
                                    : bill.status === "partial"
                                    ? "secondary"
                                    : "outline"
                                }
                                className={cn(
                                  bill.status === "completed" &&
                                    "bg-purple-600 hover:bg-purple-700",
                                  bill.status === "partial" &&
                                    "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                                )}
                              >
                                {bill.status}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="capitalize border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300"
                              >
                                {bill.split_type_display || bill.split_type}{" "}
                                split
                              </Badge>
                            </div>
                            <CardDescription className="flex items-center space-x-4">
                              <span>
                                {formatCurrency(
                                  parseFloat(bill.total_amount),
                                  bill.currency || "USD"
                                )}{" "}
                                total
                              </span>
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {bill.participants?.length || 0} people
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                Due {formatDate(bill.due_date)}
                              </span>
                            </CardDescription>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBillIdForEdit(bill.id);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={
                                bill.created_by.id !== user?.id ||
                                deleteBillMutation.isPending
                              }
                              className={
                                bill.created_by.id === user?.id
                                  ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                                  : "text-muted-foreground cursor-not-allowed"
                              }
                              onClick={() => {
                                if (bill.created_by.id === user?.id) {
                                  if (
                                    confirm(
                                      `Are you sure you want to delete "${bill.name}"? This action cannot be undone.`
                                    )
                                  ) {
                                    deleteBillMutation.mutate(bill.id);
                                  }
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Payment Progress
                            </span>
                            <span className="font-medium">
                              {progress.toFixed(0)}% complete
                            </span>
                          </div>
                          <Progress
                            value={progress}
                            className="h-3 bg-purple-100 dark:bg-purple-950/50 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-indigo-500"
                          />
                        </div>

                        {/* Participants */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Participants</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {bill.participants?.map((participant) => (
                              <div
                                key={participant.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30"
                              >
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="text-xs">
                                      {participant.name?.charAt(0) ||
                                        participant.username?.charAt(0) ||
                                        "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {participant.name || participant.username}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {participant.amount
                                        ? formatAmount(participant.amount)
                                        : "Amount pending"}
                                      {participant.percentage &&
                                        ` (${participant.percentage}%)`}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  {participant.status === "paid" ? (
                                    <Badge className="bg-success/10 text-success border-success/20">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Paid
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-warning border-warning/20"
                                    >
                                      <Clock className="w-3 h-3 mr-1" />
                                      Pending
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <div className="space-y-4">
                {filteredBills
                  .filter((bill) => bill.status !== "completed")
                  .map((bill) => (
                    <Card
                      key={bill.id}
                      className="card-financial border-warning/20"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{bill.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(
                                parseFloat(bill.total_amount),
                                bill.currency || "USD"
                              )}{" "}
                              • Due {formatDate(bill.due_date)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 text-warning" />
                            <Button size="sm" className="btn-primary">
                              Settle
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <div className="space-y-4">
                {filteredBills
                  .filter((bill) => bill.status === "completed")
                  .map((bill) => (
                    <Card key={bill.id} className="border-purple-100 dark:border-purple-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-purple-50/20 dark:from-slate-950 dark:to-purple-950/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{bill.name}</h3>
                              <CheckCircle className="w-4 h-4 text-success" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(
                                parseFloat(bill.total_amount),
                                bill.currency || "USD"
                              )}{" "}
                              • Due {formatDate(bill.due_date)}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Split removed - layout adjusted */}

          {/* Recent Activity */}
          <Card className="border-purple-200/60 dark:border-purple-900/40 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-white via-white to-purple-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-purple-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 border border-purple-200/60 dark:border-purple-800">
                    <Clock className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                  </div>
                  <CardTitle className="text-sm text-purple-900 dark:text-purple-100">Recent Activity</CardTitle>
                </div>
                <Badge className="bg-purple-600/90 text-white">Live</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {bills.length > 0 ? (
                (() => {
                  const activities: Array<{
                    text: string;
                    detail: string;
                    date: Date;
                    kind?: "settled" | "paid" | "pending" | "created";
                    amount?: number;
                  }> = [];

                  // Generate activities from bills
                  bills
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.due_date).getTime() -
                        new Date(a.due_date).getTime()
                    )
                    .slice(0, 5)
                    .forEach((bill) => {
                      // Check for paid participants
                      const paidParticipants = bill.participants.filter(
                        (p) => p.status === "paid"
                      );
                      const currentUserParticipant = bill.participants.find(
                        (p) => p.id === user?.id
                      );

                      if (bill.status === "completed") {
                        activities.push({
                          text: `Bill "${bill.name}" was settled`,
                          detail: `${formatAmount(
                            parseFloat(bill.total_amount)
                          )} total`,
                          date: new Date(bill.due_date),
                          kind: "settled",
                          amount: parseFloat(bill.total_amount),
                        });
                      } else if (paidParticipants.length > 0) {
                        paidParticipants.forEach((participant) => {
                          const isCurrentUser = participant.id === user?.id;
                          activities.push({
                            text: isCurrentUser
                              ? `You paid ${formatAmount(
                                  participant.amount || 0
                                )}`
                              : `${
                                  participant.name || participant.username
                                } paid ${formatAmount(
                                  participant.amount || 0
                                )}`,
                            detail: `For ${bill.name}`,
                            date: new Date(bill.due_date),
                            kind: "paid",
                            amount: participant.amount || 0,
                          });
                        });
                      } else if (currentUserParticipant?.status === "pending") {
                        activities.push({
                          text: `You have a pending payment`,
                          detail: `${formatAmount(
                            currentUserParticipant.amount || 0
                          )} for ${bill.name}`,
                          date: new Date(bill.due_date),
                          kind: "pending",
                          amount: currentUserParticipant.amount || 0,
                        });
                      } else if (bill.created_by.id === user?.id) {
                        activities.push({
                          text: `You created "${bill.name}"`,
                          detail: `${formatAmount(
                            parseFloat(bill.total_amount)
                          )} with ${
                            bill.participant_count || bill.participants.length
                          } ${
                            bill.participants.length === 1 ? "person" : "people"
                          }`,
                          date: new Date(bill.due_date),
                          kind: "created",
                          amount: parseFloat(bill.total_amount),
                        });
                      }
                    });

                  // Sort by date and take top 3
                  const recentActivities = activities
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .slice(0, 3);

                  const chipFor = (kind?: string) => {
                    switch (kind) {
                      case "settled":
                        return (
                          <div className="p-2 rounded-md bg-emerald-100/70 dark:bg-emerald-900/30 border border-emerald-200/60 dark:border-emerald-800">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                          </div>
                        );
                      case "paid":
                        return (
                          <div className="p-2 rounded-md bg-indigo-100/70 dark:bg-indigo-900/30 border border-indigo-200/60 dark:border-indigo-800">
                            <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                          </div>
                        );
                      case "pending":
                        return (
                          <div className="p-2 rounded-md bg-amber-100/70 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-800">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                          </div>
                        );
                      case "created":
                        return (
                          <div className="p-2 rounded-md bg-purple-100/70 dark:bg-purple-900/30 border border-purple-200/60 dark:border-purple-800">
                            <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                          </div>
                        );
                      default:
                        return (
                          <div className="p-2 rounded-md bg-purple-100/70 dark:bg-purple-900/30 border border-purple-200/60 dark:border-purple-800">
                            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                          </div>
                        );
                    }
                  };

                  return recentActivities.length > 0 ? (
                    <div className="divide-y divide-purple-200/60 dark:divide-purple-900/40">
                      {recentActivities.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 py-3 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 px-2 rounded-lg transition-colors"
                        >
                          {chipFor(activity.kind)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                              {activity.text}
                            </p>
                            <p className="text-xs text-muted-foreground">{activity.detail}</p>
                          </div>
                          {typeof activity.amount === "number" && activity.amount > 0 && (
                            <Badge
                              variant="outline"
                              className="border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300"
                            >
                              {formatAmount(activity.amount)}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No recent activity
                    </p>
                  );
                })()
              ) : (
                <p className="text-sm text-muted-foreground">
                  No bills yet. Create your first bill to see activity here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Split Bill Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Split a New Bill</DialogTitle>
            <DialogDescription>
              Create a new bill and split it among participants
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Bill Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Bill Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Dinner at Italiano"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional details about the bill"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Amount and Split Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_amount">
                    Total Amount ({getCurrencySymbol()}) *
                  </Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.total_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, total_amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="split_type">Split Type *</Label>
                  <Select
                    value={formData.split_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, split_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Equal Split</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due Date and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category *</Label>
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
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon && (
                            <span className="mr-2">{category.icon}</span>
                          )}
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-2">
                <Label>Select Participants *</Label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {availableParticipants.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No connections found. Add connections to split bills with
                      them.
                    </p>
                  ) : (
                    availableParticipants.map((participant: any) => {
                      const isSelected = formData.participant_ids.includes(
                        participant.id
                      );

                      return (
                        <div
                          key={participant.id}
                          className={cn(
                            "p-3 rounded-lg transition-colors",
                            isSelected
                              ? "bg-primary/10 border-2 border-primary"
                              : "bg-muted/30 hover:bg-muted/50 border-2 border-transparent"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className="flex items-center space-x-3 cursor-pointer flex-1"
                              onClick={() => toggleParticipant(participant.id)}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  {participant.name?.charAt(0) ||
                                    participant.username?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {participant.name || participant.username}
                                  {participant.isCurrentUser && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      (You)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  @{participant.username}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {isSelected &&
                                formData.split_type === "percentage" && (
                                  <div
                                    className="flex items-center space-x-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                      className="w-16 h-8"
                                      value={
                                        formData.percentages[
                                          formData.participant_ids.indexOf(
                                            participant.id
                                          )
                                        ] || ""
                                      }
                                      onChange={(e) => {
                                        const index =
                                          formData.participant_ids.indexOf(
                                            participant.id
                                          );
                                        const newPercentages = [
                                          ...formData.percentages,
                                        ];
                                        newPercentages[index] =
                                          parseFloat(e.target.value) || 0;
                                        setFormData({
                                          ...formData,
                                          percentages: newPercentages,
                                        });
                                      }}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      %
                                    </span>
                                  </div>
                                )}

                              {isSelected &&
                                formData.split_type === "manual" && (
                                  <div
                                    className="flex items-center space-x-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Input
                                      type="number"
                                      placeholder="0.00"
                                      min="0"
                                      step="0.01"
                                      className="w-20 h-8"
                                      value={
                                        formData.custom_amounts[
                                          formData.participant_ids.indexOf(
                                            participant.id
                                          )
                                        ] || ""
                                      }
                                      onChange={(e) => {
                                        const index =
                                          formData.participant_ids.indexOf(
                                            participant.id
                                          );
                                        const newAmounts = [
                                          ...formData.custom_amounts,
                                        ];
                                        newAmounts[index] =
                                          parseFloat(e.target.value) || 0;
                                        setFormData({
                                          ...formData,
                                          custom_amounts: newAmounts,
                                        });
                                      }}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      {getCurrencySymbol()}
                                    </span>
                                  </div>
                                )}

                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-primary" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {formData.participant_ids.length > 0 && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      {formData.participant_ids.length} participant(s) selected
                      {formData.total_amount &&
                        formData.split_type === "equal" && (
                          <span className="ml-2">
                            (
                            {formatAmount(
                              parseFloat(formData.total_amount) /
                                formData.participant_ids.length
                            )}{" "}
                            each)
                          </span>
                        )}
                    </p>

                    {formData.split_type === "percentage" && (
                      <p className="text-xs">
                        Total:{" "}
                        {formData.percentages
                          .reduce((sum, p) => sum + (p || 0), 0)
                          .toFixed(1)}
                        %
                        {formData.percentages.reduce(
                          (sum, p) => sum + (p || 0),
                          0
                        ) !== 100 && (
                          <span className="text-warning ml-2">
                            ⚠️ Should total 100%
                          </span>
                        )}
                      </p>
                    )}

                    {formData.split_type === "manual" &&
                      formData.total_amount && (
                        <p className="text-xs">
                          Total:{" "}
                          {formatAmount(
                            formData.custom_amounts.reduce(
                              (sum, a) => sum + (a || 0),
                              0
                            )
                          )}
                          {" / " +
                            formatAmount(parseFloat(formData.total_amount))}
                          {Math.abs(
                            formData.custom_amounts.reduce(
                              (sum, a) => sum + (a || 0),
                              0
                            ) - parseFloat(formData.total_amount)
                          ) > 0.01 && (
                            <span className="text-warning ml-2">
                              ⚠️ Should match total amount
                            </span>
                          )}
                        </p>
                      )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createBillMutation.isPending}>
                {createBillMutation.isPending ? "Creating..." : "Create Bill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Request Payment Dialog */}
      <Dialog
        open={isRequestPaymentOpen}
        onOpenChange={setIsRequestPaymentOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-success" />
              Request Payment
            </DialogTitle>
            <DialogDescription>
              Select a bill and choose users to request payment from.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Bill Selection */}
            <div>
              <Label htmlFor="bill-select">Select Bill</Label>
              <Select
                value={selectedBillForRequest || ""}
                onValueChange={setSelectedBillForRequest}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a bill" />
                </SelectTrigger>
                <SelectContent>
                  {bills
                    .filter((bill) => bill.status !== "completed")
                    .map((bill) => (
                      <SelectItem key={bill.id} value={bill.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{bill.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {formatAmount(parseFloat(bill.total_amount))}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Selection */}
            {selectedBillForRequest &&
              (() => {
                const selectedBill = bills.find(
                  (b) => b.id === selectedBillForRequest
                );
                const allParticipants = selectedBill?.participants || [];
                // Filter out the current user from the participants list
                const billParticipants = allParticipants.filter(
                  (participant: any) => participant.id !== user?.id
                );

                return (
                  <div>
                    <Label>Select Users to Request Payment From</Label>
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                      {billParticipants.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-3 text-center border rounded">
                          {allParticipants.length === 0
                            ? "No participants found for this bill"
                            : "No other participants to request payment from"}
                        </p>
                      ) : (
                        billParticipants.map((participant: any) => (
                          <div
                            key={participant.id}
                            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                            onClick={() => {
                              setSelectedUsersForRequest((prev) =>
                                prev.includes(participant.id)
                                  ? prev.filter((id) => id !== participant.id)
                                  : [...prev, participant.id]
                              );
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedUsersForRequest.includes(
                                participant.id
                              )}
                              onChange={() => {}}
                              className="rounded"
                            />
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">
                                {participant.name?.charAt(0) ||
                                  participant.username?.charAt(0) ||
                                  participant.email?.charAt(0) ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {participant.name ||
                                  participant.username ||
                                  participant.email ||
                                  "Unknown User"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Click to select for payment request
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

            {/* Optional Message */}
            <div>
              <Label htmlFor="request-message">Message (Optional)</Label>
              <Textarea
                id="request-message"
                placeholder="Add a message for the payment request..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRequestPaymentOpen(false);
                setSelectedBillForRequest(null);
                setSelectedUsersForRequest([]);
              }}
            >
              Cancel
            </Button>
            <Button
              className="btn-success"
              disabled={
                !selectedBillForRequest ||
                selectedUsersForRequest.length === 0 ||
                sendPaymentRequestMutation.isPending
              }
              onClick={() => {
                if (
                  selectedBillForRequest &&
                  selectedUsersForRequest.length > 0
                ) {
                  const message = (
                    document.getElementById(
                      "request-message"
                    ) as HTMLTextAreaElement
                  )?.value;
                  sendPaymentRequestMutation.mutate({
                    billId: selectedBillForRequest,
                    userIds: selectedUsersForRequest,
                    message,
                  });
                }
              }}
            >
              {sendPaymentRequestMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Send Request ({selectedUsersForRequest.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bill Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Payment Status for "{selectedBillForEdit?.name}"
            </DialogTitle>
            <DialogDescription>
              Mark your payment as completed for this bill.
            </DialogDescription>
          </DialogHeader>

          {selectedBillForEdit && (
            <div className="space-y-4">
              {/* Bill Details */}
              <div className="p-4 bg-accent rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{selectedBillForEdit.name}</h4>
                  <Badge variant="secondary">
                    {selectedBillForEdit.split_type_display ||
                      selectedBillForEdit.split_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedBillForEdit.description}
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span>Total Amount:</span>
                  <span className="font-semibold">
                    {formatAmount(parseFloat(selectedBillForEdit.total_amount))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Due Date:</span>
                  <span>{formatDate(selectedBillForEdit.due_date)}</span>
                </div>
              </div>

              {/* Current User's Participation */}
              {(() => {
                const currentUserParticipation =
                  selectedBillForEdit.participants?.find(
                    (p: any) => p.id === user?.id
                  );

                if (!currentUserParticipation) {
                  return (
                    <div className="text-center p-4 text-muted-foreground">
                      You are not a participant in this bill.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {user?.name?.charAt(0) ||
                              (user as any)?.username?.charAt(0) ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user?.name || (user as any)?.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Your portion
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatAmount(
                            parseFloat(
                              (currentUserParticipation as any).amount_owed ||
                                "0"
                            )
                          )}
                        </p>
                        <Badge
                          className={`text-xs ${
                            (currentUserParticipation as any).status === "paid"
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-warning/10 text-warning border-warning/20"
                          }`}
                        >
                          {(currentUserParticipation as any).status === "paid"
                            ? "Paid"
                            : "Pending"}
                        </Badge>
                      </div>
                    </div>

                    {(currentUserParticipation as any).status !== "paid" && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                          Mark this payment as completed once you've paid your
                          portion.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            {selectedBillForEdit &&
              (() => {
                const currentUserParticipation =
                  selectedBillForEdit.participants?.find(
                    (p: any) => p.id === user?.id
                  );

                if (!currentUserParticipation) {
                  return null;
                }

                const isAlreadyPaid =
                  (currentUserParticipation as any).status === "paid";

                return (
                  <Button
                    className="btn-success"
                    disabled={
                      isAlreadyPaid || markPaymentPaidMutation.isPending
                    }
                    onClick={() => {
                      if (!isAlreadyPaid) {
                        markPaymentPaidMutation.mutate({
                          billId: selectedBillForEdit.id,
                          participantId: currentUserParticipation.id,
                        });
                      }
                    }}
                  >
                    {markPaymentPaidMutation.isPending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Marking as Paid...
                      </>
                    ) : isAlreadyPaid ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Already Paid
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Paid
                      </>
                    )}
                  </Button>
                );
              })()}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageTransition>
  );
};
