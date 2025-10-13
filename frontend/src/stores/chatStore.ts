import { makeAutoObservable } from "mobx";

export interface Message {
  id: string;
  content: string;
  sender: string; // userId
  senderName?: string;
  sent_at: string;
  status?: string;
}

export interface Conversation {
  id: string;
  name?: string;
  type?: "direct" | "group";
  participants: string[]; // userIds
  unreadCount: number;
  messages: Message[];
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
        ? c.participants.map((p: any) => p.id)
        : [],
      unreadCount: typeof c.unread_count === "number" ? c.unread_count : 0,
      messages: [],
    }));
    // Preserve existing messages if we already have a conversation cached
    this.conversations = mapped.map((conv) => {
      const existing = this.conversations.find((c) => c.id === conv.id);
      return existing ? { ...conv, messages: existing.messages } : conv;
    });
  }

  // Set/replace messages for a conversation from server payload
  setMessagesForConversation(conversationId: string, serverMessages: any[]) {
    const conv = this.ensureConversation(conversationId);
    conv.messages = (serverMessages || []).map((m: any) => ({
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
    conv.messages.push(normalized);
    if (normalized.sender !== this.currentUserId) {
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    }
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
      };
      this.conversations.push(conv);
    }
    return conv;
  }
}

const chatStore = new ChatStore();
export default chatStore;
