# Backend Assessment Submission

## 1. Source Code Repository

### Repository Structure

```text
realtime-chat-app/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   ├── utils/
│   │   └── app.js
│   │
│   ├── uploads/
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

### Technologies Used

#### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO
* JWT Authentication
* bcryptjs
* Multer

#### Frontend

* React.js
* Vite
* Tailwind CSS
* Socket.IO Client
* Zustand
* Axios
* Framer Motion

---

## 2. API Documentation / Usage Instructions

### Authentication APIs

#### Register User

```http
POST /api/auth/register
```

Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

---

#### Login User

```http
POST /api/auth/login
```

Request Body

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

Response

```json
{
  "success": true,
  "accessToken": "...",
  "refreshToken": "...",
  "user": {}
}
```

---

#### Get Current User

```http
GET /api/auth/me
```

Headers

```http
Authorization: Bearer <access_token>
```

---

#### Refresh Access Token

```http
POST /api/auth/refresh-token
```

Request Body

```json
{
  "refreshToken": "..."
}
```

---

### Conversation APIs

#### Get User Conversations

```http
GET /api/conversations
```

---

#### Start Conversation

```http
POST /api/conversations/start
```

Request Body

```json
{
  "userId": "receiver_user_id"
}
```

---

### Message APIs

#### Get Chat Messages

```http
GET /api/messages/:conversationId?page=1&limit=20
```

Supports pagination for efficient historical chat loading.

---

### Upload APIs

#### Upload File

```http
POST /api/upload
```

Content Type

```text
multipart/form-data
```

Body

```text
file = selected_file
```

Response

```json
{
  "success": true,
  "file": {
    "fileUrl": "...",
    "fileName": "...",
    "fileSize": 12345,
    "mimeType": "image/png"
  }
}
```

---

### Socket Events

#### Client → Server

```text
join_conversation

send_message

typing_start

typing_stop

message_seen

mark_conversation_read
```

#### Server → Client

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

## 3. Environment Setup Instructions

### Backend Setup

Clone repository

```bash
git clone <repository_url>
```

Navigate to backend

```bash
cd backend
```

Install dependencies

```bash
npm install
```

Create .env file

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_access_token_secret

JWT_REFRESH_SECRET=your_refresh_token_secret

FRONTEND_URL=http://localhost:8080
```

Start backend server

```bash
npm run dev
```

Expected Output

```text
MongoDB Connected
Server running on port 5000
```

---

### Frontend Setup

Navigate to frontend

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

Create .env file

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Start frontend

```bash
npm run dev
```

---

### Application Access

Frontend

```text
http://localhost:8080
```

Backend

```text
http://localhost:5000
```

---

## 4. Assumptions / Architectural Decisions

### Authentication

* JWT is used for stateless authentication.
* Access Tokens are short-lived.
* Refresh Tokens are used for session continuity.
* Refresh Tokens are hashed before storage.

### Realtime Communication

* Socket.IO is used for bidirectional realtime communication.
* Every socket connection is authenticated using JWT.
* Users join personal rooms for multi-device synchronization.
* Conversation rooms are used for typing indicators and realtime chat events.

### Database Design

* Users, Conversations, Messages, and OTPs are stored in separate collections.
* Conversation and Message collections are separated for scalability.
* Messages are encrypted before being stored in MongoDB.
* Conversations store lastMessage and unreadCounts for fast sidebar loading.

### Performance Considerations

* Message pagination is implemented.
* Infinite scroll support is provided.
* Sidebar loading is optimized using lastMessage.
* Conversation queries are sorted by latest activity.
* Lean queries are used where appropriate.

### Reliability Considerations

* Automatic Socket.IO reconnection support.
* Online/offline presence tracking.
* Message delivery status tracking.
* Seen status tracking.
* Graceful error handling across APIs and sockets.

### Security Considerations

* Password hashing using bcrypt.
* JWT verification for APIs and sockets.
* Protected routes.
* Input validation.
* Upload validation.
* Message encryption before database storage.

### Future Scalability

The architecture supports future enhancements such as:

* Redis Adapter for Socket.IO
* Horizontal Scaling
* Queue-Based Message Processing
* Cloud File Storage (AWS S3)
* CDN Integration
* Distributed Caching
* Monitoring and Logging Infrastructure
* End-to-End Encryption
