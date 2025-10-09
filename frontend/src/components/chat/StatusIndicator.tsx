import React from "react";

interface StatusIndicatorProps {
  online: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ online }) => (
  <span className={`status-indicator${online ? " online" : " offline"}`}></span>
);

export default StatusIndicator;
