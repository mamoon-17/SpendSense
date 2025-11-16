import React, { useEffect } from "react";
import { Bell, Check, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: "budget" | "expense" | "goal" | "collaboration";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "high" | "medium" | "low";
}

// Mock notifications - same as in NotificationDropdown
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "budget",
    title: "Budget Alert",
    message:
      "You've spent 85% of your Groceries budget. Consider reviewing your spending to stay within your monthly limit.",
    timestamp: "2 hours ago",
    read: false,
    priority: "high",
  },
  {
    id: "2",
    type: "goal",
    title: "Savings Goal Achieved",
    message:
      "Great job! You're 75% closer to your vacation goal. Keep up the excellent saving habits!",
    timestamp: "1 day ago",
    read: false,
    priority: "medium",
  },
  {
    id: "3",
    type: "collaboration",
    title: "New Collaborator Added",
    message:
      'Sarah joined your "House Budget" workspace. She can now view and contribute to shared expenses.',
    timestamp: "2 days ago",
    read: true,
    priority: "low",
  },
  {
    id: "4",
    type: "expense",
    title: "Large Expense Detected",
    message:
      "A transaction of $450 was recorded. This is higher than your usual spending pattern.",
    timestamp: "3 days ago",
    read: true,
    priority: "medium",
  },
  {
    id: "5",
    type: "goal",
    title: "Emergency Fund Goal",
    message:
      "Congratulations! You've reached your emergency fund target of $10,000.",
    timestamp: "1 week ago",
    read: true,
    priority: "high",
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "budget":
      return <AlertCircle className="w-5 h-5 text-warning" />;
    case "goal":
      return <Check className="w-5 h-5 text-success" />;
    case "collaboration":
      return <Clock className="w-5 h-5 text-primary" />;
    case "expense":
      return <AlertCircle className="w-5 h-5 text-destructive" />;
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

  useEffect(() => {
    document.title = "Notifications - SpendSense";
  }, []);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
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
          <Button variant="outline" className="text-sm">
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {mockNotifications.length === 0 ? (
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
          mockNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-md ${
                !notification.read ? "ring-2 ring-primary/20 bg-primary/5" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
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
                        <p className="text-sm text-muted-foreground mt-3">
                          {notification.timestamp}
                        </p>
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
  );
};
