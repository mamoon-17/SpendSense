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

      // Request online users when socket connects
      const handleConnect = () => {
        console.log("Socket connected, requesting online users");
        socket.emit("get_online_users");
      };
      
      socket.on("connect", handleConnect);

      // Also request immediately if already connected
      const requestOnlineUsers = () => {
        try {
          // Try to emit - socket.io will handle if not connected
          console.log("Requesting online users...");
          socket.emit("get_online_users");
        } catch (error) {
          console.error("Error requesting online users:", error);
        }
      };
      
      // Check immediately and after delays to catch connection
      setTimeout(requestOnlineUsers, 100);
      setTimeout(requestOnlineUsers, 500);
      setTimeout(requestOnlineUsers, 2000);

      // Socket event handlers
      socket.on("new_message", (msg: any) => {
        chatStore.addMessage(msg.conversation_id, msg, socket);
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
        const { messages, page, limit, total, conversationId } = payload || {};
        // Use conversationId from payload if available
        const targetConvId = conversationId || chatStore.currentConversationId;
        if (targetConvId) {
          chatStore.setMessagesForConversation(
            targetConvId,
            messages || [],
            page || 1,
            total || 0
          );
        }
      });
      socket.on("user_joined", (data: any) => {
        // Track user as online when they join a conversation
        // Only track if it's not the current user (though we shouldn't receive our own join event)
        if (data?.userId && data.userId !== user.id) {
          chatStore.addOnlineUser(data.userId);
        }
      });
      socket.on("user_left", (data: any) => {
        // Note: We don't remove online status on leave, as user might be in other conversations
        // Online status should be managed by connection/disconnection events
      });
      socket.on("user_online", (data: any) => {
        // Handle explicit online status updates
        console.log("Received user_online event:", data);
        if (data?.userId && data.userId !== user.id) {
          console.log("User came online:", data.userId);
          chatStore.addOnlineUser(data.userId);
        } else {
          console.log("Ignoring user_online for self or invalid data");
        }
      });
      socket.on("user_offline", (data: any) => {
        // Handle explicit offline status updates
        console.log("Received user_offline event:", data);
        if (data?.userId && data.userId !== user.id) {
          console.log("User went offline:", data.userId);
          chatStore.removeOnlineUser(data.userId);
        } else {
          console.log("Ignoring user_offline for self or invalid data");
        }
      });
      socket.on("online_users", (data: any) => {
        // Handle list of online users
        console.log("Received online_users event:", data);
        if (Array.isArray(data?.userIds)) {
          console.log("Setting online users list:", data.userIds);
          chatStore.setOnlineUsers(data.userIds);
        } else {
          console.warn("Invalid online_users data:", data);
        }
      });
      socket.on("messages_marked_read", (data: any) => {
        // Server confirmed messages were marked as read
        if (data?.conversationId) {
          chatStore.markAsRead(data.conversationId);
        }
      });
      socket.on("message_status_update", (data: any) => {
        // Handle message status updates (e.g., when recipient reads a message)
        if (data?.conversationId && data?.messageId && data?.status) {
          chatStore.updateMessageStatus(
            data.conversationId,
            data.messageId,
            data.status
          );
        }
      });
      // Online users list is automatically sent on connection by the backend
      // ...other event handlers
    }
    return () => {
      socket?.disconnect();
    };
  }, [token, user]);

  return { chatStore, socket };
}
