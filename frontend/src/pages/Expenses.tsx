import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Filter, 
  Search, 
  Edit, 
  Trash2, 
  Receipt, 
  Calendar, 
  Tag, 
  TrendingUp,
  Download,
  Upload,
  Bot,
  Camera,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { expenseAPI } from '@/lib/api';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  receipt?: string;
  tags: string[];
  aiCategorized: boolean;
  budgetId?: string;
  location?: string;
}

// Mock data
const mockExpenses: Expense[] = [
  {
    id: '1',
    description: 'Grocery Shopping at Whole Foods',
    amount: 87.50,
    category: 'Food & Dining',
    date: new Date().toISOString(),
    tags: ['groceries', 'organic'],
    aiCategorized: true,
    location: 'Whole Foods Market'
  },
  {
    id: '2',
    description: 'Netflix Subscription',
    amount: 15.99,
    category: 'Entertainment',
    date: subDays(new Date(), 1).toISOString(),
    tags: ['subscription', 'streaming'],
    aiCategorized: true
  },
  {
    id: '3',
    description: 'Gas Station Fill-up',
    amount: 45.20,
    category: 'Transportation',
    date: subDays(new Date(), 2).toISOString(),
    tags: ['fuel', 'car'],
    aiCategorized: false,
    location: 'Shell Station'
  }
];

const categories = [
  'Food & Dining',
  'Transportation', 
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Other'
];

export const Expenses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('month');
  const [sortBy, setSortBy] = useState('date');

  // Mock query - replace with real API call
  const { data: expenses = mockExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expenseAPI.getExpenses().then(res => res.data),
  });

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    
    // Filter by period
    const expenseDate = new Date(expense.date);
    const now = new Date();
    let matchesPeriod = true;
    
    switch (filterPeriod) {
      case 'week':
        matchesPeriod = expenseDate >= subDays(now, 7);
        break;
      case 'month':
        matchesPeriod = expenseDate >= startOfMonth(now) && expenseDate <= endOfMonth(now);
        break;
      case 'year':
        matchesPeriod = expenseDate.getFullYear() === now.getFullYear();
        break;
    }
    
    return matchesSearch && matchesCategory && matchesPeriod;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const avgExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;
  
  const categoryTotals = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => (b as number) - (a as number))[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expense Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Track, categorize, and analyze your spending with AI assistance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Camera className="w-4 h-4 mr-2" />
            Scan Receipt
          </Button>
          <Button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This {filterPeriod}
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average</p>
                <p className="text-2xl font-bold">${avgExpense.toFixed(2)}</p>
              </div>
              <Receipt className="w-8 h-8 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{filteredExpenses.length}</p>
              </div>
              <Tag className="w-8 h-8 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {filteredExpenses.filter(e => e.aiCategorized).length} AI categorized
            </p>
          </CardContent>
        </Card>

        <Card className="card-financial">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Category</p>
                <p className="text-lg font-bold truncate">{topCategory?.[0] || 'N/A'}</p>
              </div>
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ${(topCategory?.[1] as number)?.toFixed(2) || '0.00'} spent
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="list" className="w-full">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <TabsList className="grid w-full sm:w-fit grid-cols-3">
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card className="card-financial">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search expenses, tags, or locations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full lg:w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-full lg:w-[150px]">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full lg:w-[120px]">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <TabsContent value="list" className="space-y-4 mt-6">
              {filteredExpenses.map((expense) => (
                <Card key={expense.id} className="card-financial hover:shadow-elevated transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {expense.description}
                          </h3>
                          {expense.aiCategorized && (
                            <Badge variant="secondary" className="text-xs">
                              <Bot className="w-3 h-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(expense.date), 'MMM dd, yyyy')}
                          </span>
                          <Badge variant="outline">{expense.category}</Badge>
                          {expense.location && (
                            <span className="truncate">{expense.location}</span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {expense.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">
                            ${expense.amount.toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(categoryTotals).map(([category, amount]) => (
                  <Card key={category} className="card-financial">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold">{category}</h3>
                        <p className="text-lg font-bold">${(amount as number).toFixed(2)}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {filteredExpenses.filter(e => e.category === category).length} transactions
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <Card className="card-financial">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Spending Analytics
                  </CardTitle>
                  <CardDescription>
                    AI-powered insights about your spending patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-start space-x-3">
                        <Zap className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium text-primary">AI Insight</h4>
                          <p className="text-sm text-foreground mt-1">
                            Your dining expenses increased by 23% this month. Consider setting a weekly dining budget of $150 to stay on track.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-medium mb-2">Spending Trend</h4>
                        <p className="text-2xl font-bold text-success">↓ 12%</p>
                        <p className="text-sm text-muted-foreground">vs last month</p>
                      </div>
                      <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-medium mb-2">Most Frequent</h4>
                        <p className="text-lg font-bold">Food & Dining</p>
                        <p className="text-sm text-muted-foreground">15 transactions</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <AIAssistant compact context="expenses" />
          
          {/* Quick Actions */}
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Zap className="w-4 h-4 mr-2" />
                Auto-categorize All
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Receipt className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Tag className="w-4 h-4 mr-2" />
                Manage Tags
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant context="expenses" />
    </div>
  );
};