import { Check, CheckCheck, XCircle, Clock } from "lucide-react";

export default function MessageBubble({
  fromMe = false,
  time = "",
  status = "sent",
  direction,

  children,
}) {
  // Map status to icon + color
  const renderTick = () => {
    if (direction === "inbound") return null;

    switch (status) {
      case "read":
        return (
          <CheckCheck
            className="h-3.5 w-3.5 text-whatsapp-blue"
            aria-label="Read"
            title="Read"
          />
        );
      case "delivered":
        return (
          <CheckCheck
            className="h-3.5 w-3.5 text-tick-delivered"
            aria-label="Delivered"
            title="Delivered"
          />
        );
      case "sent":
        return (
          <Check
            className="h-3.5 w-3.5 text-tick-sent"
            aria-label="Sent"
            title="Sent"
          />
        );
      case "failed":
        return (
          <XCircle
            className="h-3.5 w-3.5 text-red-500"
            aria-label="Failed to send"
            title="Failed to send"
          />
        );
      case "pending":
        return (
          <Clock
            className="h-3.5 w-3.5 text-gray-400"
            aria-label="Pending"
            title="Pending"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex w-full ${
        direction === "outbound" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[78%] rounded-lg px-3 py-2 text-sm shadow-sm animate-message-in ${
          direction === "outbound"
            ? "bg-chat-outgoing text-black"
            : "bg-chat-incoming"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{children}</p>
        <div className="mt-1 flex items-center gap-1 justify-end">
          {time && (
            <span
              className="text-[10px] text-muted-foreground"
              title={time}
              aria-label={`Message time: ${time}`}
            >
              {time}
            </span>
          )}
          {renderTick()}
        </div>
      </div>
    </div>
  );
}
