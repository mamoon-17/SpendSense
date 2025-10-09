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
    this.socket = io(import.meta.env.VITE_API_WS_URL, {
      auth: { token: this.token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket"],
    });
    this.registerDefaultHandlers();
  }

  registerDefaultHandlers() {
    if (!this.socket) return;
    this.socket.on("connect", () => {
      // Connection established
    });
    this.socket.on("disconnect", (reason) => {
      // Handle disconnect
    });
    this.socket.on("connect_error", (err) => {
      // Handle connection error
    });
    this.socket.on("error", (err) => {
      // Handle server error
    });
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
