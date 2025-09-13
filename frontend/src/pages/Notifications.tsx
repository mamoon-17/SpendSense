import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  Filter, 
  Settings,
  DollarSign,
  AlertCircle,
  Users,
  Calendar,
  TrendingUp,
  MessageSquare,
  Receipt,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'budget_alert' | 'expense_approval' | 'bill_reminder' | 'goal_progress' | 'message' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  metadata?: any;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  budgetAlerts: boolean;
  expenseApprovals: boolean;
  billReminders: boolean;
  goalUpdates: boolean;
  messageNotifications: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'budget_alert',
    title: 'Budget Warning',
    message: 'You\'ve spent 85% of your dining budget for this month',
    timestamp: new Date().toISOString(),
    isRead: false,
    priority: 'high'
  },
  {
    id: '2',
    type: 'expense_approval',
    title: 'Expense Approved',
    message: 'Sarah approved your grocery expense of $89.50',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
    priority: 'medium'
  },
  {
    id: '3',
    type: 'bill_reminder',
    title: 'Bill Due Tomorrow',
    message: 'Dinner at Italiano ($40.17) is due tomorrow',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isRead: true,
    priority: 'medium'
  },
  {
    id: '4',
    type: 'goal_progress',
    title: 'Goal Milestone Reached',
    message: 'Congratulations! You\'ve reached 75% of your Emergency Fund goal',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
    priority: 'low'
  },
  {
    id: '5',
    type: 'message',
    title: 'New Message',
    message: 'Mike sent you a message about the vacation budget',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    isRead: true,
    priority: 'low'
  },
  {
    id: '6',
    type: 'system',
    title: 'Monthly Report Ready',
    message: 'Your January financial report is now available',
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    isRead: true,
    priority: 'low'
  }
];

const mockSettings: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  budgetAlerts: true,
  expenseApprovals: true,
  billReminders: true,
  goalUpdates: true,
  messageNotifications: true,
  weeklyReports: false,
  monthlyReports: true
};

export const Notifications: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [settings, setSettings] = useState(mockSettings);

  // Mock query - replace with real API call
  const { data: notifications = mockNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => Promise.resolve(mockNotifications),
  });

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'high':
        return notification.priority === 'high';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'budget_alert': return AlertCircle;
      case 'expense_approval': return Receipt;
      case 'bill_reminder': return DollarSign;
      case 'goal_progress': return Target;
      case 'message': return MessageSquare;
      case 'system': return Settings;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-destructive';
    switch (type) {
      case 'budget_alert': return 'text-warning';
      case 'expense_approval': return 'text-success';
      case 'goal_progress': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Today at ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd at HH:mm');
    }
  };

  const markAsRead = (id: string) => {
    // Implementation for marking notification as read
    console.log('Marking notification as read:', id);
  };

  const markAllAsRead = () => {
    // Implementation for marking all notifications as read
    console.log('Marking all notifications as read');
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Bell className="w-8 h-8 mr-3" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-3 bg-destructive text-white">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with your financial activities and AI insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button className="btn-primary">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-primary">{unreadCount}</p>
              </div>
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-destructive">
                  {notifications.filter(n => n.priority === 'high').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Urgent alerts
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today</p>
                <p className="text-2xl font-bold text-success">
                  {notifications.filter(n => isToday(new Date(n.timestamp))).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              New notifications
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Alerts</p>
                <p className="text-2xl font-bold text-warning">
                  {notifications.filter(n => n.type === 'budget_alert').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="notifications" className="w-full">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <TabsList className="grid w-full sm:w-fit grid-cols-2">
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <Select value={filter} onValueChange={(value: 'all' | 'unread' | 'high') => setFilter(value)}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="notifications" className="space-y-4 mt-6">
              {filteredNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type, notification.priority);
                
                return (
                  <Card key={notification.id} className={cn(
                    "card-financial transition-all hover:shadow-elevated",
                    !notification.isRead && "border-primary/20 bg-primary/5"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={cn(
                            "mt-1 p-2 rounded-lg",
                            notification.priority === 'high' ? 'bg-destructive/10' :
                            notification.type === 'budget_alert' ? 'bg-warning/10' :
                            notification.type === 'goal_progress' ? 'bg-primary/10' :
                            'bg-muted/30'
                          )}>
                            <IconComponent className={cn("w-5 h-5", iconColor)} />
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between">
                              <h3 className={cn(
                                "font-semibold",
                                !notification.isRead && "text-foreground"
                              )}>
                                {notification.title}
                              </h3>
                              <div className="flex items-center space-x-2 ml-4">
                                {notification.priority === 'high' && (
                                  <Badge variant="destructive" className="text-xs">
                                    High
                                  </Badge>
                                )}
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            
                            <p className="text-xs text-muted-foreground">
                              {formatNotificationTime(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {filteredNotifications.length === 0 && (
                <Card className="card-financial">
                  <CardContent className="p-8 text-center">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold text-foreground mb-2">No notifications</h3>
                    <p className="text-muted-foreground">
                      {filter === 'unread' 
                        ? "You're all caught up! No unread notifications."
                        : filter === 'high'
                        ? "No high priority notifications at the moment."
                        : "You don't have any notifications yet."
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <div className="space-y-6">
                <Card className="card-financial">
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose how and when you want to receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* General Settings */}
                    <div className="space-y-4">
                      <h4 className="font-medium">General</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                          </div>
                          <Switch 
                            checked={settings.emailNotifications}
                            onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                          </div>
                          <Switch 
                            checked={settings.pushNotifications}
                            onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Budget & Expense Settings */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Budget & Expenses</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Budget Alerts</p>
                            <p className="text-sm text-muted-foreground">Get notified when approaching budget limits</p>
                          </div>
                          <Switch 
                            checked={settings.budgetAlerts}
                            onCheckedChange={(checked) => updateSetting('budgetAlerts', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Expense Approvals</p>
                            <p className="text-sm text-muted-foreground">Notifications for expense approvals and rejections</p>
                          </div>
                          <Switch 
                            checked={settings.expenseApprovals}
                            onCheckedChange={(checked) => updateSetting('expenseApprovals', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Bill Reminders</p>
                            <p className="text-sm text-muted-foreground">Reminders for upcoming bill payments</p>
                          </div>
                          <Switch 
                            checked={settings.billReminders}
                            onCheckedChange={(checked) => updateSetting('billReminders', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Goals & Reports */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Goals & Reports</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Goal Updates</p>
                            <p className="text-sm text-muted-foreground">Progress updates on savings goals</p>
                          </div>
                          <Switch 
                            checked={settings.goalUpdates}
                            onCheckedChange={(checked) => updateSetting('goalUpdates', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Weekly Reports</p>
                            <p className="text-sm text-muted-foreground">Receive weekly spending summaries</p>
                          </div>
                          <Switch 
                            checked={settings.weeklyReports}
                            onCheckedChange={(checked) => updateSetting('weeklyReports', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Monthly Reports</p>
                            <p className="text-sm text-muted-foreground">Receive detailed monthly financial reports</p>
                          </div>
                          <Switch 
                            checked={settings.monthlyReports}
                            onCheckedChange={(checked) => updateSetting('monthlyReports', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Message Notifications</p>
                            <p className="text-sm text-muted-foreground">Notifications for new messages</p>
                          </div>
                          <Switch 
                            checked={settings.messageNotifications}
                            onCheckedChange={(checked) => updateSetting('messageNotifications', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <AIAssistant compact context="notifications" />
          
          {/* Quick Actions */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Notification Settings
              </Button>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm">Notification Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { type: 'budget_alert', label: 'Budget Alerts', count: notifications.filter(n => n.type === 'budget_alert').length },
                { type: 'expense_approval', label: 'Approvals', count: notifications.filter(n => n.type === 'expense_approval').length },
                { type: 'bill_reminder', label: 'Bill Reminders', count: notifications.filter(n => n.type === 'bill_reminder').length },
                { type: 'goal_progress', label: 'Goal Updates', count: notifications.filter(n => n.type === 'goal_progress').length },
                { type: 'message', label: 'Messages', count: notifications.filter(n => n.type === 'message').length },
                { type: 'system', label: 'System', count: notifications.filter(n => n.type === 'system').length }
              ].map(({ type, label, count }) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant context="notifications" />
    </div>
  );
};