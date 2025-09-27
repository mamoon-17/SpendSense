import React, { useState } from "react";
import { Bell, Check, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: "budget" | "expense" | "goal" | "collaboration";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "high" | "medium" | "low";
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "budget",
    title: "Budget Alert",
    message: "You've spent 85% of your Groceries budget",
    timestamp: "2 hours ago",
    read: false,
    priority: "high",
  },
  {
    id: "2",
    type: "goal",
    title: "Savings Goal",
    message: "Great job! You're 75% closer to your vacation goal",
    timestamp: "1 day ago",
    read: false,
    priority: "medium",
  },
  {
    id: "3",
    type: "collaboration",
    title: "New Collaborator",
    message: 'Sarah joined your "House Budget" workspace',
    timestamp: "2 days ago",
    read: true,
    priority: "low",
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "budget":
      return <AlertCircle className="w-4 h-4 text-warning" />;
    case "goal":
      return <Check className="w-4 h-4 text-success" />;
    case "collaboration":
      return <Clock className="w-4 h-4 text-primary" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
};

export const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const handleViewAllNotifications = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    navigate("/app/notifications");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs">
                Mark all read
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {mockNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            mockNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors ${
                  !notification.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {notification.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {mockNotifications.length > 0 && (
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={handleViewAllNotifications}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
