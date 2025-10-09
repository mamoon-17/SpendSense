import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import { useChat } from "../../hooks/useChat";
import { sanitizeText } from "../../utils/sanitize";
import { isValidId, isValidMessage } from "../../utils/validate";

const ChatApp: React.FC = observer(() => {
  const { chatStore, socket } = useChat();
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSelectConversation = (id: string) => {
    if (isValidId(id)) {
      chatStore.setCurrentConversation(id);
      socket?.emit("join_conversation", { conversationId: id });
      chatStore.markAsRead(id);
    }
  };

  const handleSend = (text: string) => {
    const sanitized = sanitizeText(text);
    if (!isValidMessage(sanitized)) {
      setSendError("Invalid message");
      return;
    }
    if (!chatStore.currentConversationId) return;
    socket?.emit("send_message", {
      conversation_id: chatStore.currentConversationId,
      content: sanitized,
    });
    setSendError(null);
  };

  const handleTyping = (isTyping: boolean) => {
    if (!chatStore.currentConversationId) return;
    socket?.emit("typing", {
      conversationId: chatStore.currentConversationId,
      isTyping,
    });
  };

  return (
    <div className="chat-app">
      <ConversationList
        conversations={chatStore.conversations}
        currentConversationId={chatStore.currentConversationId}
        onSelect={handleSelectConversation}
      />
      <ChatWindow
        messages={
          chatStore.conversations.find(
            (c) => c.id === chatStore.currentConversationId
          )?.messages || []
        }
        onSend={handleSend}
        onTyping={handleTyping}
        typingUsers={chatStore.typingUsers}
        currentUserId={chatStore.currentUserId}
      />
      {sendError && <div className="error">{sendError}</div>}
    </div>
  );
});

export default ChatApp;
