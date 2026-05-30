import { motion } from "framer-motion";
import { Check, CheckCheck, Clock } from "lucide-react";

function formatTime(ts)
{
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, isMe })
{
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${isMe
            ? "rounded-br-md bg-(--color-bubble-me) text-(--color-primary-fg)"
            : "rounded-bl-md bg-(--color-bubble-them) text-(--color-fg)"
          }`}
      >
        <div className="whitespace-pre-wrap wrap-break-words">
          {message.message || message.content || ""}
        </div>
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? "text-white/75" : "text-(--color-muted-fg)"
            }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isMe && (
            <span>
              {message.status === "seen" ? (
                <CheckCheck size={14} className="text-blue-400" />
              ) : message.status === "delivered" ? (
                <CheckCheck size={14} className="text-gray-300"/>
              ) : message.status === "sent" ? (
                <Check size={14} />
              ) : (
                <Clock size={14} />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
