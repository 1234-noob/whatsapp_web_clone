import { Check, CheckCheck } from "lucide-react";

export default function MessageBubble({ fromMe, time, status, children }) {
  const tick = fromMe ? (
    status === "read" ? (
      <CheckCheck className="h-3.5 w-3.5 text-whatsapp-blue" />
    ) : status === "delivered" ? (
      <CheckCheck className="h-3.5 w-3.5 text-tick-delivered" />
    ) : (
      <Check className="h-3.5 w-3.5 text-tick-sent" />
    )
  ) : null;

  return (
    <div className={`flex w-full ${fromMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-lg px-3 py-2 text-sm shadow-sm animate-message-in ${
          fromMe ? "bg-chat-outgoing text-black" : "bg-chat-incoming"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{children}</p>
        <div className="mt-1 flex items-center gap-1 justify-end">
          <span className="text-[10px] text-muted-foreground">{time}</span>
          {tick}
        </div>
      </div>
    </div>
  );
}
