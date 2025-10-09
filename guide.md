# 🧩 Real-Time Chat Implementation Guide (NestJS + Socket.IO)

This document outlines the complete roadmap for integrating **real-time chatting** into your NestJS backend and React frontend using **Socket.IO**.
Your existing modules — `connections`, `messaging`, and `message-history` — will be central to this feature.

---

## 🚀 Overview

You’ll build a **real-time chat system** where connected users can:

- Start and join conversations
- Send and receive messages instantly
- See typing indicators, online status, and message history
- Persist messages in the database

---

## ⚙️ Phase 1: Setup & Dependencies

### 1.1 Install Backend Dependencies

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install -D @types/socket.io
```

### 1.2 Install Frontend Dependencies

```bash
# In frontend directory
npm install socket.io-client
```

---

## 🧱 Phase 2: Backend Socket Infrastructure

### 2.1 Create a Chat Gateway

**File:** `src/modules/chat/chat.gateway.ts`

- Decorate with `@WebSocketGateway({ cors: { origin: '*' } })`
- Handle `handleConnection` and `handleDisconnect`
- Authenticate socket connections using JWT
- Set up event listeners (e.g., `message`, `typing`, `join_conversation`)

### 2.2 Create Chat Module

**File:** `src/modules/chat/chat.module.ts`

- Import `ConversationsModule`, `MessageHistoryModule`, `ConnectionsModule`
- Provide and export `ChatGateway`

### 2.3 Register in App Module

```typescript
imports: [ChatModule, ...otherModules];
```

---

## 💬 Phase 3: Real-Time Messaging Logic

### 3.1 Update Message History Service

- Add methods to:

  - Create a message in real-time
  - Fetch message history with pagination
  - Support typing indicators and message delivery states

### 3.2 Update Conversations Service

- Add:

  - Fetch active conversations for a user
  - Create new conversations between connected users
  - Track last message and unread count

### 3.3 Connections Integration

- Ensure only **connected users** (status = Connected) can start chats
- Validate both users before creating or sending messages

---

## ⚡ Phase 4: Socket Event Handlers

### 4.1 Implement Core Events

| Event                | Description                      |
| -------------------- | -------------------------------- |
| `join_conversation`  | User joins a chat room           |
| `leave_conversation` | User leaves a room               |
| `send_message`       | Send a message to a conversation |
| `typing_start`       | User starts typing               |
| `typing_stop`        | User stops typing                |
| `get_conversations`  | Get user’s conversation list     |
| `get_messages`       | Fetch message history            |
| `mark_as_read`       | Mark messages as read            |

### 4.2 Room Management

- Each conversation is its own socket room
- Handle joins/leaves dynamically
- Broadcast online/offline and typing updates

---

## 🗃️ Phase 5: Database Enhancements

### 5.1 Extend Entities

Update entities with useful columns:

- **Conversation**

  - `last_message_at`
  - `unread_count`

- **Message**

  - `is_read`
  - `delivered_at`

Add database indexes for performance (especially on `conversation_id`).

### 5.2 Create DTOs

| DTO                   | Purpose                             |
| --------------------- | ----------------------------------- |
| `SendMessageDto`      | Send new message data               |
| `JoinConversationDto` | Identify conversation on join       |
| `ConversationListDto` | Return list of user’s conversations |
| `MessageHistoryDto`   | Return paginated message history    |

---

## 🧠 Phase 6: Frontend Integration

### 6.1 Create Socket Service

**File:** `src/services/socketService.ts`

- Manage socket connection lifecycle
- Pass JWT token for authentication
- Handle automatic reconnection and error events

### 6.2 Build Chat Components

| Component          | Role                       |
| ------------------ | -------------------------- |
| `ConversationList` | Show all active chats      |
| `ChatWindow`       | Display and send messages  |
| `MessageBubble`    | Render individual messages |
| `TypingIndicator`  | Show when user is typing   |
| `StatusIndicator`  | Online/offline badges      |

### 6.3 Manage State

- Store chat state (current conversation, unread counts)
- Implement optimistic UI updates
- Handle live updates on message reception and read receipts

---

## 🔒 Phase 7: Security & Validation

### 7.1 Authentication & Authorization

- Verify JWT on socket handshake
- Check if user belongs to the conversation before sending messages
- Rate-limit message sending to prevent spam

### 7.2 Input Validation

- Sanitize text messages
- Validate conversation and message IDs
- Enforce message length limits

---

## 🧪 Phase 8: Testing & Polish

### 8.1 Test Cases

- Multiple users chatting in same conversation
- Reconnection after network loss
- Message persistence verification
- Typing and read receipt behavior

### 8.2 Error Handling

- Gracefully handle disconnects
- Show retry options
- Provide user feedback for failed sends

### 8.3 Performance Optimizations

- Add message pagination & lazy loading
- Optimize SQL queries
- Cache recent conversations if needed

---

## 🧭 Recommended Implementation Order

| Step | Focus                              | Priority      |
| ---- | ---------------------------------- | ------------- |
| 1    | Phase 1–2: Setup + Gateway         | ✅ Start Here |
| 2    | Phase 3: Core Services             | 🔥 Next       |
| 3    | Phase 4: Socket Events             | 💬            |
| 4    | Phase 6.1: Frontend Socket Service | 🧠            |
| 5    | Phase 6.2: Basic Chat UI           | 🎨            |
| 6    | Phase 5: DB Enhancements           | 🗃️            |
| 7    | Phase 7–8: Security + Polish       | 🧹            |

---

## 🗂️ Key Files to Create

### Backend

```
src/modules/chat/
 ├── chat.gateway.ts
 ├── chat.module.ts
 └── dtos/
      ├── sendMessage.dto.ts
      ├── joinConversation.dto.ts
      └── ...
```

### Frontend

```
src/services/socketService.ts
src/components/chat/
 ├── ConversationList.jsx
 ├── ChatWindow.jsx
 ├── MessageBubble.jsx
 └── TypingIndicator.jsx
```

---

## ✅ Summary

This roadmap takes you from setup to a full real-time chat experience:

- **Backend:** NestJS Gateway + TypeORM integration
- **Frontend:** Socket.IO client + reactive chat UI
- **Security:** Authenticated sockets & permission checks
- **Extras:** Typing, read receipts, pagination
