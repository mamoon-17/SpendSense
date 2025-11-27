import React, { useState } from "react";
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
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed?: boolean;
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Budgets",
    href: "/app/budgets",
    icon: Wallet,
  },
  {
    label: "Expenses",
    href: "/app/expenses",
    icon: TrendingDown,
  },
  {
    label: "Savings Goals",
    href: "/app/savings",
    icon: Target,
  },
  {
    label: "Bills & Splitting",
    href: "/app/bills",
    icon: CreditCard,
  },
  {
    label: "Reports",
    href: "/app/reports",
    icon: BarChart3,
  },
  {
    label: "Messages",
    href: "/app/messages",
    icon: MessageCircle,
  },
  {
    label: "Connections",
    href: "/app/connections",
    icon: Users,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed: initialCollapsed = false,
}) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={cn(
        "bg-card border-r border-border h-screen flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "px-4 py-3",
          collapsed
            ? "flex items-center justify-between"
            : "flex items-center justify-between"
        )}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "space-x-0" : "space-x-3"
          )}
        >
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-lg text-foreground">SpendSense</h2>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              collapsed ? "rotate-0" : "rotate-180"
            )}
          />
        </button>
      </div>

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
                "flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors group",
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
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
