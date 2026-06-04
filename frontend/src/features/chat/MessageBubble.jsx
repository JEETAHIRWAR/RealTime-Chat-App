import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCheck,
  Clock,
  Copy,
  Download,
  Edit3,
  FileText,
  Reply,
  SmilePlus,
  Trash2,
  ChevronDown,
} from "lucide-react";

import {
  emitDeleteMessage,
  emitMessageReaction,
} from "@/socket/socket";

import { useChatStore } from "@/store/chatStore";

const reactionEmojis = [
  "\u{1F44D}",
  "\u2764\uFE0F",
  "\u{1F602}",
  "\u{1F62E}",
  "\u{1F622}",
  "\u{1F64F}",
];

const POPUP_MARGIN = 12;
const REACTION_BAR_WIDTH = 288;
const REACTION_BAR_HEIGHT = 48;
const ACTION_MENU_WIDTH = 224;
const ACTION_MENU_HEIGHT = 292;
const POPUP_GAP = 8;

function formatTime(ts) {
  if (!ts) return "";

  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(size = 0) {
  if (!size) return "";

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getMessageId(message) {
  return message?._id || message?.id || message?.tempId;
}

export default function MessageBubble({
  message,
  isMe,
  activeReactionMessage,
  setActiveReactionMessage,
}) {
  const messageId = getMessageId(message);
  const isActive = activeReactionMessage === messageId;

  const bubbleRef = useRef(null);
  const popupRef = useRef(null);
  const longPressTimer = useRef(null);

  const [showMenu, setShowMenu] = useState(false);
  const [popupPosition, setPopupPosition] = useState({
    top: null,
    left: null,
    right: null,
  });

  const setReplyMessage = useChatStore((s) => s.setReplyMessage);
  const setEditMessage = useChatStore((s) => s.setEditMessage);

  const text = message.message || message.content || "";
  const fileUrl = message.fileUrl || "";
  const safeFileUrl = fileUrl ? encodeURI(fileUrl) : "";

  const isImage =
    message.messageType === "image" ||
    message.mimeType?.startsWith("image/") ||
    /\.(png|jpg|jpeg|webp|gif)$/i.test(fileUrl);

  const isFile =
    message.messageType === "file" ||
    (!!message.fileUrl && !isImage);

  const reactions = useMemo(
    () => (Array.isArray(message.reactions) ? message.reactions : []),
    [message.reactions]
  );

  const repliedMessage = message.replyTo || null;

  const repliedText =
    repliedMessage?.message ||
    repliedMessage?.fileName ||
    (repliedMessage?.messageType === "image" ? "Photo" : "");

  const canEdit = isMe && !!text && !isFile && !isImage;
  const clipboardValue = text || fileUrl || message.fileName || "";

  const reactionPreview = useMemo(() => {
    const unique = [];

    reactions.forEach((reaction) => {
      if (reaction?.emoji && !unique.includes(reaction.emoji)) {
        unique.push(reaction.emoji);
      }
    });

    return unique.slice(0, 3);
  }, [reactions]);

  const closePopup = useCallback(() => {
    setShowMenu(false);
    setActiveReactionMessage(null);
    setPopupPosition({
      top: null,
      left: null,
      right: null,
    });
  }, [setActiveReactionMessage]);

  const updatePopupPosition = useCallback(() => {
    const bubble = bubbleRef.current;

    if (!bubble) {
      setPopupPosition({
        top: null,
        left: null,
        right: null,
      });
      return;
    }

    const rect = bubble.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = Math.max(REACTION_BAR_WIDTH, ACTION_MENU_WIDTH);
    const popupHeight =
      REACTION_BAR_HEIGHT + POPUP_GAP + ACTION_MENU_HEIGHT;

    const shouldAlignRight =
      isMe || rect.right + popupWidth > viewportWidth - POPUP_MARGIN;

    const wouldOverflowBottom =
      rect.bottom + POPUP_GAP + popupHeight > viewportHeight - POPUP_MARGIN;

    const top = wouldOverflowBottom
      ? Math.max(POPUP_MARGIN, rect.top - popupHeight - POPUP_GAP)
      : Math.max(
        POPUP_MARGIN,
        Math.min(
          viewportHeight - popupHeight - POPUP_MARGIN,
          rect.bottom + POPUP_GAP
        )
      );

    if (shouldAlignRight) {
      const right = Math.max(
        POPUP_MARGIN,
        viewportWidth - Math.min(rect.right, viewportWidth - POPUP_MARGIN)
      );

      setPopupPosition({
        top,
        left: null,
        right,
      });

      return;
    }

    const left = Math.max(
      POPUP_MARGIN,
      Math.min(rect.left, viewportWidth - popupWidth - POPUP_MARGIN)
    );

    setPopupPosition({
      top,
      left,
      right: null,
    });
  }, [isMe]);

  const openPopup = useCallback(() => {
    if (!messageId) return;

    updatePopupPosition();
    setActiveReactionMessage(messageId);
    setShowMenu(true);
  }, [messageId, setActiveReactionMessage, updatePopupPosition]);

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isActive && showMenu) {
      closePopup();
      return;
    }

    openPopup();
  };

  useEffect(() => {
    if (!isActive) return undefined;

    updatePopupPosition();

    const handleOutsideClick = (e) => {
      const target = e.target;
      const clickedBubble = bubbleRef.current?.contains(target);
      const clickedPopup = popupRef.current?.contains(target);

      if (!clickedBubble && !clickedPopup) {
        closePopup();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closePopup();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updatePopupPosition);
    window.addEventListener("scroll", updatePopupPosition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
  }, [closePopup, isActive, updatePopupPosition]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleReaction = (emoji) => {
    const socketMessageId = message._id || message.id;

    if (!socketMessageId || !message.conversationId) {
      closePopup();
      return;
    }

    emitMessageReaction({
      messageId: socketMessageId,
      conversationId: message.conversationId,
      emoji,
    });

    closePopup();
  };

  const handleReply = () => {
    setReplyMessage(message);
    closePopup();
  };

  const handleCopy = async () => {
    try {
      if (clipboardValue) {
        await navigator.clipboard.writeText(clipboardValue);
      }
    } finally {
      closePopup();
    }
  };

  const handleEdit = () => {
    if (!canEdit) {
      closePopup();
      return;
    }

    setEditMessage(message);
    closePopup();
  };

  const handleDeleteForMe = () => {
    emitDeleteMessage({
      messageId: message._id || message.id,
      deleteForEveryone: false,
    });

    closePopup();
  };

  const handleDeleteForEveryone = () => {
    emitDeleteMessage({
      messageId: message._id || message.id,
      deleteForEveryone: true,
    });

    closePopup();
  };

  const startLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    longPressTimer.current = setTimeout(openPopup, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const renderStatus = () => {
    if (!isMe) return null;

    if (message.status === "seen") {
      return <CheckCheck size={14} className="text-[var(--color-status-seen)]" />;
    }

    if (message.status === "delivered") {
      return <CheckCheck size={14} className="text-current opacity-70" />;
    }

    if (message.status === "sent") {
      return <Check size={14} className="text-current opacity-70" />;
    }

    return <Clock size={13} className="text-current opacity-70" />;
  };

  const menuItems = [
    {
      label: "Reply",
      icon: Reply,
      onClick: handleReply,
      show: true,
    },
    {
      label: "Copy",
      icon: Copy,
      onClick: handleCopy,
      show: true,
      disabled: !clipboardValue,
    },
    {
      label: "Edit",
      icon: Edit3,
      onClick: handleEdit,
      show: true,
      disabled: !canEdit,
    },
    {
      label: "React",
      icon: SmilePlus,
      onClick: () => setShowMenu(false),
      show: true,
    },
    {
      label: "Delete For Me",
      icon: Trash2,
      onClick: handleDeleteForMe,
      show: true,
    },
    {
      label: "Delete For Everyone",
      icon: Trash2,
      onClick: handleDeleteForEveryone,
      show: isMe,
      danger: true,
    },
  ];

  const floatingPopup =
    typeof document !== "undefined"
      ? createPortal(
        <AnimatePresence>
          {isActive && popupPosition.top !== null && (
            <motion.div
              ref={popupRef}
              initial={{ opacity: 0, scale: 0.96, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              style={{
                top: popupPosition.top,
                left: popupPosition.left ?? undefined,
                right: popupPosition.right ?? undefined,
              }}
              className={`fixed z-[9999] flex w-[288px] flex-col gap-2 ${
                popupPosition.right !== null ? "items-end" : "items-start"
              }`}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 8 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className="flex rounded-full border border-[var(--color-reaction-border)] bg-[var(--color-reaction-bg)]/95 px-2.5 py-2 shadow-[var(--shadow-menu)] backdrop-blur-2xl"
              >
                {reactionEmojis.map((emoji) => {
                  const selected = reactions.some(
                    (reaction) => reaction.emoji === emoji
                  );

                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(emoji);
                      }}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xl transition hover:scale-125 hover:bg-[var(--color-overlay-soft)] active:scale-110 ${
                        selected ? "bg-[var(--color-reaction-selected)] ring-1 ring-[var(--color-secondary)]" : ""
                      }`}
                      aria-label={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </motion.div>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                    className="w-56 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-menu)]/95 p-1 text-sm text-[var(--color-menu-fg)] shadow-[var(--shadow-menu)] backdrop-blur-2xl"
                  >
                    {menuItems
                      .filter((item) => item.show)
                      .map((item) => {
                        const Icon = item.icon;

                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();

                              if (!item.disabled) {
                                item.onClick();
                              }
                            }}
                            disabled={item.disabled}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[var(--color-menu-hover)] disabled:cursor-not-allowed disabled:opacity-40 ${
                              item.danger ? "text-[var(--color-danger)]" : ""
                            }`}
                          >
                            <Icon size={17} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )
      : null;

  return (
    <>
      {floatingPopup}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={`flex w-full px-1 ${isMe ? "justify-end" : "justify-start"}`}
      >
        <div
          ref={bubbleRef}
            className={`group relative flex max-w-[88%] flex-col sm:max-w-[76%] ${
            isMe ? "items-end" : "items-start"
          }`}
        >
          <div
            onDoubleClick={openPopup}
            onContextMenu={(e) => {
              e.preventDefault();
              openPopup();
            }}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
            className={`relative overflow-visible rounded-3xl border px-3.5 py-2 text-[15px] leading-6 shadow-[var(--shadow-bubble)] backdrop-blur-xl transition ${
              isMe
                ? "rounded-br-md border-[var(--color-primary-border)] bg-[var(--color-bubble-me)] text-[var(--color-bubble-me-fg)]"
                : "rounded-bl-md border-[var(--color-border)] bg-[var(--color-bubble-them)]/95 text-[var(--color-bubble-them-fg)]"
            } ${
              isActive ? "ring-2 ring-[var(--color-secondary)]/50" : "hover:border-[var(--color-primary-border)]"
            }`}
          >
            <button
              type="button"
              onClick={toggleMenu}
              className={`absolute top-1.5 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-reaction-border)] opacity-0 shadow-[var(--shadow-card)] backdrop-blur-xl transition group-hover:opacity-100 ${
                showMenu && isActive ? "opacity-100" : ""
              } ${
                isMe
                  ? "right-1.5 bg-[var(--color-bubble-me)] text-[var(--color-bubble-me-fg)]"
                  : "right-1.5 bg-[var(--color-bubble-them)] text-[var(--color-bubble-them-fg)]"
              }`}
              aria-label={
                showMenu && isActive
                  ? "Close message actions"
                  : "Open message actions"
              }
              aria-expanded={showMenu && isActive}
            >
              <ChevronDown size={18} />
            </button>

          {repliedMessage && (
            <div
              className={`mb-2 max-w-[280px] rounded-2xl border-l-4 px-3 py-2 text-xs ${
                isMe
                    ? "border-[var(--color-primary-hover)] bg-[var(--color-bubble-soft)]"
                    : "border-[var(--color-primary)] bg-[var(--color-bubble-hover)]"
              }`}
            >
                <div className="mb-0.5 font-semibold text-[var(--color-primary)]">
                Replying to
              </div>

                <div className="line-clamp-2 break-words text-[var(--color-bubble-meta)]">
                {repliedText || "Message"}
              </div>
            </div>
          )}

          {isImage && safeFileUrl && (
            <a
              href={safeFileUrl}
              target="_blank"
              rel="noreferrer"
              className="relative mb-1 block overflow-hidden rounded-2xl"
            >
              <img
                src={safeFileUrl}
                alt={message.fileName || "image"}
                className="block max-h-[360px] w-full max-w-[320px] rounded-2xl object-cover"
              />

                <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-[var(--color-scrim)] px-2 py-0.5 text-[10px] text-[var(--color-primary-fg)]">
                <span>{formatTime(message.createdAt)}</span>
                {renderStatus()}
              </div>
            </a>
          )}

          {isFile && message.fileUrl && (
            <a
              href={message.fileUrl}
              target="_blank"
              rel="noreferrer"
              download
              className={`mb-1.5 flex min-w-[220px] max-w-[320px] items-center gap-3 rounded-2xl border border-[var(--color-reaction-border)] p-3 ${
                  isMe ? "bg-[var(--color-bubble-soft)]" : "bg-[var(--color-bubble-hover)]"
              }`}
            >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-overlay-soft)] text-[var(--color-bubble-meta)]">
                <FileText size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {message.fileName || text || "File"}
                </div>

                  <div className="text-xs text-[var(--color-bubble-meta)]">
                  {formatFileSize(message.fileSize)}
                </div>
              </div>

                <Download size={18} className="shrink-0 text-[var(--color-bubble-meta)]" />
            </a>
          )}

          {text && !isImage && (
            <div className="whitespace-pre-wrap break-words pr-12">
              {text}

              {message.isEdited && (
                  <span className="ml-2 text-[10px] text-[var(--color-bubble-meta)]">
                  edited
                </span>
              )}
            </div>
          )}

          {!isImage && (
              <div className="float-right -mb-0.5 ml-2 mt-1 flex h-4 items-center justify-end gap-1 text-[10px] font-medium leading-none text-[var(--color-bubble-meta)]">
              <span>{formatTime(message.createdAt)}</span>
              {renderStatus()}
            </div>
          )}
          </div>

          {reactions.length > 0 && (
            <button
              type="button"
              onClick={openPopup}
              className={`relative -mt-1.5 flex items-center gap-1 rounded-full border border-[var(--color-reaction-border)] bg-[var(--color-reaction-bg)]/95 px-2 py-0.5 text-xs shadow-[var(--shadow-card)] backdrop-blur-xl transition hover:border-[var(--color-primary-border)] ${
                isMe ? "mr-2" : "ml-2"
              }`}
              aria-label="Open message reactions"
            >
              {reactionPreview.map((emoji) => (
                <span key={emoji}>{emoji}</span>
              ))}

              {reactions.length > 1 && (
                <span className="text-[10px] text-[var(--color-muted-fg)]">
                  {reactions.length}
                </span>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
