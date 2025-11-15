import { makeAutoObservable } from "mobx";

export interface Message {
  id: string;
  content: string;
  sender: string; // userId
  senderName?: string;
  sent_at: string;
  status?: string;
}

export interface Participant {
  id: string;
  name: string;
  username: string;
}

export interface Conversation {
  id: string;
  name?: string;
  type?: "direct" | "group";
  participants: Participant[]; // Full participant objects
  unreadCount: number;
  messages: Message[];
  lastMessage?: Message;
  lastActivity?: string;
  page: number;
  total: number;
  limit: number;
}

class ChatStore {
  conversations: Conversation[] = [];
  currentConversationId: string | null = null;
  typingUsers: string[] = [];
  currentUserId: string = "";
  onlineUsers: Set<string> = new Set(); // Track online user IDs
  _onlineUsersArray: string[] = []; // Observable array for MobX tracking

  constructor() {
    makeAutoObservable(this);
  }

  // Replace all conversations with mapped ones from server objects
  setConversationsFromServer(serverConvs: any[]) {
    const mapped: Conversation[] = serverConvs.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      participants: Array.isArray(c.participants)
        ? c.participants.map((p: any) => ({
            id: p.id || p.user_id, // Handle both id and user_id
            name: p.name || p.username || "",
            username: p.username || p.name || "",
          }))
        : [],
      unreadCount: typeof c.unread_count === "number" ? c.unread_count : 0,
      lastMessage: c.last_message
        ? {
            id: c.last_message.id,
            content: c.last_message.content,
            sender: c.last_message.sender?.id || c.last_message.sender,
            sent_at: c.last_message.sent_at || c.last_message.created_at,
            status: c.last_message.status,
          }
        : undefined,
      lastActivity: c.last_message_at || c.updated_at,
      messages: [],
      page: 1,
      total: 0,
      limit: 20,
    }));
    // Preserve existing messages and pagination ONLY if conversation already existed
    // AND was not just created (check if it has any messages or activity)
    this.conversations = mapped.map((conv) => {
      const existing = this.conversations.find((c) => c.id === conv.id);

      // If existing conversation found AND it has messages loaded, preserve them
      if (existing && existing.messages.length > 0) {
        return {
          ...conv,
          messages: existing.messages,
          page: existing.page,
          total: existing.total,
        };
      }

      // For new conversations or conversations without loaded messages, use fresh state
      return conv;
    });
    // Sort by lastActivity descending
    this.sortConversations();
  }

  // Set/replace messages for a conversation from server payload
  setMessagesForConversation(
    conversationId: string,
    serverMessages: any[],
    page: number = 1,
    total: number = 0
  ) {
    const conv = this.ensureConversation(conversationId);
    const normalized = (serverMessages || []).map((m: any) => ({
      id: m.id,
      content: m.content,
      sender: typeof m.sender === "object" ? m.sender.id : m.sender,
      senderName:
        typeof m.sender === "object"
          ? m.sender.name || m.sender.username
          : undefined,
      sent_at: m.sent_at,
      status: m.status,
    }));

    if (page === 1) {
      // First page, replace all messages
      conv.messages = normalized;
    } else {
      // Pagination: prepend older messages
      conv.messages = [...normalized, ...conv.messages];
    }
    conv.page = page;
    conv.total = total;
  }

  setConversations(convs: Conversation[]) {
    this.conversations = convs;
  }

  setCurrentConversation(id: string) {
    this.currentConversationId = id;
  }

  addMessage(conversationId: string, message: any, socket?: any) {
    const conv = this.ensureConversation(conversationId);
    const normalized: Message = {
      id: message.id,
      content: message.content,
      sender:
        typeof message.sender === "object" ? message.sender.id : message.sender,
      senderName:
        typeof message.sender === "object"
          ? message.sender.name || message.sender.username
          : undefined,
      sent_at: message.sent_at,
      status: message.status,
    };

    // Deduplication: replace optimistic "sending" messages
    const existingIndex = conv.messages.findIndex(
      (m) =>
        m.status === "sending" &&
        m.content === normalized.content &&
        m.sender === normalized.sender
    );

    if (existingIndex !== -1) {
      // Replace optimistic message
      conv.messages[existingIndex] = normalized;
    } else {
      // Add new message
      conv.messages.push(normalized);
    }

    // Update last message and activity
    conv.lastMessage = normalized;
    conv.lastActivity = normalized.sent_at;

    // Only increment unread count if:
    // 1. The message is from someone else (not the current user)
    // 2. The conversation is NOT currently open
    const isFromOtherUser = normalized.sender !== this.currentUserId;
    const isConversationOpen = this.currentConversationId === conversationId;

    if (isFromOtherUser && !isConversationOpen) {
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    } else if (isFromOtherUser && isConversationOpen) {
      // If conversation is open and message is from other user, mark as read immediately
      normalized.status = "read";
      // Notify server to mark as read
      if (socket) {
        socket.emit("mark_as_read", { conversationId });
      }
    }

    // Re-sort conversations
    this.sortConversations();
  }

  markAsRead(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.unreadCount = 0;
      // Also mark all messages in this conversation as read
      conv.messages.forEach((msg) => {
        if (msg.sender !== this.currentUserId && msg.status !== "read") {
          msg.status = "read";
        }
      });
    }
  }

  // Mark a specific message as read
  markMessageAsRead(conversationId: string, messageId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      const message = conv.messages.find((m) => m.id === messageId);
      if (message && message.sender !== this.currentUserId) {
        message.status = "read";
      }
    }
  }

  // Update message status (called when receiving status updates from server)
  updateMessageStatus(
    conversationId: string,
    messageId: string,
    status: string
  ) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      const message = conv.messages.find((m) => m.id === messageId);
      if (message) {
        message.status = status;
      }
      // Also update last message if it's the same message
      if (conv.lastMessage?.id === messageId) {
        conv.lastMessage.status = status;
      }
    }
  }

  setTypingUsers(users: string[]) {
    this.typingUsers = users;
  }

  setCurrentUserId(id: string) {
    this.currentUserId = id;
  }

  setOnlineUsers(userIds: string[]) {
    console.log("Setting online users in store:", userIds);
    const normalizedIds = userIds.map((id) => String(id).trim());
    this.onlineUsers = new Set(normalizedIds);
    this._onlineUsersArray = normalizedIds; // Update observable array for MobX
    console.log(
      "Online users set updated. Current online users:",
      Array.from(this.onlineUsers)
    );
  }

  addOnlineUser(userId: string) {
    const normalizedId = String(userId).trim();
    console.log("Adding online user:", normalizedId);
    this.onlineUsers.add(normalizedId);
    this._onlineUsersArray = Array.from(this.onlineUsers); // Update observable array
    console.log("Online users after add:", Array.from(this.onlineUsers));
  }

  removeOnlineUser(userId: string) {
    const normalizedId = String(userId).trim();
    console.log("Removing online user:", normalizedId);
    this.onlineUsers.delete(normalizedId);
    this._onlineUsersArray = Array.from(this.onlineUsers); // Update observable array
    console.log("Online users after remove:", Array.from(this.onlineUsers));
  }

  // Get the other participant for a direct conversation
  getOtherParticipant(conversation: Conversation): Participant | null {
    if (!conversation || conversation.type !== "direct") {
      return null;
    }

    if (
      !Array.isArray(conversation.participants) ||
      conversation.participants.length === 0
    ) {
      return null;
    }

    // Always filter out the current user to get the OTHER participant
    const currentUserIdStr = this.currentUserId
      ? String(this.currentUserId).trim()
      : null;

    if (currentUserIdStr) {
      // Filter out the current user and get the other participant(s)
      const others = conversation.participants.filter((p: Participant) => {
        if (!p || !p.id) return false;
        const participantIdStr = String(p.id).trim();
        return participantIdStr !== currentUserIdStr;
      });

      if (others.length > 0) {
        return others[0];
      }
    }

    // Fallback: if currentUserId is not set, and there are exactly 2 participants,
    // we can't determine which one is the "other", so return null
    // This should not happen in normal operation, but we handle it gracefully
    if (conversation.participants.length === 2 && !currentUserIdStr) {
      // Can't determine which is "other" without currentUserId
      return null;
    }

    // If only one participant and we have currentUserId, it means the other participant is missing
    // This is an edge case - return null
    if (conversation.participants.length === 1) {
      return null;
    }

    return null;
  }

  // Check if the other participant in a direct conversation is online
  isOtherParticipantOnline(conversation: Conversation): boolean {
    if (!conversation || conversation.type !== "direct") {
      return false;
    }
    const other = this.getOtherParticipant(conversation);
    if (!other || !other.id) {
      return false;
    }
    const otherId = String(other.id).trim();
    // Use the observable array to ensure MobX tracks this property
    const isOnline =
      this._onlineUsersArray.includes(otherId) || this.onlineUsers.has(otherId);

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("Checking online status:", {
        conversationId: conversation.id,
        otherParticipant: other.name || other.username,
        otherId,
        onlineUsersArray: this._onlineUsersArray,
        onlineUsersSet: Array.from(this.onlineUsers),
        isOnline,
      });
    }

    return isOnline;
  }

  // Get display name for a conversation (shows other participant for direct, name for group)
  getConversationDisplayName(conversation: Conversation): string {
    if (!conversation) return "Conversation";

    if (conversation.type === "direct") {
      const other = this.getOtherParticipant(conversation);
      if (other) {
        // Prefer name, then username, then fallback to conversation name
        return (
          other.name || other.username || conversation.name || "Unknown User"
        );
      }
      // Last resort: use conversation name if available, otherwise generic
      if (conversation.name && conversation.name !== "Direct Message") {
        // Try to extract name from conversation name like "Chat with John"
        const match = conversation.name.match(/Chat with (.+)/i);
        if (match && match[1]) {
          return match[1];
        }
        return conversation.name;
      }
      // Debug: Log when we can't find the other participant
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "Could not find other participant for direct conversation:",
          {
            conversationId: conversation.id,
            participants: conversation.participants,
            currentUserId: this.currentUserId,
            conversationName: conversation.name,
          }
        );
      }
      return "Direct Message";
    }

    return conversation.name || "Group Conversation";
  }

  sortConversations() {
    this.conversations.sort((a, b) => {
      const aTime = a.lastActivity || a.lastMessage?.sent_at || "";
      const bTime = b.lastActivity || b.lastMessage?.sent_at || "";
      return bTime.localeCompare(aTime);
    });
  }

  private ensureConversation(conversationId: string): Conversation {
    let conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) {
      conv = {
        id: conversationId,
        name: undefined,
        type: undefined,
        participants: [],
        unreadCount: 0,
        messages: [],
        page: 1,
        total: 0,
        limit: 20,
      };
      this.conversations.push(conv);
    }
    return conv;
  }
}

const chatStore = new ChatStore();
export default chatStore;
