import { io } from "socket.io-client";

import { useChatStore } from "@/store/chatStore";



/*
========================================
SOCKET URL
========================================
*/
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";



let socket = null;





/*
========================================
GET SOCKET INSTANCE
========================================
*/
export function getSocket()
{
  return socket;
}






/*
========================================
CONNECT SOCKET
========================================
*/
export function connectSocket(token)
{

  /*
  ========================================
  TOKEN VALIDATION
  ========================================
  */
  if (!token)
  {

    console.log(
      "Socket token missing"
    );

    return null;

  }




  /*
  ========================================
  PREVENT MULTIPLE CONNECTIONS
  ========================================
  */
  if (socket?.connected)
  {
    return socket;
  }




  /*
  ========================================
  CLEAN OLD SOCKET
  ========================================
  */
  if (socket)
  {

    socket.removeAllListeners();

    socket.disconnect();

  }






  /*
  ========================================
  CREATE SOCKET
  ========================================
  */
  socket = io(

    SOCKET_URL,

    {

      auth:
      {
        token
      },

      /*
      ====================================
      RECONNECTION SETTINGS
      ====================================
      */
      reconnection: true,

      reconnectionAttempts: Infinity,

      reconnectionDelay: 1000

    }

  );






  /*
  ========================================
  ZUSTAND STORE
  ========================================
  */
  const chat =
    useChatStore.getState();






  /*
  ========================================
  CONNECTED
  ========================================
  */
  socket.on(

    "connect",

    () =>
    {

      console.log(
        "Socket Connected:",
        socket.id
      );

    }

  );







  /*
  ========================================
  CONNECTION ERROR
  ========================================
  */
  socket.on(

    "connect_error",

    (error) =>
    {

      console.log(

        "Socket Connection Error:",

        error.message

      );

    }

  );







  /*
  ========================================
  DISCONNECTED
  ========================================
  */
  socket.on(

    "disconnect",

    (reason) =>
    {

      console.log(

        "Socket Disconnected:",

        reason

      );

    }

  );








  /*
  ========================================
  RECONNECTING
  ========================================
  */
  socket.io.on(

    "reconnect_attempt",

    (attempt) =>
    {

      console.log(

        "Reconnect Attempt:",

        attempt

      );

    }

  );








  /*
  ========================================
  RECONNECTED
  ========================================
  */
  socket.io.on(

    "reconnect",

    () =>
    {

      console.log(
        "Socket Reconnected"
      );

    }

  );








  /*
  ========================================
  ONLINE USERS
  ========================================
  */
  socket.on(

    "online_users",

    (users = []) =>
    {

      chat.setOnlineUsers(
        users
      );

    }

  );








  /*
  ========================================
  RECEIVE MESSAGE
  ========================================
  */
  socket.on(

    "receive_message",

    (message) =>
    {

      if (!message)
        return;




      /*
      ====================================
      APPEND MESSAGE
      ====================================
      */
      chat.appendMessage(

        message.conversationId,

        message

      );

    }

  );








  /*
  ========================================
  MESSAGE SENT
  ========================================
  Multi-device sync
  ========================================
  */
  socket.on(

    "message_sent",

    (message) =>
    {

      if (!message)
        return;




      chat.appendMessage(

        message.conversationId,

        message

      );

    }

  );








  /*
  ========================================
  CONVERSATIONS UPDATED
  ========================================
  */
  socket.on(

    "conversations_updated",

    (conversations = []) =>
    {

      chat.setConversations(
        conversations
      );

    }

  );








  /*
  ========================================
  MESSAGE SEEN
  ========================================
  */
  socket.on(

    "message_seen",

    ({ messageId } = {}) =>
    {

      if (!messageId)
        return;




      chat.updateMessageStatus(

        messageId,

        "seen"

      );

    }

  );








  /*
  ========================================
  TYPING START
  ========================================
  */
  socket.on(

    "typing_start",

    ({
      senderId,
      conversationId
    } = {}) =>
    {

      if (
        !senderId ||
        !conversationId
      )
      {
        return;
      }




      chat.setTyping(

        conversationId,

        senderId,

        true

      );

    }

  );








  /*
  ========================================
  TYPING STOP
  ========================================
  */
  socket.on(

    "typing_stop",

    ({
      senderId,
      conversationId
    } = {}) =>
    {

      if (
        !senderId ||
        !conversationId
      )
      {
        return;
      }




      chat.setTyping(

        conversationId,

        senderId,

        false

      );

    }

  );





  return socket;

}









/*
========================================
DISCONNECT SOCKET
========================================
*/
export function disconnectSocket()
{

  if (socket)
  {

    socket.removeAllListeners();

    socket.disconnect();

    socket = null;

  }

}









/*
========================================
JOIN CONVERSATION
========================================
*/
export function joinConversation(
  conversationId
)
{

  if (
    socket?.connected &&
    conversationId
  )
  {

    socket.emit(

      "join_conversation",

      conversationId

    );

  }

}









/*
========================================
SEND MESSAGE
========================================
*/
export function emitSendMessage(
  payload = {}
)
{

  if (
    socket?.connected
  )
  {

    socket.emit(

      "send_message",

      payload

    );

  }

}









/*
========================================
TYPING START
========================================
*/
export function emitTypingStart(
  payload = {}
)
{

  if (
    socket?.connected
  )
  {

    socket.emit(

      "typing_start",

      payload

    );

  }

}









/*
========================================
TYPING STOP
========================================
*/
export function emitTypingStop(
  payload = {}
)
{

  if (
    socket?.connected
  )
  {

    socket.emit(

      "typing_stop",

      payload

    );

  }

}









/*
========================================
MESSAGE SEEN
========================================
*/
export function emitMessageSeen(
  payload = {}
)
{

  if (
    socket?.connected
  )
  {

    socket.emit(

      "message_seen",

      payload

    );

  }

}


/*
========================================
MARK CONVERSATION READ
========================================
*/
export function emitMarkConversationRead(
  payload = {}
)
{
  if (socket?.connected)
  {
    socket.emit(
      "mark_conversation_read",
      payload
    );
  }
}