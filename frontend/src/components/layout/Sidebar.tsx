import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  Receipt,
  Target,
  Users,
  BarChart3,
  Settings,
  Bell,
  CreditCard,
  TrendingUp,
  TrendingDown,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
    description: "Overview & insights",
  },
  {
    label: "Budgets",
    href: "/app/budgets",
    icon: Wallet,
    description: "Manage budgets",
  },

  {
    label: "Expenses",
    href: "/app/expenses",
    icon: TrendingDown,
    description: "Track spending",
  },
  {
    label: "Savings Goals",
    href: "/app/savings",
    icon: Target,
    description: "Save for the future",
  },
  {
    label: "Bills & Splitting",
    href: "/app/bills",
    icon: CreditCard,
    description: "Manage shared expenses",
  },
  {
    label: "Reports",
    href: "/app/reports",
    icon: BarChart3,
    description: "Financial insights",
  },
  {
    label: "Messages",
    href: "/app/messages",
    icon: MessageCircle,
    description: "Chat & collaborate",
  },
];

const bottomItems = [
  {
    label: "Notifications",
    href: "/app/notifications",
    icon: Bell,
    description: "Alerts & updates",
  },
  {
    label: "Settings",
    href: "/app/settings",
    icon: Settings,
    description: "Account & preferences",
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <aside
      className={cn(
        "bg-card border-r border-card-border h-screen flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-card-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-lg text-foreground">FinanceFlow</h2>
              <p className="text-sm text-muted-foreground">Personal Finance</p>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-4 border-b border-card-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground truncate">
                {user.name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "flex-shrink-0 w-5 h-5",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div
                    className={cn(
                      "text-xs",
                      active
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.description}
                  </div>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="p-2 border-t border-card-border space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "flex-shrink-0 w-5 h-5",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div
                    className={cn(
                      "text-xs",
                      active
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.description}
                  </div>
                </div>
              )}
            </NavLink>
          );
        })}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="flex-shrink-0 w-5 h-5 text-muted-foreground group-hover:text-destructive" />
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <div className="font-medium">Logout</div>
              <div className="text-xs text-muted-foreground">
                Exit the application
              </div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
