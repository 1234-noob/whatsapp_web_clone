import { useState, useCallback } from "react";
import { Paperclip, Smile, Mic, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useChat } from "../context/ChatContext";

export default function MessageComposer() {
  const [text, setText] = useState("");
  const { currentChat, sendMessage } = useChat();

  const handleSend = useCallback(async () => {
    const value = text.trim();
    if (!value || !currentChat?.wa_id) return;

    try {
      await sendMessage(currentChat.wa_id, value);
      setText("");
      toast({
        title: "Message sent",
        description: "Your message was sent successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  }, [text, currentChat, sendMessage]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentChat) return null;

  return (
    <footer className="border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full items-center gap-2 px-4 py-2">
        <button
          type="button"
          className="h-10 w-10 rounded-full hover:bg-muted/60 inline-flex items-center justify-center text-muted-foreground transition-colors"
          aria-label="Attach file"
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="h-10 w-10 rounded-full hover:bg-muted/60 inline-flex items-center justify-center text-muted-foreground transition-colors"
          aria-label="Open emoji picker"
          title="Emoji"
        >
          <Smile className="h-5 w-5" />
        </button>

        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message"
          className="flex-1 bg-background focus-visible:ring-whatsapp-green"
          aria-label="Type a message"
        />

        {text.trim() ? (
          <button
            type="button"
            onClick={handleSend}
            className="h-10 w-10 rounded-full bg-whatsapp-green text-white inline-flex items-center justify-center hover:opacity-90 transition-opacity"
            aria-label="Send message"
            title="Send"
          >
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            className="h-10 w-10 rounded-full hover:bg-muted/60 inline-flex items-center justify-center text-muted-foreground transition-colors"
            aria-label="Record voice message"
            title="Record voice"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
      </div>
    </footer>
  );
}
