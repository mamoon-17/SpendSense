import React from "react";

interface ConversationListProps {
  conversations: any[];
  currentConversationId: string | null;
  onSelect: (conversationId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelect,
}) => {
  return (
    <div className="conversation-list">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          className={`conversation-item${
            conv.id === currentConversationId ? " active" : ""
          }`}
          onClick={() => onSelect(conv.id)}
        >
          <span>{conv.title || conv.participants?.join(", ")}</span>
          {conv.unreadCount > 0 && (
            <span className="unread-badge">{conv.unreadCount}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
