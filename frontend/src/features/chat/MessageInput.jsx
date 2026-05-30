import { useEffect, useRef, useState } from "react";
import { Send, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

import Button from "@/components/ui/Button";

import {
  emitTypingStart,
  emitTypingStop,
} from "@/socket/socket";

export default function MessageInput({
  conversationId,
  onSend,
  disabled,
}) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const typingRef = useRef(false);
  const timerRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    setText("");
    setShowEmoji(false);
    typingRef.current = false;

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      emitTypingStop({
        conversationId,
      });
    };
  }, [conversationId]);

  const handleChange = (v) => {
    setText(v);

    if (!conversationId) return;

    if (!typingRef.current) {
      typingRef.current = true;

      emitTypingStart({
        conversationId,
      });
    }

    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      typingRef.current = false;

      emitTypingStop({
        conversationId,
      });
    }, 1500);
  };

  const addEmoji = (emojiData) => {
    const emoji = emojiData?.emoji || "";

    setText((prev) => prev + emoji);

    taRef.current?.focus();

    if (!conversationId) return;

    emitTypingStart({
      conversationId,
    });
  };

  const submit = (e) => {
    e?.preventDefault();

    const value = text.trim();

    if (!value || disabled) return;

    onSend(value);

    setText("");
    setShowEmoji(false);
    typingRef.current = false;

    emitTypingStop({
      conversationId,
    });

    taRef.current?.focus();
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={submit}
      className="relative flex items-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-card)] p-3"
    >
      {showEmoji && (
        <div className="absolute bottom-16 left-3 z-50">
          <EmojiPicker
            theme="dark"
            onEmojiClick={addEmoji}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowEmoji((prev) => !prev)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]"
        tabIndex={-1}
      >
        <Smile size={18} />
      </button>

      <textarea
        ref={taRef}
        rows={1}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={onKey}
        placeholder="Type a message..."
        disabled={disabled}
        className="max-h-32 min-h-[40px] flex-1 resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
      />

      <Button
        type="submit"
        size="icon"
        className="h-10 w-10 rounded-full"
        disabled={!text.trim() || disabled}
      >
        <Send size={16} />
      </Button>
    </form>
  );
}