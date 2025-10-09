import React from "react";

interface TypingIndicatorProps {
  typingUsers: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (!typingUsers.length) return null;
  return (
    <div className="typing-indicator">
      {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...
    </div>
  );
};

export default TypingIndicator;
