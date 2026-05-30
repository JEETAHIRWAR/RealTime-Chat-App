import { motion } from "framer-motion";
import
{
  Check,
  CheckCheck,
  Clock,
  FileText,
  Download,
} from "lucide-react";

function formatTime(ts)
{
  if (!ts) return "";

  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(size = 0)
{
  if (!size) return "";

  if (size < 1024 * 1024)
  {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageBubble({ message, isMe })
{
  const text = message.message || message.content || "";

  const fileUrl = message.fileUrl || "";
  const safeFileUrl =
  fileUrl ? encodeURI(fileUrl) : "";


  const isImage =
    message.messageType === "image" ||
    message.mimeType?.startsWith("image/") ||
    /\.(png|jpg|jpeg|webp|gif)$/i.test(fileUrl);

  const isFile =
    message.messageType === "file" ||
    (!!message.fileUrl && !isImage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex w-full ${isMe ? "justify-end" : "justify-start"
        }`}
    >
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${isMe
          ? "rounded-br-md bg-[var(--color-bubble-me)] text-[var(--color-primary-fg)]"
          : "rounded-bl-md bg-[var(--color-bubble-them)] text-[var(--color-fg)]"
          }`}
      >
        {isImage && safeFileUrl && (
          <a
            href={safeFileUrl}
            target="_blank"
            rel="noreferrer"
            className="relative mb-1 block overflow-hidden rounded-xl"
          >
            <img
              src={safeFileUrl}
              alt={message.fileName || "image"}
              
              className="block max-h-[360px] w-full max-w-[320px] rounded-xl object-cover"
            />

            <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white">
              <span>{formatTime(message.createdAt)}</span>

              {isMe && (
                <span>
                  {message.status === "seen" ? (
                    <CheckCheck size={14} className="text-blue-400" />
                  ) : message.status === "delivered" ? (
                    <CheckCheck size={14} className="text-gray-300" />
                  ) : message.status === "sent" ? (
                    <Check size={14} />
                  ) : (
                    <Clock size={14} />
                  )}
                </span>
              )}
            </div>
          </a>
        )}

        {isFile && message.fileUrl && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noreferrer"
            download
            className={`mb-2 flex items-center gap-3 rounded-xl p-3 ${isMe
              ? "bg-white/10"
              : "bg-[var(--color-muted)]"
              }`}
          >
            <FileText size={24} />

            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">
                {message.fileName || text || "File"}
              </div>

              <div
                className={`text-xs ${isMe
                  ? "text-white/70"
                  : "text-[var(--color-muted-fg)]"
                  }`}
              >
                {formatFileSize(message.fileSize)}
              </div>
            </div>

            <Download size={18} />
          </a>
        )}

        {text && !isImage && (
          <div className="whitespace-pre-wrap break-words">
            {text}
          </div>
        )}

        {!isImage && (
          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe
              ? "text-white/75"
              : "text-[var(--color-muted-fg)]"
              }`}
          >
            <span>{formatTime(message.createdAt)}</span>

            {isMe && (
              <span>
                {message.status === "seen" ? (
                  <CheckCheck size={14} className="text-blue-400" />
                ) : message.status === "delivered" ? (
                  <CheckCheck size={14} className="text-gray-300" />
                ) : message.status === "sent" ? (
                  <Check size={14} />
                ) : (
                  <Clock size={14} />
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}