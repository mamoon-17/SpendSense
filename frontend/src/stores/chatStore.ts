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
            id: p.id,
            name: p.name || p.username,
            username: p.username || p.name,
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
    // Preserve existing messages and pagination if we already have a conversation cached
    this.conversations = mapped.map((conv) => {
      const existing = this.conversations.find((c) => c.id === conv.id);
      return existing
        ? {
            ...conv,
            messages: existing.messages,
            page: existing.page,
            total: existing.total,
          }
        : conv;
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

  addMessage(conversationId: string, message: any) {
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

    if (normalized.sender !== this.currentUserId) {
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    }

    // Re-sort conversations
    this.sortConversations();
  }

  markAsRead(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.unreadCount = 0;
    }
  }

  setTypingUsers(users: string[]) {
    this.typingUsers = users;
  }

  setCurrentUserId(id: string) {
    this.currentUserId = id;
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
