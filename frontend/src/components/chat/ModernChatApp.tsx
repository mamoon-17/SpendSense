import React, { useState, useRef, useEffect } from "react";
import { observer } from "mobx-react-lite";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import {
  Search,
  MoreVertical,
  Users,
  MessageSquare,
  Phone,
  Video,
  Smile,
  Check,
  CheckCheck,
  Clock,
  Plus,
  Bot,
  Send,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { useChat } from "../../hooks/useChat";
import { sanitizeText } from "../../utils/sanitize";
import { isValidId, isValidMessage } from "../../utils/validate";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { connectionsAPI, conversationsAPI, aiAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/components/layout/ThemeProvider";

// Special ID for AI conversation
const AI_CONVERSATION_ID = "ai-assistant-conversation";

const ModernChatApp: React.FC = observer(() => {
  const { chatStore, socket } = useChat();
  const location = useLocation();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(chatStore.currentConversationId || null);
  const [messageText, setMessageText] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    [],
  );
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuthStore();
  // Filter out AI type conversations from regular list (we add our own AI entry)
  const conversations: any[] = chatStore.conversations.filter(
    (c: any) => c.type !== "ai",
  );

  // Check if current conversation is AI
  const isAiConversation = selectedConversation === AI_CONVERSATION_ID;

  const currentConversation = isAiConversation
    ? {
        id: AI_CONVERSATION_ID,
        type: "ai",
        name: "AI Financial Advisor",
        messages: aiMessages,
      }
    : conversations.find(
        (c) =>
          c.id === (chatStore.currentConversationId || selectedConversation),
      );
  const messages: any[] = currentConversation?.messages || [];

  // Fetch AI conversation on mount
  const { data: aiConversation } = useQuery({
    queryKey: ["ai-conversation"],
    queryFn: async () => {
      try {
        const res = await aiAPI.getConversation();
        return res.data;
      } catch (error) {
        console.error("Failed to fetch AI conversation:", error);
        return null;
      }
    },
  });

  // Fetch AI messages when AI conversation is selected
  useEffect(() => {
    if (isAiConversation && aiConversation) {
      refetchAiMessages();
    }
  }, [isAiConversation, aiConversation, user?.id]);

  // Helper to fetch and format AI messages from database
  const refetchAiMessages = async () => {
    try {
      const res = await aiAPI.getMessages();
      const msgs = res.data?.messages || [];
      const formattedMsgs = msgs.map((msg: any) => {
        const isAiMessage =
          msg.ai_sender_id === "ai-assistant" ||
          msg.sender?.id === "ai-assistant" ||
          (!msg.sender && msg.ai_sender_id);

        return {
          id: msg.id,
          content: msg.content,
          sender: isAiMessage ? "ai-assistant" : user?.id,
          senderName: isAiMessage ? "AI Financial Advisor" : "You",
          sent_at: msg.sent_at || msg.created_at,
          status: "read",
        };
      });
      setAiMessages(formattedMsgs);
    } catch (error) {
      console.error("Failed to refetch AI messages:", error);
    }
  };

  // AI chat mutation
  const aiChatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await aiAPI.chat(message);
      return res.data;
    },
    onSuccess: async (data) => {
      // Refetch messages from database to get properly stored messages
      await refetchAiMessages();

      // Show toast for specific actions
      if (data.action === "created") {
        toast({
          title: "Success!",
          description: "Your request was completed successfully.",
        });
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["budgets"] });
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to get AI response",
        variant: "destructive",
      });
    },
  });

  // Fetch connections for group chat creation
  const { data: connections = [] } = useQuery({
    queryKey: ["connections"],
    queryFn: () =>
      connectionsAPI
        .getConnections()
        .then((res) => res.data)
        .catch(() => []),
  });

  // Get connected users (status === "connected")
  const connectedUsers = connections
    .filter((conn: any) => conn.status === "connected")
    .map((conn: any) => {
      const otherUser =
        conn.requester.id === user?.id ? conn.receiver : conn.requester;
      return {
        id: otherUser.id,
        name: otherUser.name || otherUser.username,
        username: otherUser.username,
        email: otherUser.email,
      };
    });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read in real-time when conversation is open
  useEffect(() => {
    const convId = chatStore.currentConversationId || selectedConversation;
    if (convId && currentConversation) {
      // Mark all unread messages as read when viewing
      const unreadMessages = currentConversation.messages.filter(
        (msg) =>
          msg.sender !== chatStore.currentUserId && msg.status !== "read",
      );

      if (unreadMessages.length > 0) {
        // Mark locally
        chatStore.markAsRead(convId);
        // Notify server to mark as read and update sender
        socket?.emit("mark_as_read", { conversationId: convId });
      }
    }
  }, [
    chatStore.currentConversationId,
    selectedConversation,
    currentConversation,
    messages,
    socket,
  ]);

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);

    // Handle AI conversation separately
    if (id === AI_CONVERSATION_ID) {
      chatStore.setCurrentConversation("");
      return;
    }

    if (isValidId(id)) {
      // First, clear the current conversation to force a fresh render
      chatStore.setCurrentConversation("");

      // Clear messages immediately for the target conversation
      const conv = chatStore.conversations.find((c) => c.id === id);
      if (conv) {
        conv.messages = [];
        conv.page = 1;
        conv.total = 0;
      }

      // Small delay to ensure state updates
      setTimeout(() => {
        chatStore.setCurrentConversation(id);
        socket?.emit("join_conversation", { conversationId: id });
        socket?.emit("get_messages", {
          conversationId: id,
          page: 1,
          limit: 50,
        });
        // Mark as read both locally and on server
        chatStore.markAsRead(id);
        socket?.emit("mark_as_read", { conversationId: id });
      }, 50);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const sanitized = sanitizeText(messageText);
    if (!isValidMessage(sanitized)) {
      setSendError("Invalid message");
      return;
    }

    // Handle AI conversation separately
    if (isAiConversation) {
      // Add user message to local state immediately
      const userMessage = {
        id: Date.now().toString(),
        content: sanitized,
        sender: user?.id || "user",
        senderName: "You",
        sent_at: new Date().toISOString(),
        status: "sent",
      };
      setAiMessages((prev) => [...prev, userMessage]);
      setMessageText("");
      setIsAiLoading(true);

      // Send to AI
      aiChatMutation.mutate(sanitized, {
        onSettled: () => setIsAiLoading(false),
      });
      return;
    }

    const convId = chatStore.currentConversationId || selectedConversation;

    // Validate connection for direct conversations
    if (currentConversation?.type === "direct" && user) {
      const otherParticipant = currentConversation.participants?.find(
        (p: any) => {
          const pId = typeof p === "string" ? p : p?.id;
          return pId && pId !== user.id;
        },
      );

      if (otherParticipant) {
        const otherUserId =
          typeof otherParticipant === "string"
            ? otherParticipant
            : otherParticipant?.id;
        const isConnected = connections.some((conn: any) => {
          const isRequester =
            conn.requester?.id === otherUserId && conn.receiver?.id === user.id;
          const isReceiver =
            conn.receiver?.id === otherUserId && conn.requester?.id === user.id;
          return (isRequester || isReceiver) && conn.status === "connected";
        });

        if (!isConnected) {
          toast({
            title: "Connection Required",
            description: "You are no longer connected with this user.",
            variant: "destructive",
          });
          return;
        }
      }
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

    // Optimistically update UI
    if (convId) {
      chatStore.addMessage(convId, newMessage);
    }

    // Emit to socket
    if (convId) {
      socket?.emit("send_message", {
        conversation_id: convId,
        content: sanitized,
      });
    }

    setMessageText("");
    setSendError(null);
  };

  const formatMessageTime = (ts: string | Date | undefined) => {
    if (!ts) return "";
    try {
      const date = typeof ts === "string" ? new Date(ts) : ts;
      if (isNaN(date.getTime())) return "";
      if (isToday(date)) return format(date, "p");
      if (isYesterday(date)) return "Yesterday";
      return format(date, "MMM d");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 10 && !isLoadingMore && currentConversation) {
      const { page, total, limit } = currentConversation;
      const hasMore = page * limit < total;
      if (hasMore && selectedConversation) {
        setIsLoadingMore(true);
        socket?.emit("get_messages", {
          conversationId: selectedConversation,
          page: page + 1,
          limit: limit,
        });
        setTimeout(() => setIsLoadingMore(false), 1000);
      }
    }
  };

  const getConversationDisplayName = (conv: any) => {
    // Use the store's method which properly handles participant filtering
    return chatStore.getConversationDisplayName(conv);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleToggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleCreateGroup = async () => {
    // Validate inputs
    if (!groupName.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for the group chat.",
        variant: "destructive",
      });
      return;
    }

    if (selectedParticipants.length < 2) {
      toast({
        title: "Not enough participants",
        description: "Please select at least 2 people for the group chat.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingGroup(true);
    try {
      console.log("Creating group chat:", {
        name: groupName.trim(),
        type: "group",
        participant_ids: selectedParticipants,
      });

      const res = await conversationsAPI.createConversation({
        name: groupName.trim(),
        type: "group",
        participant_ids: selectedParticipants,
      });

      console.log("Group chat created:", res.data);

      toast({
        title: "Group chat created",
        description: `"${groupName}" group chat has been created successfully.`,
      });

      // Close dialog and reset
      setShowCreateGroup(false);
      setGroupName("");
      setSelectedParticipants([]);

      // Wait a bit for the backend to fully create the conversation
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Refresh conversations list from server
      const conversationsRes = await conversationsAPI.getConversations();
      if (conversationsRes.data) {
        console.log(
          "Refreshed conversations after group creation:",
          conversationsRes.data,
        );
        chatStore.setConversationsFromServer(conversationsRes.data);

        // Log the newly created conversation
        const newConv = conversationsRes.data.find(
          (c: any) => c.id === res.data.id,
        );
        if (newConv) {
          console.log("New group conversation data:", {
            id: newConv.id,
            name: newConv.name,
            participants: newConv.participants,
            participantCount: newConv.participants?.length,
          });
        }
      }

      // Also request via socket
      socket?.emit("get_conversations");

      // Open the new conversation with completely fresh state
      if (res.data?.id) {
        // Force clear any cached data
        const newConvId = res.data.id;

        setTimeout(() => {
          // Find the conversation again after refresh
          const newConv = chatStore.conversations.find(
            (c) => c.id === newConvId,
          );
          if (newConv) {
            // Ensure it starts with empty messages
            newConv.messages = [];
            newConv.page = 1;
            newConv.total = 0;
          }

          // Select and join the conversation
          handleSelectConversation(newConvId);
        }, 300);
      }
    } catch (error: any) {
      console.error("Error creating group chat:", error);
      toast({
        title: "Failed to create group",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const renderMessage = (message: any) => {
    const isAiMessage = message.sender === "ai-assistant";
    const isOwn =
      !isAiMessage &&
      (message.sender === chatStore.currentUserId ||
        message.sender === "user_1" ||
        message.sender === user?.id);
    const isSystem = message.isSystem;
    const isGroup = currentConversation?.type === "group";
    const senderName = isAiMessage
      ? "AI Financial Advisor"
      : message.senderName || "Unknown";

    return (
      <div
        key={message.id}
        className={cn("flex mb-4", isOwn ? "justify-end" : "justify-start")}
      >
        <div
          className={cn(
            "flex max-w-[70%] gap-2",
            isOwn ? "flex-row-reverse" : "flex-row",
          )}
        >
          {!isOwn && !isSystem && (
            <Avatar
              className={cn(
                "w-8 h-8 mt-1",
                isAiMessage &&
                  "bg-gradient-to-br from-purple-500 to-indigo-600",
              )}
            >
              <AvatarFallback
                className={cn(
                  "text-xs",
                  isAiMessage &&
                    "bg-gradient-to-br from-purple-500 to-indigo-600 text-white",
                )}
              >
                {isAiMessage ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  senderName.charAt(0).toUpperCase()
                )}
              </AvatarFallback>
            </Avatar>
          )}

          <div
            className={cn(
              "rounded-2xl px-4 py-2",
              isOwn
                ? "bg-primary text-primary-foreground"
                : isAiMessage
                  ? "bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100"
                  : isSystem
                    ? "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100"
                    : "bg-muted text-foreground",
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

            {/* Show sender name in group chats */}
            {isGroup && !isOwn && !isSystem && (
              <div className="text-xs font-semibold text-gray-700 mb-1">
                {senderName}
              </div>
            )}

            <div className="text-sm">{message.content}</div>

            <div
              className={cn(
                "flex items-center gap-1 mt-1 text-xs",
                isOwn
                  ? "justify-end text-white opacity-90"
                  : "justify-start text-gray-500",
              )}
            >
              <span>{formatMessageTime(message.sent_at)}</span>
              {isOwn && (
                <div className="ml-1">
                  {message.status === "read" ? (
                    <CheckCheck className="w-3 h-3 text-white opacity-90" />
                  ) : message.status === "delivered" ? (
                    <CheckCheck className="w-3 h-3 text-white opacity-90" />
                  ) : (
                    <Check className="w-3 h-3 text-white opacity-90" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Create AI conversation entry for the sidebar
  const aiConversationEntry = {
    id: AI_CONVERSATION_ID,
    type: "ai",
    name: "AI Financial Advisor",
    lastMessage:
      aiMessages.length > 0
        ? {
            content:
              aiMessages[aiMessages.length - 1]?.content?.substring(0, 50) +
              "...",
            timestamp: aiMessages[aiMessages.length - 1]?.sent_at,
          }
        : {
            content: "Ask me anything about your finances!",
            timestamp: new Date().toISOString(),
          },
    unreadCount: 0,
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    // For direct conversations, search by the other participant's name
    const displayName = getConversationDisplayName(conv).toLowerCase();
    // Also search in the stored name as fallback
    const storedName = (conv.name || "").toLowerCase();
    return (
      displayName.includes(searchLower) || storedName.includes(searchLower)
    );
  });

  // Add AI conversation at the top if matches search
  const allConversations = searchTerm
    ? aiConversationEntry.name.toLowerCase().includes(searchTerm.toLowerCase())
      ? [aiConversationEntry, ...filteredConversations]
      : filteredConversations
    : [aiConversationEntry, ...filteredConversations];

  // Auto-select conversation if navigated from connections
  useEffect(() => {
    const state = location.state as any;
    const navConvId = state?.conversationId as string | undefined;
    const userId = state?.userId as string | undefined;

    if (navConvId) {
      setTimeout(() => {
        handleSelectConversation(navConvId);
        setSelectedConversation(navConvId);
      }, 150);
    } else if (userId) {
      // Store userId to find conversation when it loads
      setPendingUserId(userId);

      // Try to find existing conversation immediately if already loaded
      if (conversations.length > 0) {
        const existingConv = conversations.find((conv) => {
          if (conv.type !== "direct") return false;
          const participants = conv.participants || [];
          return participants.some(
            (p: any) => p.id === userId || p.user_id === userId,
          );
        });

        if (existingConv) {
          setTimeout(() => {
            handleSelectConversation(existingConv.id);
            setSelectedConversation(existingConv.id);
            setPendingUserId(null);
          }, 150);
        }
      }
    }

    // Also fetch list via socket (optional, REST also used in hook)
    socket?.emit("get_conversations");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Auto-select conversation when conversations list is updated and we have a pending selection from navigation
  useEffect(() => {
    if (!pendingUserId || conversations.length === 0) return;

    // Find conversation with the pending user
    const existingConv = conversations.find((conv) => {
      if (conv.type !== "direct") return false;
      const participants = conv.participants || [];
      return participants.some(
        (p: any) => p.id === pendingUserId || p.user_id === pendingUserId,
      );
    });

    if (existingConv) {
      // Use a slight delay to ensure the conversation is fully loaded in chatStore
      setTimeout(() => {
        handleSelectConversation(existingConv.id);
        setSelectedConversation(existingConv.id);

        // Force message fetch
        if (socket) {
          socket.emit("get_messages", {
            conversationId: existingConv.id,
            page: 1,
            limit: 50,
          });
        }

        setPendingUserId(null);
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, pendingUserId]);

  return (
    <div className="h-full flex bg-background">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Conversations
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700"
                >
                  {conversations.length}
                </Badge>
                {conversations.filter((c) => c.unreadCount > 0).length > 0 && (
                  <Badge
                    variant="default"
                    className="bg-red-500 text-white ml-1"
                  >
                    {conversations.filter((c) => c.unreadCount > 0).length}{" "}
                    unread
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateGroup(true)}
                title="Create Group Chat"
              >
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
              <div className="space-y-1 px-3 py-2">
                {allConversations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No conversations found.
                  </div>
                ) : (
                  allConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={cn(
                        "px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50",
                        selectedConversation === conversation.id &&
                          "bg-primary/10 border border-primary/20 shadow-sm",
                        conversation.type === "ai" &&
                          "border-l-4 border-l-purple-500",
                      )}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="relative flex-shrink-0">
                          <Avatar
                            className={cn(
                              "w-11 h-11 border-2 border-background shadow-sm",
                              conversation.type === "ai" &&
                                "bg-gradient-to-br from-purple-500 to-indigo-600",
                            )}
                          >
                            <AvatarFallback
                              className={cn(
                                "bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold",
                                conversation.type === "ai" &&
                                  "bg-gradient-to-br from-purple-500 to-indigo-600 text-white",
                              )}
                            >
                              {conversation.type === "ai" ? (
                                <Sparkles className="w-5 h-5" />
                              ) : conversation.type === "group" ? (
                                <Users className="w-5 h-5" />
                              ) : (
                                (
                                  getConversationDisplayName(conversation) ||
                                  "?"
                                )
                                  .charAt(0)
                                  .toUpperCase()
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                              <span className="text-[10px] font-bold text-primary-foreground">
                                {conversation.unreadCount > 9
                                  ? "9+"
                                  : conversation.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm truncate flex-1 pr-2">
                              {getConversationDisplayName(conversation)}
                            </h4>
                          </div>

                          {conversation.lastMessage && (
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground truncate flex-1">
                                {conversation.lastMessage.content}
                              </p>
                              <span className="text-[10px] text-muted-foreground flex-shrink-0 font-medium">
                                {formatMessageTime(
                                  conversation.lastMessage.timestamp,
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Avatar
                    className={cn(
                      "w-10 h-10",
                      isAiConversation &&
                        "bg-gradient-to-br from-purple-500 to-indigo-600",
                    )}
                  >
                    <AvatarFallback
                      className={cn(
                        isAiConversation &&
                          "bg-gradient-to-br from-purple-500 to-indigo-600 text-white",
                      )}
                    >
                      {isAiConversation ? (
                        <Sparkles className="w-5 h-5" />
                      ) : currentConversation.type === "group" ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        (
                          getConversationDisplayName(currentConversation) || "?"
                        ).charAt(0)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    {isAiConversation ? (
                      <h3 className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                        AI Financial Advisor
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs"
                        >
                          AI Powered
                        </Badge>
                      </h3>
                    ) : currentConversation.type === "group" ? (
                      <h3
                        className="font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => setShowGroupMembers(true)}
                        title="Click to view group members"
                      >
                        {getConversationDisplayName(currentConversation)}
                      </h3>
                    ) : (
                      <h3 className="font-semibold">
                        {getConversationDisplayName(currentConversation)}
                      </h3>
                    )}
                    <p className="text-sm text-gray-600">
                      {isAiConversation
                        ? "I can help you manage finances, create budgets, and more!"
                        : currentConversation.type === "group" &&
                            currentConversation.participants
                          ? (() => {
                              const totalMembers =
                                currentConversation.participants.length;
                              return `${totalMembers} member${
                                totalMembers !== 1 ? "s" : ""
                              } • Click name to view`;
                            })()
                          : ""}
                    </p>
                  </div>
                </div>

                {/* Call/video buttons removed; keep optional badge if needed */}
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-2 overflow-hidden">
                <ScrollArea
                  className="h-[calc(100vh-20rem)]"
                  onScrollCapture={handleScroll}
                >
                  <div className="space-y-2">
                    {isLoadingMore && (
                      <div className="text-center text-muted-foreground py-2 text-sm">
                        Loading more messages...
                      </div>
                    )}
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        {isAiConversation ? (
                          <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                              <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-2">
                                AI Financial Advisor
                              </h3>
                              <p className="text-sm max-w-sm mx-auto">
                                I can help you manage your finances! Try asking
                                me to:
                              </p>
                              <ul className="text-sm mt-3 space-y-1 text-left max-w-xs mx-auto">
                                <li>• "Create a $500 budget for groceries"</li>
                                <li>• "Add a $50 expense for lunch"</li>
                                <li>• "Send a message to John about dinner"</li>
                                <li>• "How can I save more money?"</li>
                              </ul>
                            </div>
                          </div>
                        ) : (
                          "No messages yet."
                        )}
                      </div>
                    ) : (
                      messages.map(renderMessage)
                    )}
                    {isAiLoading && (
                      <div className="flex justify-start mb-4">
                        <div className="flex max-w-[70%] gap-2">
                          <Avatar className="w-8 h-8 mt-1 bg-gradient-to-br from-purple-500 to-indigo-600">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                              <Sparkles className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="rounded-2xl px-4 py-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                              <span className="text-sm text-purple-700 dark:text-purple-300">
                                Thinking...
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-2 border-t border-gray-200">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        isAiConversation
                          ? "Ask me anything about your finances..."
                          : "Type a message..."
                      }
                      className={cn(
                        "resize-none",
                        isAiConversation &&
                          "border-purple-300 focus:border-purple-500",
                      )}
                      disabled={isAiLoading}
                    />
                  </div>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 right-0 z-50">
                        <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          theme={
                            (theme === "dark" ||
                            (theme === "system" &&
                              window.matchMedia("(prefers-color-scheme: dark)")
                                .matches)
                              ? "dark"
                              : "light") as import("emoji-picker-react").Theme
                          }
                          searchDisabled
                          previewConfig={{ showPreview: false }}
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    className={cn(
                      "bg-blue-600 hover:bg-blue-700",
                      isAiConversation && "bg-purple-600 hover:bg-purple-700",
                    )}
                    disabled={!messageText.trim() || isAiLoading}
                  >
                    {isAiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
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

      {/* Create Group Chat Dialog */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Group Chat</DialogTitle>
            <DialogDescription>
              Select at least 2 people to start a group conversation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Group Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name</label>
              <Input
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Participants Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Participants ({selectedParticipants.length} selected)
              </label>
              <ScrollArea className="h-[300px] border rounded-md p-4">
                {connectedUsers.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No connections available</p>
                    <p className="text-xs mt-1">
                      Connect with people first to create a group chat
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {connectedUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleParticipant(user.id);
                        }}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                          selectedParticipants.includes(user.id)
                            ? "bg-blue-600 text-white border-2 border-blue-700 shadow-md"
                            : "hover:bg-gray-100 border-2 border-transparent",
                        )}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {(user.name || user.username || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "font-medium text-sm truncate",
                              selectedParticipants.includes(user.id)
                                ? "text-white"
                                : "",
                            )}
                          >
                            {user.name || user.username}
                          </p>
                          {user.name && (
                            <p
                              className={cn(
                                "text-xs truncate",
                                selectedParticipants.includes(user.id)
                                  ? "text-blue-100"
                                  : "text-muted-foreground",
                              )}
                            >
                              @{user.username}
                            </p>
                          )}
                        </div>
                        {selectedParticipants.includes(user.id) && (
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg">
                            <Check className="w-4 h-4 text-blue-600 font-bold" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateGroup(false);
                setGroupName("");
                setSelectedParticipants([]);
              }}
              disabled={isCreatingGroup}
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isCreatingGroup) return;
                if (selectedParticipants.length < 2) {
                  toast({
                    title: "Not enough participants",
                    description:
                      "Please select at least 2 people for the group chat.",
                    variant: "destructive",
                  });
                  return;
                }
                if (!groupName.trim()) {
                  toast({
                    title: "Group name required",
                    description: "Please enter a name for the group chat.",
                    variant: "destructive",
                  });
                  return;
                }
                handleCreateGroup();
              }}
              disabled={isCreatingGroup}
              className={cn(
                "min-w-[120px]",
                selectedParticipants.length < 2 || !groupName.trim()
                  ? "opacity-50"
                  : "bg-blue-600 hover:bg-blue-700 text-white",
              )}
              type="button"
            >
              {isCreatingGroup ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Members Dialog */}
      {currentConversation?.type === "group" && (
        <Dialog open={showGroupMembers} onOpenChange={setShowGroupMembers}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Group Members</DialogTitle>
              <DialogDescription>
                {currentConversation.participants?.length || 0} member
                {(currentConversation.participants?.length || 0) !== 1
                  ? "s"
                  : ""}{" "}
                in "{currentConversation.name || "this group"}"
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[300px] border rounded-md p-4">
              {currentConversation.participants &&
              currentConversation.participants.length > 0 ? (
                <div className="space-y-2">
                  {currentConversation.participants.map((participant: any) => {
                    const isCurrentUser =
                      participant.id === chatStore.currentUserId ||
                      participant.id === user?.id;
                    return (
                      <div
                        key={participant.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {(participant.name || participant.username || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {participant.name || participant.username}
                            {isCurrentUser && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (You)
                              </span>
                            )}
                          </p>
                          {participant.name && participant.username && (
                            <p className="text-xs text-muted-foreground truncate">
                              @{participant.username}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No members found</p>
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="flex justify-between items-center">
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    // API call to leave group
                    await conversationsAPI.leaveConversation(
                      currentConversation.id,
                    );

                    toast({
                      title: "Left group",
                      description: `You have left "${
                        currentConversation.name || "the group"
                      }"`,
                    });

                    // Remove conversation from local state
                    chatStore.conversations = chatStore.conversations.filter(
                      (c) => c.id !== currentConversation.id,
                    );

                    // Clear selection
                    setSelectedConversation(null);
                    chatStore.setCurrentConversation("");
                    setShowGroupMembers(false);

                    // Refresh conversations list
                    socket?.emit("get_conversations");
                  } catch (error: any) {
                    toast({
                      title: "Failed to leave group",
                      description:
                        error?.response?.data?.message || "Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="mr-auto"
              >
                Leave Group
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGroupMembers(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
});

export default ModernChatApp;
