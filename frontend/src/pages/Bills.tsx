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
  Split,
  Share2,
  Edit,
  Trash2,
  Filter,
  Search,
  X,
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
  participants: User[];
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
  const [selectedBillForEdit, setSelectedBillForEdit] = useState<Bill | null>(
    null
  );

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

  // Create bill mutation
  const createBillMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      billsAPI.createBill({
        ...data,
        total_amount: parseFloat(data.total_amount),
        currency: settings.currency,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast({
        title: "Payment marked as paid!",
        description: "Your payment status has been updated.",
      });
      setIsEditDialogOpen(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Bills & Splitting
          </h1>
          <p className="text-muted-foreground mt-1">
            Split bills and track shared expenses with friends
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Receipt className="w-4 h-4 mr-2" />
            Scan Receipt
          </Button>
          <Button className="btn-primary" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Split Bill
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Bills
                </p>
                <p className="text-2xl font-bold">
                  {formatAmount(totalBillAmount)}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {bills.length} bills this month
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  You Owe
                </p>
                <p className="text-2xl font-bold text-warning">
                  {formatAmount(totalOwed)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pending payments
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Owed to You
                </p>
                <p className="text-2xl font-bold text-success">
                  {formatAmount(totalOwedToYou)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">From others</p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Bills
                </p>
                <p className="text-2xl font-bold">
                  {bills.filter((b) => b.status !== "completed").length}
                </p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
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
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <TabsList className="grid w-full sm:w-fit grid-cols-3">
                <TabsTrigger value="bills">All Bills</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <Button
                className="btn-success"
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

            {/* Filters */}
            <Card className="card-financial">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search bills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full lg:w-[150px]">
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
                    <Card key={bill.id} className="card-financial">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <CardTitle className="text-lg">
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
                              >
                                {bill.status}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
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
                                setSelectedBillForEdit(bill);
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
                          <Progress value={progress} className="h-2" />
                        </div>

                        {/* Participants */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Participants</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {bill.participants?.map((participant) => (
                              <div
                                key={participant.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
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
                    <Card key={bill.id} className="card-financial">
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
          {/* Quick Actions */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Split className="w-4 h-4 mr-2" />
                Quick Split
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Split Receipt
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Users className="w-4 h-4 mr-2" />
                Equal Split
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Custom Amount
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium">Sarah paid {formatAmount(40.17)}</p>
                <p className="text-muted-foreground text-xs">
                  For Dinner at Italiano
                </p>
              </div>
              <div className="text-sm">
                <p className="font-medium">Mike requested {formatAmount(45)}</p>
                <p className="text-muted-foreground text-xs">Uber to Airport</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">You settled grocery bill</p>
                <p className="text-muted-foreground text-xs">
                  {formatAmount(89.3)} total
                </p>
              </div>
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
                  {connections.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No connections found. Add connections to split bills with
                      them.
                    </p>
                  ) : (
                    connections.map((connection: any) => {
                      const otherUser =
                        connection.requester?.id === user?.id
                          ? connection.receiver
                          : connection.requester;
                      const isSelected = formData.participant_ids.includes(
                        otherUser.id
                      );

                      return (
                        <div
                          key={otherUser.id}
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
                              onClick={() => toggleParticipant(otherUser.id)}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  {otherUser.name?.charAt(0) ||
                                    otherUser.username?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {otherUser.name || otherUser.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  @{otherUser.username}
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
                                            otherUser.id
                                          )
                                        ] || ""
                                      }
                                      onChange={(e) => {
                                        const index =
                                          formData.participant_ids.indexOf(
                                            otherUser.id
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
                                            otherUser.id
                                          )
                                        ] || ""
                                      }
                                      onChange={(e) => {
                                        const index =
                                          formData.participant_ids.indexOf(
                                            otherUser.id
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
                            {formatAmount(
                              parseFloat(bill.total_amount),
                              bill.currency
                            )}
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
                    {formatAmount(
                      parseFloat(selectedBillForEdit.total_amount),
                      selectedBillForEdit.currency
                    )}
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
                              user?.username?.charAt(0) ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user?.name || user?.username}
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
                              currentUserParticipation.amount_owed || "0"
                            ),
                            selectedBillForEdit.currency
                          )}
                        </p>
                        <Badge
                          variant={
                            currentUserParticipation.is_paid
                              ? "success"
                              : "warning"
                          }
                          className="text-xs"
                        >
                          {currentUserParticipation.is_paid
                            ? "Paid"
                            : "Pending"}
                        </Badge>
                      </div>
                    </div>

                    {!currentUserParticipation.is_paid && (
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

                if (
                  !currentUserParticipation ||
                  currentUserParticipation.is_paid
                ) {
                  return null;
                }

                return (
                  <Button
                    className="btn-success"
                    disabled={markPaymentPaidMutation.isPending}
                    onClick={() => {
                      markPaymentPaidMutation.mutate({
                        billId: selectedBillForEdit.id,
                        participantId: currentUserParticipation.id,
                      });
                    }}
                  >
                    {markPaymentPaidMutation.isPending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Marking as Paid...
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
  );
};
