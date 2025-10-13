import { useEffect } from "react";
import chatStore from "../stores/chatStore";
import SocketService from "../services/socketService";
import { useAuthStore } from "../stores/authStore";
import { conversationsAPI } from "@/lib/api";

let socket: SocketService | null = null;

export function useChat() {
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (token && user) {
      socket = new SocketService(token);
      chatStore.setCurrentUserId(user.id);
      // Initial conversations fetch via REST
      conversationsAPI
        .getConversations()
        .then((res) => {
          chatStore.setConversationsFromServer(res.data || []);
        })
        .catch(() => {});

      // Socket event handlers
      socket.on("new_message", (msg: any) => {
        chatStore.addMessage(msg.conversation_id, msg);
      });
      socket.on("user_typing", (data: any) => {
        chatStore.setTypingUsers(data.users || []);
      });
      socket.on("joined_conversation", ({ conversationId }: any) => {
        chatStore.setCurrentConversation(conversationId);
      });
      socket.on("conversations_list", ({ conversations }: any) => {
        chatStore.setConversationsFromServer(conversations || []);
      });
      socket.on("message_history", (payload: any) => {
        const { messages, page, limit, total } = payload || {};
        // We assume last requested conversationId is current selection
        if (chatStore.currentConversationId) {
          chatStore.setMessagesForConversation(
            chatStore.currentConversationId,
            messages || []
          );
        }
      });
      socket.on("user_joined", () => {});
      socket.on("user_left", () => {});
      // ...other event handlers
    }
    return () => {
      socket?.disconnect();
    };
  }, [token, user]);

  return { chatStore, socket };
}
