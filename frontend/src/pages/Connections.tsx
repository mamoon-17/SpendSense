import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Send,
  Search,
  MoreVertical,
  Check,
  X,
  Crown,
  Shield,
  Eye,
  Edit,
  Trash2,
  MessageCircle,
  Share,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { connectionsAPI, invitationsAPI, conversationsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

interface Connection {
  id: string;
  requester: {
    id: string;
    name: string;
    username: string;
    email?: string;
  };
  receiver: {
    id: string;
    name: string;
    username: string;
    email?: string;
  };
  status: "connected" | "pending" | "blocked";
  accepted_at: string | null;
  last_active: string | null;
  created_at?: string;
}

interface PendingInvite {
  id: string;
  email: string;
  budgetName: string;
  role: "admin" | "editor" | "viewer";
  sentAt: string;
  status: "pending" | "expired";
}

export const Connections: React.FC = () => {
  // Add Connection modal state (must be inside component)
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [usernameSearch, setUsernameSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState("");
  const [removeConnectionDialog, setRemoveConnectionDialog] = useState<{
    open: boolean;
    connection: Connection | null;
  }>({ open: false, connection: null });

  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    document.title = "Connections - SpendSense";
  }, []);

  // Real API queries (no mock data)
  const { data: connections = [], refetch: refetchConnections } = useQuery({
    queryKey: ["connections"],
    queryFn: () =>
      connectionsAPI
        .getConnections()
        .then((res) => {
          console.log("Connections API Response:", res.data);
          return res.data;
        })
        .catch((error) => {
          console.error("Connections API Error:", error);
          return [];
        }),
    refetchInterval: 30000, // Refetch every 30 seconds to catch new requests
  });

  const { data: pendingInvites = [] } = useQuery({
    queryKey: ["pending-invites"],
    queryFn: () =>
      invitationsAPI
        .getInvitations()
        .then((res) => res.data)
        .catch(() => []),
  });

  // Separate pending requests that the current user received
  const pendingRequests = connections.filter((connection) => {
    return (
      connection.status === "pending" && connection.receiver.id === user?.id
    );
  });

  const filteredConnections = connections.filter((connection) => {
    const otherUser =
      connection.requester.id === user?.id
        ? connection.receiver
        : connection.requester;

    console.log("Connection:", {
      id: connection.id,
      status: connection.status,
      requester: connection.requester.id,
      receiver: connection.receiver.id,
      currentUser: user?.id,
      isReceiver: connection.receiver.id === user?.id,
      otherUser: otherUser.username,
    });

    return (
      otherUser.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      otherUser.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      otherUser.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleStartChat = async (
    connectionId: string,
    connectionName: string
  ) => {
    try {
      const connection = connections.find((c) => c.id === connectionId);
      if (!connection || !user) return;
      const otherUser =
        connection.requester.id === user.id
          ? connection.receiver
          : connection.requester;

      // Navigate immediately for fast UX
      navigate("/app/messages", {
        state: {
          userId: otherUser.id,
          userName: otherUser.name || otherUser.username,
        },
      });

      // Create conversation in background
      conversationsAPI.createConversation({
        name: `Chat with ${otherUser.name || otherUser.username}`,
        type: "direct",
        participant_ids: [otherUser.id],
      });
    } catch (e: any) {
      toast({
        title: "Unable to start chat",
        description: e?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-warning" />;
      case "admin":
        return <Shield className="w-4 h-4 text-primary" />;
      case "editor":
        return <Edit className="w-4 h-4 text-success" />;
      case "viewer":
        return <Eye className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-warning/10 text-warning border-warning/20";
      case "admin":
        return "bg-primary/10 text-primary border-primary/20";
      case "editor":
        return "bg-success/10 text-success border-success/20";
      case "viewer":
        return "bg-muted/10 text-muted-foreground border-muted/20";
      default:
        return "";
    }
  };

  // Search users by username (calls backend API)
  const handleUsernameSearch = async () => {
    setIsSearching(true);
    setAddError("");
    setAddSuccess(false);
    try {
      // Replace with your backend API call
      const res = await connectionsAPI.searchUsersByUsername(usernameSearch);
      setSearchResults(res.data || []);
    } catch (err) {
      setSearchResults([]);
      setAddError("No users found.");
    } finally {
      setIsSearching(false);
    }
  };

  // Add friend/connection (calls backend API)
  const handleAddConnection = async (userId: string) => {
    setAddLoading(true);
    setAddError("");
    setAddSuccess(false);
    try {
      await connectionsAPI.addConnection(userId);
      setAddSuccess(true);
      toast({
        title: "Connection Request Sent",
        description: "Your request was sent.",
      });
      setShowAddConnection(false);
    } catch (err) {
      setAddError("Failed to send connection request.");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Teal/Cyan/Sky Theme */}
      <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-sky-50 dark:from-teal-950/30 dark:via-cyan-950/30 dark:to-sky-950/30 rounded-2xl p-8 shadow-sm border border-teal-100/50 dark:border-teal-900/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-500/10 dark:bg-teal-500/20 rounded-xl">
                <Users className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-teal-700 to-cyan-600 dark:from-teal-300 dark:to-cyan-300 bg-clip-text text-transparent">
                Connections
              </h1>
            </div>
            <p className="text-muted-foreground ml-20 text-base">
              Manage your network and collaborate with ease
            </p>
          </div>
          <Button
            className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 shadow-md h-11 px-6"
            onClick={() => setShowAddConnection(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </div>
      </div>
      {/* Add Connection Modal */}
      <Dialog open={showAddConnection} onOpenChange={setShowAddConnection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Connection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search by username..."
              value={usernameSearch}
              onChange={(e) => setUsernameSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUsernameSearch();
              }}
              autoFocus
            />
            <Button
              onClick={handleUsernameSearch}
              disabled={!usernameSearch || isSearching}
              className="w-full"
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
            {addError && (
              <div className="text-destructive text-sm">{addError}</div>
            )}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => {
                  // Check if user is already a connection
                  const isAlreadyConnection = connections.some(
                    (conn) =>
                      (conn.requester.id === user.id ||
                        conn.receiver.id === user.id) &&
                      conn.status === "connected"
                  );

                  // Check if there's a pending request
                  const hasPendingRequest = connections.some(
                    (conn) =>
                      (conn.requester.id === user.id ||
                        conn.receiver.id === user.id) &&
                      conn.status === "pending"
                  );

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {user.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.username}</span>
                      </div>
                      {isAlreadyConnection ? (
                        <Badge variant="secondary">Connected</Badge>
                      ) : hasPendingRequest ? (
                        <Badge variant="outline">Pending</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddConnection(user.id)}
                          disabled={addLoading}
                        >
                          {addLoading ? "Adding..." : "Add"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {addSuccess && (
              <div className="text-success text-sm">
                Connection request sent!
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddConnection(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Stats Cards with Teal/Cyan/Sky Theme */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-teal-100 dark:border-teal-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-teal-50/30 dark:from-slate-950 dark:to-teal-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Connections
                </p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {connections.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-teal-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all budgets
            </p>
          </CardContent>
        </Card>

        <Card className="border-cyan-100 dark:border-cyan-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-cyan-50/30 dark:from-slate-950 dark:to-cyan-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Requests
                </p>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {pendingRequests.length}
                </p>
              </div>
              <Send className="w-8 h-8 text-cyan-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Awaiting your approval
            </p>
          </CardContent>
        </Card>

        <Card className="border-sky-100 dark:border-sky-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-sky-50/30 dark:from-slate-950 dark:to-sky-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Shared Budgets
                </p>
                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                  8
                </p>
              </div>
              <Share className="w-8 h-8 text-sky-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Active collaborations
            </p>
          </CardContent>
        </Card>

        <Card className="border-teal-100 dark:border-teal-900/30 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-teal-50/30 dark:from-slate-950 dark:to-teal-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Now
                </p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {
                    connections.filter(
                      (c) =>
                        c.status === "connected" &&
                        c.last_active &&
                        new Date(c.last_active) > new Date(Date.now() - 3600000)
                    ).length
                  }
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-teal-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Online users</p>
          </CardContent>
        </Card>
      </div>
      {/* Pending Connection Requests - Prominent Display */}
      {pendingRequests.length > 0 && (
        <Card className="border-cyan-200 dark:border-cyan-900/30 bg-cyan-50/50 dark:bg-cyan-950/20">
          <CardHeader>
            <CardTitle className="text-cyan-700 dark:text-cyan-300 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Connection Requests ({pendingRequests.length})
            </CardTitle>
            <CardDescription>
              You have {pendingRequests.length} pending connection request
              {pendingRequests.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-4 bg-background rounded-lg border"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>
                      {connection.requester.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") ||
                        connection.requester.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {connection.requester.name ||
                        connection.requester.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      @{connection.requester.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested{" "}
                      {format(
                        new Date(
                          connection.created_at ||
                            connection.accepted_at ||
                            new Date()
                        ),
                        "MMM dd, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await connectionsAPI.acceptRequest(connection.id);
                        toast({
                          title: "Connection Accepted",
                          description: `You are now connected with ${
                            connection.requester.name ||
                            connection.requester.username
                          }`,
                        });
                        // Refresh the connections list
                        await refetchConnections();
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to accept connection request.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Connection Declined",
                        description: `Connection request from ${
                          connection.requester.name ||
                          connection.requester.username
                        } declined.`,
                      });
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {/* Main Content */}
      <div className="space-y-6">
        <Tabs
          defaultValue={pendingRequests.length > 0 ? "requests" : "connections"}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-teal-100/50 dark:bg-teal-950/30">
            <TabsTrigger
              value="connections"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white"
            >
              Connections
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white"
            >
              Connection Requests
            </TabsTrigger>
            <TabsTrigger
              value="invites"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white"
            >
              Pending Invites
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <Card className="card-financial mt-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search connections by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <TabsContent value="connections" className="space-y-4 mt-6">
            {filteredConnections.length === 0 ? (
              <Card className="card-financial">
                <CardContent className="p-4 text-center text-muted-foreground">
                  No connections found.
                </CardContent>
              </Card>
            ) : (
              filteredConnections.map((connection) => {
                const otherUser =
                  connection.requester.id === user?.id
                    ? connection.receiver
                    : connection.requester;
                const isReceiver = connection.receiver.id === user?.id;
                const isPending = connection.status === "pending";

                return (
                  <Card key={connection.id} className="card-financial">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback>
                                {otherUser.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") ||
                                  otherUser.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {connection.status === "connected" &&
                              connection.last_active &&
                              new Date(connection.last_active) >
                                new Date(Date.now() - 3600000) && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
                              )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-foreground">
                                {otherUser.name || otherUser.username}
                              </h3>
                              {isPending && isReceiver && (
                                <Badge
                                  variant="outline"
                                  className="text-warning border-warning/20"
                                >
                                  Pending Approval
                                </Badge>
                              )}
                              {isPending && !isReceiver && (
                                <Badge
                                  variant="outline"
                                  className="text-info border-info/20"
                                >
                                  Request Sent
                                </Badge>
                              )}
                              {connection.status === "connected" && (
                                <Badge
                                  variant="outline"
                                  className="text-success border-success/20"
                                >
                                  Connected
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground">
                              @{otherUser.username}
                            </p>

                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>
                                {isPending && isReceiver
                                  ? `Requested ${format(
                                      new Date(
                                        connection.created_at ||
                                          connection.accepted_at ||
                                          new Date()
                                      ),
                                      "MMM dd, yyyy"
                                    )}`
                                  : connection.accepted_at
                                  ? `Connected ${format(
                                      new Date(connection.accepted_at),
                                      "MMM dd, yyyy"
                                    )}`
                                  : `Requested ${format(
                                      new Date(
                                        connection.created_at || new Date()
                                      ),
                                      "MMM dd, yyyy"
                                    )}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isPending && isReceiver ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-success hover:text-success"
                                onClick={async () => {
                                  try {
                                    await connectionsAPI.acceptRequest(
                                      connection.id
                                    );
                                    toast({
                                      title: "Connection Accepted",
                                      description: `Connection request from ${
                                        otherUser.name || otherUser.username
                                      } accepted.`,
                                    });
                                    // Refresh the connections list
                                    await refetchConnections();
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description:
                                        "Failed to accept connection request.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  toast({
                                    title: "Connection Declined",
                                    description: `Connection request from ${
                                      otherUser.name || otherUser.username
                                    } declined.`,
                                  });
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : connection.status === "connected" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStartChat(
                                    connection.id,
                                    otherUser.name || otherUser.username
                                  )
                                }
                                title="Start Chat"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => {
                                      setRemoveConnectionDialog({
                                        open: true,
                                        connection,
                                      });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove Connection
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              Pending...
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4 mt-6">
            {pendingRequests.length === 0 ? (
              <Card className="card-financial">
                <CardContent className="p-4 text-center text-muted-foreground">
                  No pending connection requests.
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((connection) => (
                <Card
                  key={connection.id}
                  className="card-financial border-warning/20"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {connection.requester.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") ||
                              connection.requester.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {connection.requester.name ||
                              connection.requester.username}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            @{connection.requester.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Requested{" "}
                            {format(
                              new Date(
                                connection.created_at ||
                                  connection.accepted_at ||
                                  new Date()
                              ),
                              "MMM dd, yyyy 'at' h:mm a"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await connectionsAPI.acceptRequest(connection.id);
                              toast({
                                title: "Connection Accepted",
                                description: `You are now connected with ${
                                  connection.requester.name ||
                                  connection.requester.username
                                }`,
                              });
                              await refetchConnections();
                            } catch (error) {
                              toast({
                                title: "Error",
                                description:
                                  "Failed to accept connection request.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="bg-success hover:bg-success/90 text-success-foreground"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "Connection Declined",
                              description: `Connection request from ${
                                connection.requester.name ||
                                connection.requester.username
                              } declined.`,
                            });
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="invites" className="space-y-4 mt-6">
            {pendingInvites.length === 0 ? (
              <Card className="card-financial">
                <CardContent className="p-4 text-center text-muted-foreground">
                  No pending invites.
                </CardContent>
              </Card>
            ) : (
              pendingInvites.map((invite) => (
                <Card key={invite.id} className="card-financial">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{invite.email}</h3>
                          <Badge
                            variant={
                              invite.status === "expired"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {invite.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Invited to{" "}
                          <span className="font-medium">
                            {invite.budgetName}
                          </span>{" "}
                          as {invite.role}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sent {format(new Date(invite.sentAt), "MMM dd, yyyy")}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          Resend
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>{" "}
      {/* Remove Connection Alert Dialog */}
      <AlertDialog
        open={removeConnectionDialog.open}
        onOpenChange={(open) =>
          setRemoveConnectionDialog({ open, connection: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove{" "}
              {removeConnectionDialog.connection &&
                (user?.id === removeConnectionDialog.connection.requester.id
                  ? removeConnectionDialog.connection.receiver.name ||
                    removeConnectionDialog.connection.receiver.username
                  : removeConnectionDialog.connection.requester.name ||
                    removeConnectionDialog.connection.requester.username)}{" "}
              from connections?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const otherUser =
                  removeConnectionDialog.connection &&
                  (user?.id === removeConnectionDialog.connection.requester.id
                    ? removeConnectionDialog.connection.receiver
                    : removeConnectionDialog.connection.requester);
                toast({
                  title: "Connection Removed",
                  description: `${
                    otherUser?.name || otherUser?.username
                  } has been removed from your connections.`,
                });
                setRemoveConnectionDialog({ open: false, connection: null });
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
