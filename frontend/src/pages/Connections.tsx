import React, { useState } from "react";
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
import { AIAssistant } from "@/components/ai/AIAssistant";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { connectionsAPI, invitationsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Connection {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "connected" | "pending" | "blocked";
  role: "owner" | "admin" | "editor" | "viewer";
  joinedAt: string;
  lastActive: string;
  sharedBudgets: number;
  totalSpent: number;
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

  const [searchTerm, setSearchTerm] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor" | "admin">(
    "viewer"
  );
  const [selectedBudget, setSelectedBudget] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Real API queries (no mock data)
  const { data: connections = [] } = useQuery({
    queryKey: ["connections"],
    queryFn: () =>
      connectionsAPI
        .getConnections()
        .then((res) => res.data)
        .catch(() => []),
  });

  const { data: pendingInvites = [] } = useQuery({
    queryKey: ["pending-invites"],
    queryFn: () =>
      invitationsAPI
        .getInvitations()
        .then((res) => res.data)
        .catch(() => []),
  });

  const filteredConnections = connections.filter(
    (connection) =>
      connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendInvite = async () => {
    if (!inviteEmail || !selectedBudget) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and select a budget.",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    try {
      // Create invitation data
      const invitationData = {
        username: inviteEmail.split("@")[0], // Extract username from email
        sent_by: "current-user-id", // This would come from auth store
        type: "budget", // Assuming budget invitation type
        target_id: selectedBudget,
      };

      await invitationsAPI.sendInvitation(invitationData);

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail} for ${selectedBudget} as ${inviteRole}.`,
      });

      setInviteEmail("");
      setSelectedBudget("");
    } catch (error) {
      toast({
        title: "Failed to Send Invitation",
        description:
          "There was an error sending the invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleStartChat = (connectionId: string, connectionName: string) => {
    toast({
      title: "Starting Chat",
      description: `Opening chat with ${connectionName}...`,
    });
    // Navigate to Messages page
    navigate("/messages");
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Connections</h1>
          <p className="text-muted-foreground mt-1">
            Manage collaborators and shared budget access
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="btn-primary w-fit"
            onClick={() => setShowAddConnection(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
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
                  {searchResults.map((user) => (
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
                      <Button
                        size="sm"
                        onClick={() => handleAddConnection(user.id)}
                        disabled={addLoading}
                      >
                        {addLoading ? "Adding..." : "Add"}
                      </Button>
                    </div>
                  ))}
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Connections
                </p>
                <p className="text-2xl font-bold">{connections.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all budgets
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Invites
                </p>
                <p className="text-2xl font-bold text-warning">
                  {pendingInvites.filter((i) => i.status === "pending").length}
                </p>
              </div>
              <Send className="w-8 h-8 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Shared Budgets
                </p>
                <p className="text-2xl font-bold text-success">8</p>
              </div>
              <Share className="w-8 h-8 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Active collaborations
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Now
                </p>
                <p className="text-2xl font-bold">
                  {
                    connections.filter(
                      (c) =>
                        new Date(c.lastActive) > new Date(Date.now() - 3600000)
                    ).length
                  }
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Online users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="connections" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="invites">Pending Invites</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
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
                filteredConnections.map((connection) => (
                  <Card key={connection.id} className="card-financial">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback>
                                {connection.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {connection.status === "connected" &&
                              new Date(connection.lastActive) >
                                new Date(Date.now() - 3600000) && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
                              )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-foreground">
                                {connection.name}
                              </h3>
                              <Badge
                                className={cn(
                                  "text-xs",
                                  getRoleBadgeColor(connection.role)
                                )}
                              >
                                {getRoleIcon(connection.role)}
                                <span className="ml-1 capitalize">
                                  {connection.role}
                                </span>
                              </Badge>
                              {connection.status === "pending" && (
                                <Badge
                                  variant="outline"
                                  className="text-warning border-warning/20"
                                >
                                  Pending
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground">
                              {connection.email}
                            </p>

                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>
                                Joined{" "}
                                {format(
                                  new Date(connection.joinedAt),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                              <span>
                                {connection.sharedBudgets} shared budgets
                              </span>
                              {connection.totalSpent > 0 && (
                                <span>
                                  ${connection.totalSpent.toLocaleString()}{" "}
                                  spent
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {connection.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-success hover:text-success"
                                onClick={() => {
                                  toast({
                                    title: "Connection Accepted",
                                    description: `Connection request from ${connection.name} accepted.`,
                                  });
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
                                    description: `Connection request from ${connection.name} declined.`,
                                  });
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStartChat(
                                    connection.id,
                                    connection.name
                                  )
                                }
                                title="Start Chat"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </>
                          )}
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
                            Sent{" "}
                            {format(new Date(invite.sentAt), "MMM dd, yyyy")}
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

            <TabsContent value="permissions" className="mt-6">
              <Card className="card-financial">
                <CardHeader>
                  <CardTitle>Role Permissions</CardTitle>
                  <CardDescription>
                    Understand what each role can do in shared budgets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      role: "Owner",
                      icon: <Crown className="w-5 h-5 text-warning" />,
                      permissions: [
                        "Full control",
                        "Delete budget",
                        "Manage all members",
                        "All editing rights",
                      ],
                      color: "border-warning/20 bg-warning/5",
                    },
                    {
                      role: "Admin",
                      icon: <Shield className="w-5 h-5 text-primary" />,
                      permissions: [
                        "Add/remove members",
                        "Edit budget settings",
                        "Manage expenses",
                        "View all data",
                      ],
                      color: "border-primary/20 bg-primary/5",
                    },
                    {
                      role: "Editor",
                      icon: <Edit className="w-5 h-5 text-success" />,
                      permissions: [
                        "Add expenses",
                        "Edit own expenses",
                        "View budget data",
                        "Comment and discuss",
                      ],
                      color: "border-success/20 bg-success/5",
                    },
                    {
                      role: "Viewer",
                      icon: <Eye className="w-5 h-5 text-muted-foreground" />,
                      permissions: [
                        "View budget data",
                        "See expenses",
                        "Join discussions",
                        "Receive notifications",
                      ],
                      color: "border-muted/20 bg-muted/5",
                    },
                  ].map((roleData) => (
                    <div
                      key={roleData.role}
                      className={cn("p-4 rounded-lg border", roleData.color)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        {roleData.icon}
                        <h3 className="font-semibold">{roleData.role}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {roleData.permissions.map((permission, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 text-sm"
                          >
                            <Check className="w-3 h-3 text-success" />
                            <span>{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <AIAssistant compact context="connections" />

          {/* Quick Invite */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <UserPlus className="w-4 h-4 mr-2" />
                Quick Invite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />

              <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family Budget</SelectItem>
                  <SelectItem value="vacation">Vacation Fund</SelectItem>
                  <SelectItem value="groceries">Grocery Budget</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={inviteRole}
                onValueChange={(value: "viewer" | "editor" | "admin") =>
                  setInviteRole(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleSendInvite}
                disabled={!inviteEmail || !selectedBudget || isInviting}
                className="w-full btn-primary"
              >
                {isInviting ? "Sending..." : "Send Invite"}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                No recent activity.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant context="connections" />
    </div>
  );
};
