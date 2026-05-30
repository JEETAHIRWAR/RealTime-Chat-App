# Realtime Chat Application

A production-ready realtime messaging application built using Node.js, Express.js, MongoDB, Socket.IO, React.js, and JWT Authentication.

---

# Features

## Authentication

* User Registration
* User Login
* JWT Access Token Authentication
* Refresh Token Support
* Protected API Routes
* Socket Authentication
* Email OTP Verification

---

## Realtime Messaging

* One-to-One Chat
* Instant Message Delivery
* Realtime Message Updates
* Online/Offline Presence
* Typing Indicators
* Seen Status
* Delivered Status
* Multi-Tab Support
* Automatic Reconnection

---

## Chat History

* Persistent Message Storage
* Encrypted Messages in Database
* Pagination Support
* Infinite Scroll Ready
* Fast Conversation Loading
* Optimized Query Structure

---

## File Sharing

* Image Uploads
* Document Uploads
* File Preview Support
* Download Support
* Secure Upload Validation
* File Size Restrictions

---

## Security

* Password Hashing (bcrypt)
* JWT Authentication
* Refresh Token Validation
* Socket Authentication Middleware
* Protected Routes
* Input Validation
* File Validation
* Encrypted Message Storage

---

## Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO
* JWT
* bcryptjs
* Multer

### Frontend

* React.js
* Vite
* Tailwind CSS
* Socket.IO Client
* Zustand
* Axios
* Framer Motion

---

# Project Structure

## Backend

```text
backend/
│
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── conversation.controller.js
│   │   ├── message.controller.js
│   │   └── upload.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── upload.middleware.js
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── conversation.model.js
│   │   ├── message.model.js
│   │   └── otp.model.js
│   │
│   ├── repositories/
│   │   ├── conversation.repository.js
│   │   └── message.repository.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── conversation.routes.js
│   │   ├── message.routes.js
│   │   ├── upload.routes.js
│   │   └── user.routes.js
│   │
│   ├── services/
│   │   └── otp.service.js
│   │
│   ├── socket/
│   │   ├── middleware/
│   │   │   └── socketAuth.js
│   │   │
│   │   ├── managers/
│   │   │   └── onlineUsers.manager.js
│   │   │
│   │   └── socket.js
│   │
│   ├── utils/
│   │   ├── encryption.js
│   │   └── token.js
│   │
│   └── app.js
│
└── uploads/
```

---

# Database Design

## User Collection

```js
{
  name,
  email,
  password,
  avatar,
  isVerified,
  refreshToken
}
```

## Conversation Collection

```js
{
  participants,
  lastMessage,
  lastMessageSender,
  lastMessageAt,
  unreadCounts
}
```

## Message Collection

```js
{
  conversationId,
  senderId,
  receiverId,
  message,
  messageType,
  fileUrl,
  fileName,
  fileSize,
  mimeType,
  status
}
```

---

# API Documentation

## Authentication

### Register User

```http
POST /api/auth/register
```

Request

```json
{
  "name": "John",
  "email": "john@example.com",
  "password": "123456"
}
```

---

### Login User

```http
POST /api/auth/login
```

Request

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

---

### Get Current User

```http
GET /api/auth/me
```

Headers

```http
Authorization: Bearer <token>
```

---

### Refresh Access Token

```http
POST /api/auth/refresh-token
```

---

## Conversations

### Get Conversations

```http
GET /api/conversations
```

---

### Start Conversation

```http
POST /api/conversations/start
```

Request

```json
{
  "userId": "receiver_user_id"
}
```

---

## Messages

### Get Messages

```http
GET /api/messages/:conversationId?page=1&limit=20
```

---

## Upload

### Upload File

```http
POST /api/upload
```

Body

```text
form-data

file: <file>
```

---

# Socket Events

## Client → Server

```text
join_conversation

send_message

typing_start

typing_stop

message_seen

mark_conversation_read
```

---

## Server → Client

```text
receive_message

message_sent

typing_start

typing_stop

message_seen

online_users

conversations_updated
```

---

# Environment Variables

Create a .env file in backend directory.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_access_token_secret

JWT_REFRESH_SECRET=your_refresh_token_secret

FRONTEND_URL=http://localhost:8080
```

---

# Installation

## Backend

```bash
cd backend

npm install

npm run dev
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# Architectural Decisions

### Why JWT?

JWT provides stateless authentication and simplifies API authorization.

### Why Socket.IO?

Socket.IO provides realtime bidirectional communication, automatic reconnection, and room-based messaging.

### Why Separate Conversations and Messages?

Messages grow rapidly over time. Keeping them separate improves scalability and query performance.

### Why Store Last Message in Conversation?

It enables fast sidebar rendering without querying the Messages collection repeatedly.

### Why Use Repository Pattern?

Repositories isolate database logic from business logic and improve maintainability.

### Why Encrypt Messages?

Messages are encrypted before storage to improve data security.

### Why Use Pagination?

Pagination prevents loading large chat histories at once and improves performance.

---

# Scalability Considerations

The current architecture supports future improvements such as:

* Redis Adapter for Socket.IO
* Horizontal Scaling
* Message Queue Integration
* CDN-Based File Storage
* AWS S3 File Uploads
* Distributed Caching
* Microservice Migration

---

# Future Enhancements

* Group Chats
* Voice Messages
* Video Calling
* Push Notifications
* Read Receipts Analytics
* Message Reactions
* End-to-End Encryption
* Cloud File Storage
* Redis Caching
* Admin Dashboard

---

# Author

Jeet Ahirwar

Realtime Messaging System Backend Assessment Project
