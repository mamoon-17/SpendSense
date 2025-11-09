import { io, Socket } from "socket.io-client";

export class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  constructor(token: string) {
    this.token = token;
    this.connect();
  }

  connect() {
    if (!this.token)
      throw new Error("JWT token required for socket connection");
    const apiWsEnv = (import.meta as any).env?.VITE_API_WS_URL as
      | string
      | undefined;
    const apiHttpEnv = (import.meta as any).env?.VITE_API_URL as
      | string
      | undefined;
    // Derive WS base from API URL if WS URL not provided
    const derivedBase = apiHttpEnv
      ? apiHttpEnv.replace(/\/?api\/?$/, "")
      : "http://localhost:3000";
    const baseUrl = apiWsEnv || derivedBase;

    this.socket = io(baseUrl, {
      auth: { token: this.token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Let socket.io choose best transport; polling fallback avoids premature close
      // transports: ["websocket"],
      withCredentials: true,
      path: "/socket.io",
    });
    this.registerDefaultHandlers();
  }

  registerDefaultHandlers() {
    if (!this.socket) return;
    this.socket.on("connect", () => {
      // Connection established
      console.log("Socket connected", this.socket?.id);
    });
    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected", reason);
    });
    this.socket.on("connect_error", (err) => {
      console.error("Socket connect_error", err?.message || err);
    });
    this.socket.on("error", (err) => {
      console.error("Socket error", err);
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  on(event: string, handler: (...args: any[]) => void) {
    this.socket?.on(event, handler);
  }

  off(event: string, handler?: (...args: any[]) => void) {
    this.socket?.off(event, handler);
  }

  emit(event: string, ...args: any[]) {
    this.socket?.emit(event, ...args);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export default SocketService;
