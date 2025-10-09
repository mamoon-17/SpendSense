import React from "react";

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  return (
    <div className={`message-bubble${isOwn ? " own" : ""}`}>
      <div className="message-content">{message.content}</div>
      <div className="message-meta">
        <span className="sender">
          {isOwn ? "You" : message.senderName || message.sender}
        </span>
        <span className="timestamp">
          {new Date(message.sent_at).toLocaleTimeString()}
        </span>
        {message.status && (
          <span className={`status ${message.status.toLowerCase()}`}>
            {message.status}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
