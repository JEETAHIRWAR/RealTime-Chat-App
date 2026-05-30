import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "@/components/ui/Avatar";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { chatApi } from "@/api/chat";
import
{
  emitSendMessage,
  emitMarkConversationRead,
  emitMessageSeen,
  joinConversation
} from "@/socket/socket";

export default function ChatWindow({ conversationId })
{
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { conversations, messagesByConv, setMessages, prependMessages, appendMessage, typingByConv, onlineUsers } =
    useChatStore();
  const messages = messagesByConv[conversationId] || [];
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollerRef = useRef(null);
  const bottomRef = useRef(null);

  const conversation = useMemo(
    () => conversations.find((c) => (c.id || c._id) === conversationId),
    [conversations, conversationId]
  );

  const other =
    conversation?.otherUser ||
    conversation?.participants?.find((p) => (p.id || p._id) !== (user?.id || user?._id)) ||
    {};
  const otherId = other.id || other._id;
  const isOnline = otherId ? onlineUsers.has(otherId) : false;
  const isTyping = (typingByConv[conversationId] || new Set()).size > 0;

  useEffect(() =>
  {
    if (!conversationId) return;

    joinConversation(conversationId);
  }, [conversationId]);

  // Load initial messages
  useEffect(() =>
  {
    if (!conversationId) return;
    let cancelled = false;
    setLoading(true);
    setHasMore(true);
    chatApi
      .getMessages(conversationId, 1, 30)
      .then((res) =>
      {
        if (cancelled) return;
        const msgs = res.messages || res || [];
        setMessages(conversationId, msgs);
        setHasMore(msgs.length >= 30);
      })
      .catch(() => { })
      .finally(() => !cancelled && setLoading(false));
    return () =>
    {
      cancelled = true;
    };
  }, [conversationId, setMessages]);

  useEffect(() =>
  {
    if (!conversationId) return;

    emitMarkConversationRead({
      conversationId
    });
  }, [conversationId, messages.length]);

  // Auto-scroll on new messages
  useEffect(() =>
  {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  /*
  ========================================
  MARK MESSAGES AS SEEN
  ========================================
  Only active/open conversation messages
  ========================================
  */
  useEffect(() =>
  {
    if (!conversationId || !messages.length) return;

    messages.forEach((m) =>
    {
      const messageConversationId =
        m.conversationId?._id ||
        m.conversationId;

      if (
        messageConversationId?.toString() !==
        conversationId?.toString()
      )
      {
        return;
      }

      const senderId =
        m.senderId?._id || m.senderId;

      const currentUserId =
        user?._id || user?.id;

      if (
        senderId?.toString() !== currentUserId?.toString() &&
        m.status !== "seen"
      )
      {
        emitMessageSeen({
          messageId: m._id || m.id,
          senderId,
          conversationId,
        });
      }
    });
  }, [conversationId, messages, user]);

  // Infinite scroll: load older when scrolled to top
  const onScroll = async (e) =>
  {
    if (loadingOlder || !hasMore) return;
    if (e.currentTarget.scrollTop < 80 && messages.length)
    {
      setLoadingOlder(true);
      const oldest = messages[0];
      try
      {
        const nextPage = Math.floor(messages.length / 30) + 1;

        const res = await chatApi.getMessages(
          conversationId,
          nextPage,
          30
        );
        const older = res.messages || res || [];
        const prevHeight = e.currentTarget.scrollHeight;
        prependMessages(conversationId, older);
        if (older.length < 30) setHasMore(false);
        requestAnimationFrame(() =>
        {
          if (scrollerRef.current)
          {
            scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight - prevHeight;
          }
        });
      } catch { }
      setLoadingOlder(false);
    }
  };

  const handleSend = (content) =>
  {
    const tempId = `tmp_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

    const optimistic = {
      tempId,
      message: content,
      content,
      senderId: user?._id || user?.id,
      conversationId,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    // appendMessage(conversationId, optimistic);

    emitSendMessage({
      conversationId,
      receiverId: otherId,
      message: content,
      tempId,
    });
  };


  const handleFileSend = async (file, caption = "") =>
  {
    try
    {
      const uploadRes = await chatApi.uploadFile(file);

      const uploadedFile = uploadRes.file;

      emitSendMessage({
        conversationId,
        receiverId: otherId,
        message: caption || uploadedFile.fileName,
        messageType: uploadedFile.mimeType.startsWith("image/")
          ? "image"
          : "file",
        fileUrl: uploadedFile.fileUrl,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        mimeType: uploadedFile.mimeType,
      });
    } catch (error)
    {
      console.log(
        "File send error:",
        error.response?.data || error.message
      );
    }
  };


  if (!conversationId)
  {
    return (
      <div className="hidden flex-1 items-center justify-center md:flex">
        <div className="flex flex-col items-center gap-3 text-center text-(--color-muted-fg)">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-accent) text-(--color-primary)">
            <MessageSquare size={28} />
          </div>
          <div className="text-lg font-semibold text-(--color-fg)">Select a conversation</div>
          <div className="max-w-xs text-sm">
            Pick a chat from the sidebar or search for someone to start a new conversation.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-(--color-bg)">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-(--color-border) bg-(--color-card) px-3 py-3 md:px-5">
        <button
          onClick={() => navigate("/chat")}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-(--color-muted) md:hidden"
        >
          <ArrowLeft size={18} />
        </button>
        <Avatar name={other.name} src={other.avatar} size={40} online={isOnline} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{other.name || "Conversation"}</div>
          <div className="truncate text-xs text-(--color-muted-fg)">
            {isTyping ? "typing..." : isOnline ? "online" : "offline"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-3 md:px-6"
      >
        {loadingOlder && (
          <div className="mb-3 flex justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-(--color-primary) border-t-transparent" />
          </div>
        )}
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-(--color-primary) border-t-transparent" />
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            {messages.map((m) =>
            {
              const senderId =
                m.senderId?._id || m.senderId || m.sender?.id || m.sender?._id;

              const isMe =
                senderId?.toString() === (user?.id || user?._id)?.toString();
              return <MessageBubble key={m.id || m._id || m.tempId} message={m} isMe={isMe} />;
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-(--color-bubble-them)">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <MessageInput
        conversationId={conversationId}
        onSend={handleSend}
        onFileSend={handleFileSend}
      />
    </div>
  );
}
