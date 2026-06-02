import
{
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import
{
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

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
  joinConversation,
} from "@/socket/socket";

export default function ChatWindow({ conversationId })
{
  const navigate = useNavigate();

  const user =
    useAuthStore((s) => s.user);

  const {
    conversations,
    messagesByConv,
    setMessages,
    prependMessages,
    typingByConv,
    onlineUsers,
  } = useChatStore();

  const messages =
    messagesByConv[conversationId] || [];

  const [loading, setLoading] =
    useState(false);

  const [loadingOlder, setLoadingOlder] =
    useState(false);

  const [hasMore, setHasMore] =
    useState(true);

  const [activeReactionMessage, setActiveReactionMessage] =
    useState(null);

  const scrollerRef =
    useRef(null);

  /*
  ========================================
  USED TO PREVENT AUTO-SCROLL TO BOTTOM
  WHILE LOADING OLDER MESSAGES
  ========================================
  */
  const isLoadingOlderRef =
    useRef(false);

  /*
  ========================================
  SCROLL TO BOTTOM
  Only scrolls messages container,
  not the full browser page.
  ========================================
  */
  const scrollToBottom = (
    behavior = "auto",
    delay = 0
  ) =>
  {
    const run = () =>
    {
      const scroller =
        scrollerRef.current;

      if (!scroller) return;

      requestAnimationFrame(() =>
      {
        scroller.scrollTo({
          top: scroller.scrollHeight,
          behavior,
        });
      });
    };

    if (delay)
    {
      setTimeout(run, delay);
    }
    else
    {
      run();
    }
  };

  /*
  ========================================
  ACTIVE CONVERSATION
  ========================================
  */
  const conversation =
    useMemo(
      () =>
        conversations.find(
          (c) =>
            (c.id || c._id)?.toString() ===
            conversationId?.toString()
        ),
      [conversations, conversationId]
    );

  /*
  ========================================
  OTHER USER
  ========================================
  */
  const other =
    conversation?.otherUser ||
    conversation?.participants?.find(
      (p) =>
        (p.id || p._id)?.toString() !==
        (user?.id || user?._id)?.toString()
    ) ||
    {};

  const otherId =
    other.id || other._id;

  const isOnline =
    otherId
      ? onlineUsers.has(otherId.toString())
      : false;

  const isTyping =
    (typingByConv[conversationId] || new Set()).size > 0;

  /*
  ========================================
  JOIN CONVERSATION ROOM
  ========================================
  */
  useEffect(() =>
  {
    if (!conversationId) return;

    joinConversation(conversationId);
  }, [conversationId]);

  /*
  ========================================
  LOAD INITIAL MESSAGES
  Runs whenever conversation changes.
  ========================================
  */
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

        const msgs =
          res.messages || res || [];

        setMessages(
          conversationId,
          msgs
        );

        setHasMore(
          res.hasMore ??
          msgs.length >= 30
        );
      })
      .catch((error) =>
      {
        console.log(
          "LOAD MESSAGES ERROR:",
          error?.response?.data ||
          error.message
        );
      })
      .finally(() =>
      {
        if (!cancelled)
        {
          setLoading(false);
        }
      });

    return () =>
    {
      cancelled = true;
    };
  }, [conversationId, setMessages]);

  /*
  ========================================
  AUTO-SCROLL TO BOTTOM
  Works after messages are loaded/rendered.
  Also works when switching:
  UserA -> UserB -> UserA
  ========================================
  */
  useEffect(() =>
  {
    if (!conversationId) return;
    if (loading) return;
    if (!messages.length) return;
    if (isLoadingOlderRef.current) return;

    scrollToBottom("auto", 80);
    scrollToBottom("auto", 250);
  }, [
    conversationId,
    loading,
    messages.length,
  ]);

  /*
  ========================================
  SCROLL WHEN TYPING INDICATOR APPEARS
  ========================================
  */
  useEffect(() =>
  {
    if (!isTyping) return;
    if (isLoadingOlderRef.current) return;

    scrollToBottom("smooth");
  }, [isTyping]);

  /*
  ========================================
  MARK CONVERSATION AS READ
  ========================================
  */
  useEffect(() =>
  {
    if (!conversationId) return;

    emitMarkConversationRead({
      conversationId,
    });
  }, [conversationId, messages.length]);

  /*
  ========================================
  MARK RECEIVED MESSAGES AS SEEN
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
        m.senderId?._id ||
        m.senderId;

      const currentUserId =
        user?._id || user?.id;

      if (
        senderId?.toString() !==
        currentUserId?.toString() &&
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

  /*
  ========================================
  LOAD OLDER MESSAGES ON SCROLL TOP
  ========================================
  */
  const onScroll = async (e) =>
  {
    if (loadingOlder || !hasMore) return;
    if (!conversationId) return;
    if (!messages.length) return;

    const scroller =
      e.currentTarget;

    if (scroller.scrollTop >= 80) return;

    try
    {
      isLoadingOlderRef.current = true;

      setLoadingOlder(true);

      const prevHeight =
        scroller.scrollHeight;

      const nextPage =
        Math.floor(messages.length / 30) + 1;

      const res =
        await chatApi.getMessages(
          conversationId,
          nextPage,
          30
        );

      const older =
        res.messages || res || [];

      prependMessages(
        conversationId,
        older
      );

      if (
        older.length < 30 ||
        res.hasMore === false
      )
      {
        setHasMore(false);
      }

      requestAnimationFrame(() =>
      {
        const currentScroller =
          scrollerRef.current;

        if (!currentScroller) return;

        currentScroller.scrollTop =
          currentScroller.scrollHeight -
          prevHeight;
      });

      setTimeout(() =>
      {
        isLoadingOlderRef.current = false;
      }, 100);
    }
    catch (error)
    {
      console.log(
        "LOAD OLDER ERROR:",
        error?.response?.data ||
        error.message
      );

      isLoadingOlderRef.current = false;
    }
    finally
    {
      setLoadingOlder(false);
    }
  };

  /*
  ========================================
  SEND TEXT MESSAGE
  ========================================
  */
  const handleSend = (
    content,
    replyMessage = null
  ) =>
  {
    emitSendMessage({
      conversationId,
      receiverId: otherId,
      message: content,
      replyTo:
        replyMessage?._id ||
        replyMessage?.id ||
        null,
    });
  };

  /*
  ========================================
  SEND FILE / IMAGE
  ========================================
  */
  const handleFileSend = async (
    file,
    caption = "",
    replyMessage = null
  ) =>
  {
    try
    {
      const uploadRes =
        await chatApi.uploadFile(file);

      const uploadedFile =
        uploadRes.file;

      emitSendMessage({
        conversationId,
        receiverId: otherId,
        message:
          caption ||
          uploadedFile.fileName,
        messageType:
          uploadedFile.mimeType.startsWith("image/")
            ? "image"
            : "file",
        fileUrl: uploadedFile.fileUrl,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        mimeType: uploadedFile.mimeType,
        replyTo:
          replyMessage?._id ||
          replyMessage?.id ||
          null,
      });
    }
    catch (error)
    {
      console.log(
        "FILE SEND ERROR:",
        error?.response?.data ||
        error.message
      );
    }
  };

  /*
  ========================================
  EMPTY STATE
  ========================================
  */
  if (!conversationId)
  {
    return (
      <div className="hidden min-h-0 flex-1 items-center justify-center md:flex">
        <div className="flex flex-col items-center gap-3 text-center text-[var(--color-muted-fg)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-primary)]">
            <MessageSquare size={28} />
          </div>

          <div className="text-lg font-semibold text-[var(--color-fg)]">
            Select a conversation
          </div>

          <div className="max-w-xs text-sm">
            Pick a chat from the sidebar or search for someone to start a new conversation.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-bg)]">
      {/* Header */}
      <div className="relative z-30 flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-card)] px-3 py-3 md:px-5">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-muted)] md:hidden"
        >
          <ArrowLeft size={20} />
        </button>

        <Avatar
          name={other.name}
          src={other.avatar}
          size={40}
          online={isOnline}
        />

        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">
            {other.name || "Conversation"}
          </div>

          <div className="truncate text-xs text-[var(--color-muted-fg)]">
            {isTyping
              ? "typing..."
              : isOnline
                ? "online"
                : "offline"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollerRef}
        onScroll={(e) =>
        {
          setActiveReactionMessage(null);
          onScroll(e);
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-3 md:px-6"
      >
        {loadingOlder && (
          <div className="mb-3 flex justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
          </div>
        )}

        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
          </div>
        ) : (
          <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-2">
            {messages.map((m) =>
            {
              const senderId =
                m.senderId?._id ||
                m.senderId ||
                m.sender?.id ||
                m.sender?._id;

              const isMe =
                senderId?.toString() ===
                (user?.id || user?._id)?.toString();

              return (
                <MessageBubble
                  key={
                    m.id ||
                    m._id ||
                    m.tempId
                  }
                  message={m}
                  isMe={isMe}
                  activeReactionMessage={activeReactionMessage}
                  setActiveReactionMessage={setActiveReactionMessage}
                />
              );
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-[var(--color-bubble-them)]">
                  <TypingIndicator />
                </div>
              </div>
            )}
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