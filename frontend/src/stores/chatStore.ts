import { makeAutoObservable } from "mobx";

export interface Message {
  id: string;
  content: string;
  sender: string;
  senderName?: string;
  sent_at: string;
  status?: string;
}

export interface Conversation {
  id: string;
  title?: string;
  participants: string[];
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

  setConversations(convs: Conversation[]) {
    this.conversations = convs;
  }

  setCurrentConversation(id: string) {
    this.currentConversationId = id;
  }

  addMessage(conversationId: string, message: Message) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.messages.push(message);
      if (message.sender !== this.currentUserId) {
        conv.unreadCount += 1;
      }
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
}

const chatStore = new ChatStore();
export default chatStore;
