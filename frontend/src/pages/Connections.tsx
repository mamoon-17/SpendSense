import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Connection {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'connected' | 'pending' | 'blocked';
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: string;
  lastActive: string;
  sharedBudgets: number;
  totalSpent: number;
}

interface PendingInvite {
  id: string;
  email: string;
  budgetName: string;
  role: 'admin' | 'editor' | 'viewer';
  sentAt: string;
  status: 'pending' | 'expired';
}

// Mock data
const mockConnections: Connection[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    status: 'connected',
    role: 'editor',
    joinedAt: '2024-01-15',
    lastActive: new Date().toISOString(),
    sharedBudgets: 3,
    totalSpent: 2450
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike@example.com',
    status: 'connected',
    role: 'viewer',
    joinedAt: '2024-02-01',
    lastActive: new Date(Date.now() - 86400000).toISOString(),
    sharedBudgets: 1,
    totalSpent: 890
  },
  {
    id: '3',
    name: 'Emma Davis',
    email: 'emma@example.com',
    status: 'pending',
    role: 'editor',
    joinedAt: '2024-01-28',
    lastActive: '',
    sharedBudgets: 0,
    totalSpent: 0
  }
];

const mockPendingInvites: PendingInvite[] = [
  {
    id: '1',
    email: 'alex@example.com',
    budgetName: 'Family Budget',
    role: 'viewer',
    sentAt: '2024-01-25',
    status: 'pending'
  },
  {
    id: '2',
    email: 'lisa@example.com',
    budgetName: 'Vacation Fund',
    role: 'editor',
    sentAt: '2024-01-20',
    status: 'expired'
  }
];

export const Connections: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [selectedBudget, setSelectedBudget] = useState('');

  // Mock query - replace with real API call
  const { data: connections = mockConnections } = useQuery({
    queryKey: ['connections'],
    queryFn: () => Promise.resolve(mockConnections),
  });

  const { data: pendingInvites = mockPendingInvites } = useQuery({
    queryKey: ['pending-invites'],
    queryFn: () => Promise.resolve(mockPendingInvites),
  });

  const filteredConnections = connections.filter(connection =>
    connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendInvite = () => {
    if (!inviteEmail || !selectedBudget) return;
    console.log('Sending invite:', { inviteEmail, inviteRole, selectedBudget });
    setInviteEmail('');
    setSelectedBudget('');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-warning" />;
      case 'admin': return <Shield className="w-4 h-4 text-primary" />;
      case 'editor': return <Edit className="w-4 h-4 text-success" />;
      case 'viewer': return <Eye className="w-4 h-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-warning/10 text-warning border-warning/20';
      case 'admin': return 'bg-primary/10 text-primary border-primary/20';
      case 'editor': return 'bg-success/10 text-success border-success/20';
      case 'viewer': return 'bg-muted/10 text-muted-foreground border-muted/20';
      default: return '';
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
        <Button className="btn-primary w-fit">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Connections</p>
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
                <p className="text-sm font-medium text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold text-warning">{pendingInvites.filter(i => i.status === 'pending').length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Shared Budgets</p>
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
                <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold">{connections.filter(c => 
                  new Date(c.lastActive) > new Date(Date.now() - 3600000)
                ).length}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Online users
            </p>
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
              {filteredConnections.map((connection) => (
                <Card key={connection.id} className="card-financial">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback>
                              {connection.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {connection.status === 'connected' && 
                           new Date(connection.lastActive) > new Date(Date.now() - 3600000) && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-foreground">{connection.name}</h3>
                            <Badge className={cn('text-xs', getRoleBadgeColor(connection.role))}>
                              {getRoleIcon(connection.role)}
                              <span className="ml-1 capitalize">{connection.role}</span>
                            </Badge>
                            {connection.status === 'pending' && (
                              <Badge variant="outline" className="text-warning border-warning/20">
                                Pending
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{connection.email}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Joined {format(new Date(connection.joinedAt), 'MMM dd, yyyy')}</span>
                            <span>{connection.sharedBudgets} shared budgets</span>
                            {connection.totalSpent > 0 && (
                              <span>${connection.totalSpent.toLocaleString()} spent</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {connection.status === 'pending' ? (
                          <>
                            <Button size="sm" variant="outline" className="text-success hover:text-success">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline">
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
              ))}
            </TabsContent>

            <TabsContent value="invites" className="space-y-4 mt-6">
              {pendingInvites.map((invite) => (
                <Card key={invite.id} className="card-financial">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{invite.email}</h3>
                          <Badge variant={invite.status === 'expired' ? 'destructive' : 'secondary'}>
                            {invite.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Invited to <span className="font-medium">{invite.budgetName}</span> as {invite.role}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sent {format(new Date(invite.sentAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          Resend
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                      role: 'Owner',
                      icon: <Crown className="w-5 h-5 text-warning" />,
                      permissions: ['Full control', 'Delete budget', 'Manage all members', 'All editing rights'],
                      color: 'border-warning/20 bg-warning/5'
                    },
                    {
                      role: 'Admin',
                      icon: <Shield className="w-5 h-5 text-primary" />,
                      permissions: ['Add/remove members', 'Edit budget settings', 'Manage expenses', 'View all data'],
                      color: 'border-primary/20 bg-primary/5'
                    },
                    {
                      role: 'Editor',
                      icon: <Edit className="w-5 h-5 text-success" />,
                      permissions: ['Add expenses', 'Edit own expenses', 'View budget data', 'Comment and discuss'],
                      color: 'border-success/20 bg-success/5'
                    },
                    {
                      role: 'Viewer',
                      icon: <Eye className="w-5 h-5 text-muted-foreground" />,
                      permissions: ['View budget data', 'See expenses', 'Join discussions', 'Receive notifications'],
                      color: 'border-muted/20 bg-muted/5'
                    }
                  ].map((roleData) => (
                    <div key={roleData.role} className={cn('p-4 rounded-lg border', roleData.color)}>
                      <div className="flex items-center space-x-3 mb-3">
                        {roleData.icon}
                        <h3 className="font-semibold">{roleData.role}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {roleData.permissions.map((permission, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
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
              
              <Select value={inviteRole} onValueChange={(value: 'viewer' | 'editor' | 'admin') => setInviteRole(value)}>
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
                disabled={!inviteEmail || !selectedBudget}
                className="w-full btn-primary"
              >
                Send Invite
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
                <p className="font-medium">Sarah joined Family Budget</p>
                <p className="text-muted-foreground text-xs">2 hours ago</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">Mike added expense: Groceries</p>
                <p className="text-muted-foreground text-xs">5 hours ago</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">New invite sent to Alex</p>
                <p className="text-muted-foreground text-xs">1 day ago</p>
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