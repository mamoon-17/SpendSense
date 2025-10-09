import { useEffect } from "react";
import chatStore from "../stores/chatStore";
import SocketService from "../services/socketService";
import { useAuthStore } from "../stores/authStore";

let socket: SocketService | null = null;

export function useChat() {
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (token && user) {
      socket = new SocketService(token);
      chatStore.setCurrentUserId(user.id);
      socket.on("new_message", (msg: any) => {
        chatStore.addMessage(msg.conversation_id, msg);
      });
      socket.on("user_typing", (data: any) => {
        chatStore.setTypingUsers(data.users || []);
      });
      socket.on("joined_conversation", ({ conversationId }: any) => {
        chatStore.setCurrentConversation(conversationId);
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
