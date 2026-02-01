import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  className,
  size = "md",
  text = "Loading...",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn("flex items-center justify-center space-x-2", className)}
    >
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <span className="text-muted-foreground">{text}</span>}
    </div>
  );
};

export const LoadingPage: React.FC = () => {
  const [showExtendedMessage, setShowExtendedMessage] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    // Show extended message after 5 seconds (cold start indicator)
    const extendedTimer = setTimeout(() => {
      setShowExtendedMessage(true);
    }, 5000);

    // Update loading time every second
    const interval = setInterval(() => {
      setLoadingTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(extendedTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="relative">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          {showExtendedMessage && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 rounded-full animate-pulse" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Loading SpendSense
          </h2>
          <p className="text-muted-foreground mt-1">
            {showExtendedMessage
              ? "The server is waking up. This may take up to 30 seconds on first load..."
              : "Please wait while we prepare your dashboard"}
          </p>
        </div>
        {showExtendedMessage && (
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${Math.min((loadingTime / 30) * 100, 95)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Using free tier hosting - cold starts may take up to 30 seconds
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// New component for inline loading states
export const LoadingCard: React.FC<{ message?: string }> = ({
  message = "Loading data...",
}) => {
  const [showExtendedMessage, setShowExtendedMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowExtendedMessage(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <div className="text-center">
        <p className="text-muted-foreground">{message}</p>
        {showExtendedMessage && (
          <p className="text-xs text-muted-foreground mt-2">
            Server is starting up, please wait...
          </p>
        )}
      </div>
    </div>
  );
};
