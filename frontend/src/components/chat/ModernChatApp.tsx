import React, { useState, useRef, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
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
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { useChat } from "../../hooks/useChat";
import { sanitizeText } from "../../utils/sanitize";
import { isValidId, isValidMessage } from "../../utils/validate";

const ModernChatApp: React.FC = observer(() => {
  const { chatStore, socket } = useChat();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >("2");
  const [messageText, setMessageText] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TODO: Replace with real API data
  const conversations: any[] = [];
  const currentConversation = conversations.find(
    (c) => c.id === selectedConversation
  );
  const messages: any[] = [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    if (isValidId(id)) {
      chatStore.setCurrentConversation(id);
      socket?.emit("join_conversation", { conversationId: id });
      chatStore.markAsRead(id);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const sanitized = sanitizeText(messageText);
    if (!isValidMessage(sanitized)) {
      setSendError("Invalid message");
      return;
    }

    // Add message to local state for immediate UI update
    const newMessage = {
      id: Date.now().toString(),
      content: sanitized,
      sender: chatStore.currentUserId || "user_1",
      senderName: "You",
      sent_at: new Date().toISOString(),
      status: "sending" as const,
    };

    // Emit to socket
    if (selectedConversation) {
      socket?.emit("send_message", {
        conversation_id: selectedConversation,
        content: sanitized,
      });
    }

    setMessageText("");
    setSendError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  const renderMessage = (message: any) => {
    const isOwn =
      message.sender === chatStore.currentUserId || message.sender === "user_1";
    const isSystem = message.isSystem;

    return (
      <div
        key={message.id}
        className={cn("flex mb-4", isOwn ? "justify-end" : "justify-start")}
      >
        <div
          className={cn(
            "flex max-w-[70%] gap-2",
            isOwn ? "flex-row-reverse" : "flex-row"
          )}
        >
          {!isOwn && !isSystem && (
            <Avatar className="w-8 h-8 mt-1">
              <AvatarFallback className="text-xs">
                {currentConversation?.avatar || "U"}
              </AvatarFallback>
            </Avatar>
          )}

          <div
            className={cn(
              "rounded-2xl px-4 py-2",
              isOwn
                ? "bg-white text-gray-900"
                : isSystem
                ? "bg-blue-50 border border-blue-200 text-blue-900"
                : "bg-gray-100 text-gray-900"
            )}
          >
            {isSystem && message.budgetData && (
              <div className="mb-2">
                <div className="font-semibold text-sm">
                  {message.budgetData.title}
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {message.budgetData.amount}
                </div>
              </div>
            )}

            <div className="text-sm">{message.content}</div>

            <div
              className={cn(
                "flex items-center gap-1 mt-1 text-xs text-gray-500",
                isOwn ? "justify-end" : "justify-start"
              )}
            >
              <span>{formatMessageTime(message.sent_at)}</span>
              {isOwn && (
                <div className="ml-1">
                  {message.status === "read" ? (
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  ) : message.status === "delivered" ? (
                    <CheckCheck className="w-3 h-3" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex bg-gray-50">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Conversations
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700"
                >
                  {conversations.filter((c) => c.unreadCount > 0).length}
                </Badge>
              </CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-12rem)] max-h-[600px]">
              <div className="space-y-2 p-4">
                {filteredConversations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No conversations found.
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={cn(
                        "p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-50",
                        selectedConversation === conversation.id &&
                          "bg-blue-50 border border-blue-200"
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
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm leading-tight truncate flex-1 mr-2">
                              {conversation.name}
                            </h4>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-blue-600 text-white text-xs flex-shrink-0">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>

                          {conversation.lastMessage && (
                            <div className="flex items-start space-x-2">
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-xs text-gray-600 overflow-hidden"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    lineHeight: "1.2em",
                                    maxHeight: "2.4em",
                                  }}
                                >
                                  {conversation.lastMessage.content}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500 flex-shrink-0 mt-0.5">
                                {formatMessageTime(
                                  conversation.lastMessage.timestamp
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-w-0">
        <Card className="h-full flex flex-col rounded-none border-0">
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200">
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
                    <p className="text-sm text-gray-600">
                      {currentConversation.type === "group"
                        ? `${
                            currentConversation.participants?.length || 3
                          } members`
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
              <CardContent className="flex-1 p-4 overflow-hidden">
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No messages yet.
                      </div>
                    ) : (
                      messages.map(renderMessage)
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-end space-x-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="resize-none"
                    />
                  </div>
                  <Button variant="ghost" size="sm">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    className="bg-blue-600 hover:bg-blue-700"
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
              <div className="text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {sendError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg">
          {sendError}
        </div>
      )}
    </div>
  );
});

export default ModernChatApp;
