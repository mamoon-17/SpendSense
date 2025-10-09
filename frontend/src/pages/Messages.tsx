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

import React from "react";
import ChatApp from "../components/chat/ChatApp";

export const Messages: React.FC = () => {
  return <ChatApp />;
};
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
