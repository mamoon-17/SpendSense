import React, { useEffect } from "react";
import ModernChatApp from "../components/chat/ModernChatApp";
import { PageTransition } from "@/components/layout/PageTransition";

export const Messages: React.FC = () => {
  useEffect(() => {
    document.title = "Messages - SpendSense";
  }, []);

  return (
    <PageTransition>
      <ModernChatApp />
    </PageTransition>
  );
};
