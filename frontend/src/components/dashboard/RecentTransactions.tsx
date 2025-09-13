import React from 'react';
import { format } from 'date-fns';
import { 
  ShoppingCart, 
  Car, 
  Home, 
  Utensils, 
  Gamepad2,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight 
} from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'expense' | 'income';
}

interface RecentTransactionsProps {
  expenses?: Transaction[];
}

const categoryIcons: Record<string, React.ComponentType<any>> = {
  shopping: ShoppingCart,
  transport: Car,
  housing: Home,
  food: Utensils,
  entertainment: Gamepad2,
  other: MoreHorizontal,
};

// Mock data for demonstration
const mockTransactions: Transaction[] = [
  {
    id: '1',
    description: 'Grocery Shopping',
    amount: -89.50,
    category: 'food',
    date: new Date().toISOString(),
    type: 'expense',
  },
  {
    id: '2',
    description: 'Salary Deposit',
    amount: 3500.00,
    category: 'income',
    date: new Date(Date.now() - 86400000).toISOString(),
    type: 'income',
  },
  {
    id: '3',
    description: 'Gas Station',
    amount: -65.20,
    category: 'transport',
    date: new Date(Date.now() - 172800000).toISOString(),
    type: 'expense',
  },
  {
    id: '4',
    description: 'Netflix Subscription',
    amount: -15.99,
    category: 'entertainment',
    date: new Date(Date.now() - 259200000).toISOString(),
    type: 'expense',
  },
  {
    id: '5',
    description: 'Freelance Project',
    amount: 750.00,
    category: 'income',
    date: new Date(Date.now() - 345600000).toISOString(),
    type: 'income',
  },
];

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ 
  expenses = mockTransactions 
}) => {
  return (
    <div className="space-y-4">
      {expenses.map((transaction) => {
        const Icon = categoryIcons[transaction.category] || MoreHorizontal;
        const isIncome = transaction.amount > 0;
        
        return (
          <div 
            key={transaction.id}
            className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                isIncome 
                  ? 'bg-success-light text-success' 
                  : 'bg-primary-light text-primary'
              }`}>
                {isIncome ? (
                  <ArrowDownRight className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {transaction.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className={`font-semibold ${
                isIncome ? 'text-success' : 'text-foreground'
              }`}>
                {isIncome ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {transaction.category}
              </p>
            </div>
          </div>
        );
      })}
      
      {expenses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No recent transactions</p>
          <p className="text-sm">Your transactions will appear here</p>
        </div>
      )}
    </div>
  );
};