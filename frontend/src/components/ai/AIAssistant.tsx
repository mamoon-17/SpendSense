import React, { useState } from 'react';
import { MessageCircle, Send, Bot, User, X, Minimize2, Maximize2, Lightbulb, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'tip' | 'insight' | 'warning';
}

interface AIAssistantProps {
  className?: string;
  compact?: boolean;
  defaultExpanded?: boolean;
  context?: string; // Current page context for relevant suggestions
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  className,
  compact = false,
  defaultExpanded = false,
  context = 'dashboard'
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: getContextualGreeting(context),
      sender: 'ai',
      timestamp: new Date(),
      type: 'tip'
    }
  ]);

  function getContextualGreeting(context: string): string {
    const greetings = {
      dashboard: "Hi! I'm your AI financial advisor. I notice you've spent 15% more on dining this month. Would you like some budget optimization tips?",
      budgets: "Ready to create smarter budgets? I can analyze your spending patterns and suggest optimal allocations.",
      expenses: "I can help categorize your expenses automatically and identify unusual spending patterns. Try adding an expense!",
      savings: "Great job on your emergency fund! Based on your income, I recommend increasing your vacation savings by $50/month.",
      reports: "I've analyzed your spending trends. Would you like me to generate insights about your top spending categories?"
    };
    return greetings[context as keyof typeof greetings] || greetings.dashboard;
  }

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(message, context),
        sender: 'ai',
        timestamp: new Date(),
        type: 'insight'
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  function generateAIResponse(userMessage: string, context: string): string {
    const responses = {
      budget: "Based on your spending history, I recommend allocating 30% for necessities, 20% for savings, and 50% for discretionary spending. Would you like me to create a budget template?",
      saving: "To reach your $10,000 emergency fund by December, you need to save $417/month. I can help you identify areas to cut back.",
      spending: "I've noticed you spend most on weekends. Consider setting a weekend budget limit and using cash to avoid overspending.",
      default: "I'm analyzing your financial data to provide personalized recommendations. What specific area would you like help with?"
    };
    
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('budget')) return responses.budget;
    if (lowerMessage.includes('save') || lowerMessage.includes('goal')) return responses.saving;
    if (lowerMessage.includes('spend')) return responses.spending;
    return responses.default;
  }

  const aiTips = [
    { icon: TrendingUp, text: "You're 23% under budget this month! Great job!", type: 'success' },
    { icon: Lightbulb, text: "Try the 50/30/20 rule for better budgeting", type: 'tip' },
    { icon: MessageCircle, text: "Your dining expenses increased 40% this week", type: 'warning' }
  ];

  if (compact) {
    return (
      <Card className={cn("w-80", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-sm">
            <Bot className="w-4 h-4 mr-2 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {aiTips.map((tip, index) => (
            <div key={index} className="flex items-start space-x-2 p-2 rounded-lg bg-muted/30">
              <tip.icon className={cn(
                "w-4 h-4 mt-0.5 flex-shrink-0",
                tip.type === 'success' ? 'text-success' : 
                tip.type === 'warning' ? 'text-warning' : 'text-primary'
              )} />
              <p className="text-sm text-foreground">{tip.text}</p>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => setIsExpanded(true)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat with AI
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isMinimized) {
    return (
      <Button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full shadow-lg btn-primary z-50"
      >
        <Bot className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <>
      {/* AI Chat Widget */}
      <div className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300",
        isExpanded ? "w-96 h-[500px]" : "w-12 h-12"
      )}>
        {isExpanded ? (
          <Card className="w-full h-full shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-primary text-white rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <span className="font-medium">AI Financial Advisor</span>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  className="text-white hover:bg-white/20 w-8 h-8 p-0"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="text-white hover:bg-white/20 w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 flex flex-col h-[calc(100%-60px)]">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex items-start space-x-2",
                        msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        msg.sender === 'ai' 
                          ? 'bg-primary text-white' 
                          : 'bg-secondary text-secondary-foreground'
                      )}>
                        {msg.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className={cn(
                        "max-w-[80%] p-3 rounded-lg",
                        msg.sender === 'ai'
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      )}>
                        <p className="text-sm">{msg.content}</p>
                        {msg.type && (
                          <Badge 
                            variant={msg.type === 'warning' ? 'destructive' : 'secondary'} 
                            className="mt-2 text-xs"
                          >
                            {msg.type}
                          </Badge>
                        )}
                        <p className="text-xs opacity-60 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask about your finances..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="sm" className="btn-primary">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {['Budget tips', 'Save more', 'Spending analysis'].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => setMessage(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => setIsExpanded(true)}
            className="w-12 h-12 rounded-full shadow-lg btn-primary animate-pulse"
          >
            <Bot className="w-6 h-6" />
          </Button>
        )}
      </div>
    </>
  );
};