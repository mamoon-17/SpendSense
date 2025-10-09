import React, { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

interface ChatWindowProps {
  messages: any[];
  onSend: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
  typingUsers: string[];
  currentUserId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSend,
  onTyping,
  typingUsers,
  currentUserId,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTyping(!!e.target.value);
  };
  const handleSend = () => {
    if (inputRef.current?.value) {
      onSend(inputRef.current.value);
      inputRef.current.value = "";
      onTyping(false);
    }
  };
  useEffect(() => {
    return () => onTyping(false);
  }, [onTyping]);
  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender === currentUserId}
          />
        ))}
        <TypingIndicator typingUsers={typingUsers} />
      </div>
      <div className="chat-input">
        <input
          ref={inputRef}
          type="text"
          onInput={handleInput}
          placeholder="Type a message..."
          maxLength={500}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;
