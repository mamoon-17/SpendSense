import React, { useEffect } from "react";
import ModernChatApp from "../components/chat/ModernChatApp";

export const Messages: React.FC = () => {
  useEffect(() => {
    document.title = "Messages - SpendSense";
  }, []);

  return <ModernChatApp />;
};
