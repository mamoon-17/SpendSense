import React, { useState } from "react";
import {
  Send,
  Search,
  MoreVertical,
  Users,
  MessageSquare,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock,
  Plus,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
  type: "text" | "file" | "budget-share" | "expense-alert";
  metadata?: any;
}

interface Conversation {
  id: string;
  name: string;
  type: "direct" | "group";
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  avatar?: string;
  isOnline?: boolean;
  budgetId?: string;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
}

// Mock data
const mockUsers: User[] = [
  { id: "1", name: "You", avatar: "", isOnline: true },
  { id: "2", name: "Sarah Johnson", avatar: "", isOnline: true },
  { id: "3", name: "Mike Chen", avatar: "", isOnline: false },
  { id: "4", name: "Emma Davis", avatar: "", isOnline: true },
  { id: "5", name: "AI Assistant", avatar: "", isOnline: true },
];

const mockMessages: Message[] = [
  {
    id: "1",
    content:
      "Hey! I noticed we're over budget on dining this month. Should we adjust our restaurant spending?",
    senderId: "2",
    timestamp: new Date(Date.now() - 3600000),
    status: "read",
    type: "text",
  },
  {
    id: "2",
    content:
      "Good catch! I think we can cut back on takeout and cook more at home.",
    senderId: "1",
    timestamp: new Date(Date.now() - 3300000),
    status: "read",
    type: "text",
  },
  {
    id: "3",
    content: "I've shared our updated grocery budget with you. Check it out!",
    senderId: "2",
    timestamp: new Date(Date.now() - 1800000),
    status: "read",
    type: "budget-share",
    metadata: { budgetName: "Monthly Groceries", amount: 800 },
  },
  {
    id: "4",
    content: "Looks great! I approved the changes.",
    senderId: "1",
    timestamp: new Date(Date.now() - 900000),
    status: "read",
    type: "text",
  },
  {
    id: "5",
    content:
      "Based on your spending patterns, I recommend setting aside an extra $200 for dining next month.",
    senderId: "5",
    timestamp: new Date(Date.now() - 600000),
    status: "read",
    type: "text",
  },
];

const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    type: "direct",
    participants: ["1", "2"],
    lastMessage: mockMessages[4],
    unreadCount: 0,
    isOnline: true,
    budgetId: "family-budget",
  },
  {
    id: "2",
    name: "Family Budget Group",
    type: "group",
    participants: ["1", "2", "3"],
    lastMessage: {
      id: "6",
      content: "Mike added a new expense: Gas bill - $120",
      senderId: "3",
      timestamp: new Date(Date.now() - 7200000),
      status: "delivered",
      type: "expense-alert",
    },
    unreadCount: 2,
    budgetId: "family-budget",
  },
  {
    id: "3",
    name: "AI Financial Advisor",
    type: "direct",
    participants: ["1", "5"],
    lastMessage: {
      id: "7",
      content:
        "Your savings goal progress looks great! You're ahead of schedule on your emergency fund.",
      senderId: "5",
      timestamp: new Date(Date.now() - 10800000),
      status: "read",
      type: "text",
    },
    unreadCount: 0,
    isOnline: true,
  },
];

export const Messages: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string>(
    mockConversations[0].id
  );
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const currentConversation = mockConversations.find(
    (c) => c.id === selectedConversation
  );
  const currentUser = mockUsers.find((u) => u.id === "1");

  const filteredConversations = mockConversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM dd");
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    // Add message logic here
    setMessageText("");
  };

  const renderMessage = (message: Message) => {
    const sender = mockUsers.find((u) => u.id === message.senderId);
    const isOwnMessage = message.senderId === "1";
    const isAI = message.senderId === "5";

    return (
      <div
        key={message.id}
        className={cn(
          "flex items-end space-x-2 mb-4",
          isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
        )}
      >
        {!isOwnMessage && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className={isAI ? "bg-primary text-white" : ""}>
              {isAI ? <Bot className="w-4 h-4" /> : sender?.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}

        <div
          className={cn(
            "max-w-[30%] space-y-1",
            isOwnMessage ? "items-end" : "items-start"
          )}
        >
          {message.type === "budget-share" ? (
            <div
              className={cn(
                "p-3 rounded-lg border",
                isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4" />
                <span className="font-medium">Budget Shared</span>
              </div>
              <p className="text-sm">{message.metadata?.budgetName}</p>
              <p className="text-sm opacity-80">${message.metadata?.amount}</p>
            </div>
          ) : message.type === "expense-alert" ? (
            <div
              className={cn(
                "p-3 rounded-lg border border-warning/20 bg-warning/10"
              )}
            >
              <p className="text-sm text-warning-foreground">
                {message.content}
              </p>
            </div>
          ) : (
            <div
              className={cn(
                "p-3 rounded-lg",
                isOwnMessage
                  ? "bg-primary text-primary-foreground"
                  : isAI
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-muted"
              )}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          )}

          <div
            className={cn(
              "flex items-center space-x-1 text-xs text-muted-foreground",
              isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
            )}
          >
            <span>{formatMessageTime(message.timestamp)}</span>
            {isOwnMessage && (
              <div className="flex items-center">
                {message.status === "sent" && <Clock className="w-3 h-3" />}
                {message.status === "delivered" && (
                  <Check className="w-3 h-3" />
                )}
                {message.status === "read" && (
                  <CheckCheck className="w-3 h-3 text-primary" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Collaborate on budgets and get AI financial advice
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Users className="w-4 h-4 mr-2" />
            New Group
          </Button>
          <Button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Start Chat
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Conversations List */}
        <div className="lg:w-80 lg:flex-shrink-0">
          <Card className="card-financial h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <Badge variant="secondary">
                  {filteredConversations.length}
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-28rem)] max-h-[600px]">
                <div className="space-y-2 p-4">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={cn(
                        "p-4 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                        selectedConversation === conversation.id &&
                          "bg-primary/10 border border-primary/20"
                      )}
                    >
                      <div className="flex items-start space-x-3 w-full">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {conversation.type === "group" ? (
                                <Users className="w-5 h-5" />
                              ) : conversation.name ===
                                "AI Financial Advisor" ? (
                                <Bot className="w-5 h-5" />
                              ) : (
                                conversation.name.charAt(0)
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.isOnline &&
                            conversation.type === "direct" && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm leading-tight truncate flex-1 mr-2">
                              {conversation.name}
                            </h4>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-primary text-white text-xs flex-shrink-0">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>

                          {conversation.lastMessage && (
                            <div className="flex items-start space-x-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground overflow-hidden" style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  lineHeight: '1.2em',
                                  maxHeight: '2.4em'
                                }}>
                                  {conversation.lastMessage.content}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">
                                {formatMessageTime(
                                  conversation.lastMessage.timestamp
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1 min-w-0">
          <Card className="card-financial h-full flex flex-col">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {currentConversation.type === "group" ? (
                          <Users className="w-5 h-5" />
                        ) : currentConversation.name ===
                          "AI Financial Advisor" ? (
                          <Bot className="w-5 h-5" />
                        ) : (
                          currentConversation.name.charAt(0)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {currentConversation.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {currentConversation.type === "group"
                          ? `${currentConversation.participants.length} members`
                          : currentConversation.isOnline
                          ? "Online"
                          : "Offline"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {currentConversation.budgetId && (
                      <Badge variant="outline">Budget Chat</Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4">
                  <ScrollArea className="h-[calc(100vh-28rem)]">
                    <div className="space-y-4">
                      {mockMessages.map(renderMessage)}
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-end space-x-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        className="resize-none"
                      />
                    </div>
                    <Button variant="ghost" size="sm">
                      <Smile className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      className="btn-primary"
                      disabled={!messageText.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Quick Actions for Budget Chats */}
                  {currentConversation.budgetId && (
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm">
                        Share Budget
                      </Button>
                      <Button variant="outline" size="sm">
                        Add Expense
                      </Button>
                      <Button variant="outline" size="sm">
                        Request Approval
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant context="messages" />
    </div>
  );
};
