import React from "react";
import {
  Bell,
  Check,
  Clock,
  AlertCircle,
  ArrowLeft,
  Users,
  TrendingUp,
} from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  read: boolean;
  created_at: string;
  data?: {
    type?: string;
    [key: string]: any;
  };
}

const getNotificationIcon = (type?: string) => {
  switch (type) {
    case "budget_alert":
    case "budget_exceeded":
      return <AlertCircle className="w-5 h-5 text-warning" />;
    case "savings_goal_milestone":
    case "savings_goal_achieved":
      return <TrendingUp className="w-5 h-5 text-success" />;
    case "group_added":
    case "collaborator_joined":
      return <Users className="w-5 h-5 text-primary" />;
    case "connection_request":
    case "connection_accepted":
      return <Users className="w-5 h-5 text-blue-500" />;
    default:
      return <Bell className="w-5 h-5 text-muted-foreground" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "medium":
      return "bg-warning/10 text-warning border-warning/20";
    case "low":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsAPI.getNotifications().then((res) => res.data),
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const formatTimestamp = (date: string) => {
    try {
      // Ensure we're parsing the date correctly, handling potential timezone issues
      const parsedDate = new Date(date);

      // Check if the date is valid
      if (isNaN(parsedDate.getTime())) {
        console.warn("Invalid date received:", date);
        return "Unknown time";
      }

      // Log for debugging (remove after fixing)
      console.log("Original date string:", date);
      console.log("Parsed date:", parsedDate);
      console.log("Current time:", new Date());

      return formatDistanceToNow(parsedDate, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting timestamp:", error, "Date:", date);
      return "Unknown time";
    }
  };
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            className="text-sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            {markAllAsReadMutation.isPending
              ? "Marking..."
              : "Mark all as read"}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading notifications...</p>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No notifications
              </h3>
              <p className="text-muted-foreground">
                You're all caught up! New notifications will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification: Notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-md ${
                !notification.read ? "ring-2 ring-primary/20 bg-primary/5" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.data?.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {notification.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={getPriorityColor(notification.priority)}
                          >
                            {notification.priority}
                          </Badge>
                          {!notification.read && (
                            <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <p className="text-sm text-muted-foreground">
                            {formatTimestamp(notification.created_at)}
                          </p>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                markAsReadMutation.mutate(notification.id)
                              }
                              disabled={markAsReadMutation.isPending}
                              className="h-7 text-xs"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </div>
    </PageTransition>
  );
};
