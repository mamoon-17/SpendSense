import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Bill {
  id: string;
  name: string;
  totalAmount: number;
  splitType: 'equal' | 'percentage' | 'manual';
  participants: Participant[];
  createdBy: string;
  createdAt: string;
  dueDate: string;
  status: 'pending' | 'partial' | 'completed';
  category: string;
  description?: string;
}

interface Participant {
  userId: string;
  name: string;
  avatar?: string;
  amount: number;
  percentage?: number;
  status: 'pending' | 'paid';
  paidAt?: string;
}

interface BillSplit {
  id: string;
  billId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  status: 'pending' | 'settled';
  settledAt?: string;
}

// Mock data
const mockBills: Bill[] = [
  {
    id: '1',
    name: 'Dinner at Italiano',
    totalAmount: 120.50,
    splitType: 'equal',
    participants: [
      { userId: '1', name: 'You', amount: 40.17, status: 'paid', paidAt: new Date().toISOString() },
      { userId: '2', name: 'Sarah', amount: 40.17, status: 'pending' },
      { userId: '3', name: 'Mike', amount: 40.16, status: 'paid', paidAt: new Date().toISOString() }
    ],
    createdBy: '1',
    createdAt: '2024-01-25',
    dueDate: '2024-02-01',
    status: 'partial',
    category: 'Dining'
  },
  {
    id: '2',
    name: 'Grocery Shopping',
    totalAmount: 89.30,
    splitType: 'percentage',
    participants: [
      { userId: '1', name: 'You', amount: 44.65, percentage: 50, status: 'paid', paidAt: new Date().toISOString() },
      { userId: '2', name: 'Sarah', amount: 44.65, percentage: 50, status: 'pending' }
    ],
    createdBy: '1',
    createdAt: '2024-01-24',
    dueDate: '2024-01-31',
    status: 'partial',
    category: 'Groceries'
  },
  {
    id: '3',
    name: 'Uber to Airport',
    totalAmount: 45.00,
    splitType: 'manual',
    participants: [
      { userId: '1', name: 'You', amount: 15.00, status: 'paid', paidAt: new Date().toISOString() },
      { userId: '2', name: 'Sarah', amount: 15.00, status: 'paid', paidAt: new Date().toISOString() },
      { userId: '3', name: 'Mike', amount: 15.00, status: 'paid', paidAt: new Date().toISOString() }
    ],
    createdBy: '2',
    createdAt: '2024-01-23',
    dueDate: '2024-01-30',
    status: 'completed',
    category: 'Transportation'
  }
];

export const Bills: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Mock query - replace with real API call
  const { data: bills = mockBills } = useQuery({
    queryKey: ['bills'],
    queryFn: () => Promise.resolve(mockBills),
  });

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bill.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || bill.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalBillAmount = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const totalOwed = bills.reduce((sum, bill) => {
    const userParticipant = bill.participants.find(p => p.userId === '1');
    return sum + (userParticipant && userParticipant.status === 'pending' ? userParticipant.amount : 0);
  }, 0);
  const totalOwedToYou = bills.reduce((sum, bill) => {
    return sum + bill.participants
      .filter(p => p.userId !== '1' && p.status === 'pending')
      .reduce((participantSum, p) => participantSum + p.amount, 0);
  }, 0);

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'partial': return 'text-warning';
      case 'pending': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getBillProgress = (bill: Bill) => {
    const totalPaid = bill.participants.filter(p => p.status === 'paid').length;
    return (totalPaid / bill.participants.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bills & Splitting</h1>
          <p className="text-muted-foreground mt-1">
            Split bills and track shared expenses with AI-powered suggestions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Receipt className="w-4 h-4 mr-2" />
            Scan Receipt
          </Button>
          <Button className="btn-primary">
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
                <p className="text-sm font-medium text-muted-foreground">Total Bills</p>
                <p className="text-2xl font-bold">${totalBillAmount.toFixed(2)}</p>
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
                <p className="text-sm font-medium text-muted-foreground">You Owe</p>
                <p className="text-2xl font-bold text-warning">${totalOwed.toFixed(2)}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Owed to You</p>
                <p className="text-2xl font-bold text-success">${totalOwedToYou.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              From others
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Bills</p>
                <p className="text-2xl font-bold">{bills.filter(b => b.status !== 'completed').length}</p>
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
              
              <Button className="btn-success">
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
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full lg:w-[150px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Dining">Dining</SelectItem>
                      <SelectItem value="Groceries">Groceries</SelectItem>
                      <SelectItem value="Transportation">Transportation</SelectItem>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <TabsContent value="bills" className="space-y-4 mt-6">
              {filteredBills.map((bill) => {
                const progress = getBillProgress(bill);
                const userParticipant = bill.participants.find(p => p.userId === '1');
                
                return (
                  <Card key={bill.id} className="card-financial">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-lg">{bill.name}</CardTitle>
                            <Badge variant={bill.status === 'completed' ? 'default' : bill.status === 'partial' ? 'secondary' : 'outline'}>
                              {bill.status}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {bill.splitType} split
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center space-x-4">
                            <span>${bill.totalAmount.toFixed(2)} total</span>
                            <span className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {bill.participants.length} people
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Due {format(new Date(bill.dueDate), 'MMM dd')}
                            </span>
                          </CardDescription>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Payment Progress</span>
                          <span className="font-medium">{progress.toFixed(0)}% complete</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      
                      {/* Participants */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Participants</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {bill.participants.map((participant) => (
                            <div key={participant.userId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs">
                                    {participant.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{participant.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    ${participant.amount.toFixed(2)}
                                    {participant.percentage && ` (${participant.percentage}%)`}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {participant.status === 'paid' ? (
                                  <Badge className="bg-success/10 text-success border-success/20">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Paid
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-warning border-warning/20">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* User Actions */}
                      {userParticipant && userParticipant.status === 'pending' && (
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <span className="text-sm text-muted-foreground">
                            You owe ${userParticipant.amount.toFixed(2)}
                          </span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Split className="w-4 h-4 mr-2" />
                              Dispute
                            </Button>
                            <Button size="sm" className="btn-success">
                              Mark as Paid
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <div className="space-y-4">
                {filteredBills.filter(bill => bill.status !== 'completed').map((bill) => (
                  <Card key={bill.id} className="card-financial border-warning/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{bill.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ${bill.totalAmount.toFixed(2)} • Due {format(new Date(bill.dueDate), 'MMM dd')}
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
                {filteredBills.filter(bill => bill.status === 'completed').map((bill) => (
                  <Card key={bill.id} className="card-financial">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{bill.name}</h3>
                            <CheckCircle className="w-4 h-4 text-success" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ${bill.totalAmount.toFixed(2)} • Completed {format(new Date(bill.createdAt), 'MMM dd')}
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
          <AIAssistant compact context="bills" />
          
          {/* Quick Actions */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Split className="w-4 h-4 mr-2" />
                Quick Split
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Receipt className="w-4 h-4 mr-2" />
                Split Receipt
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Equal Split
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
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
                <p className="font-medium">Sarah paid $40.17</p>
                <p className="text-muted-foreground text-xs">For Dinner at Italiano</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">Mike requested $45</p>
                <p className="text-muted-foreground text-xs">Uber to Airport</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">You settled grocery bill</p>
                <p className="text-muted-foreground text-xs">$89.30 total</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant context="bills" />
    </div>
  );
};