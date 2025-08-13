import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  fetchContacts,
  fetchMessages,
  sendMessage as apiSendMessage,
  markRead,
} from "../services/axios"; // new API helpers
import socket from "@/services/socket";
import { toast } from "@/hooks/use-toast";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  /** 🔹 Load all contacts from backend */
  const loadContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const data = await fetchContacts();
      setContacts(data.contacts ?? data);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  /** 🔹 Load messages for a specific contact */
  const loadMessages = useCallback(async (waId) => {
    if (!waId) return;
    try {
      setLoadingMessages(true);
      const data = await fetchMessages(waId);
      setMessages(data.messages ?? data);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  /** 🔹 Send message with optimistic UI + reconciliation */
  const sendMessage = useCallback(async (waId, text) => {
    const trimmed = text?.trim();
    if (!trimmed) return;

    const tempId = crypto.randomUUID();
    const tempMessage = {
      _id: tempId,
      text: trimmed,
      from_me: true,
      timestamp: new Date().toISOString(),
      status: "pending",
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await apiSendMessage(waId, trimmed, {
        clientMessageId: tempId,
      });
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempId ? { ...res.message, status: "sent" } : m
        )
      );
      // update contacts preview
      setContacts((prev) =>
        prev.map((c) =>
          c.wa_id === waId
            ? {
                ...c,
                last_message: trimmed,
                last_timestamp: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, status: "failed" } : m))
      );
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }, []);

  /** 🔹 Mark all messages in current chat as read */
  const markCurrentChatRead = useCallback(async () => {
    if (!currentChat) return;
    try {
      const unreadIds = messages
        .filter((m) => !m.from_me && m.status !== "read")
        .map((m) => m._id);
      if (unreadIds.length) {
        await markRead(currentChat.wa_id, unreadIds);
        setMessages((prev) =>
          prev.map((m) =>
            unreadIds.includes(m._id) ? { ...m, status: "read" } : m
          )
        );
        // update contact unread count
        setContacts((prev) =>
          prev.map((c) =>
            c.wa_id === currentChat.wa_id ? { ...c, unread_count: 0 } : c
          )
        );
      }
    } catch (e) {
      console.error("Failed to mark read:", e);
    }
  }, [currentChat, messages]);

  /** 🔹 Initial contacts load */
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  /** 🔹 Load messages when active chat changes */
  useEffect(() => {
    if (currentChat) {
      loadMessages(currentChat.wa_id);
      markCurrentChatRead();
    }
  }, [currentChat, loadMessages, markCurrentChatRead]);

  /** 🔹 Socket: incoming messages */
  useEffect(() => {
    socket.on("new_message", (msg) => {
      if (msg.wa_id === currentChat?.wa_id) {
        setMessages((prev) => [...prev, msg]);
      }
      setContacts((prev) =>
        prev.map((c) =>
          c.wa_id === msg.wa_id
            ? {
                ...c,
                last_message: msg.text,
                last_timestamp: msg.timestamp,
                unread_count:
                  msg.wa_id === currentChat?.wa_id
                    ? c.unread_count
                    : (c.unread_count || 0) + 1,
              }
            : c
        )
      );
    });
    return () => socket.off("new_message");
  }, [currentChat]);

  /** 🔹 Socket: contact updates */
  useEffect(() => {
    socket.on("contact_updated", (updatedContact) => {
      setContacts((prev) =>
        prev.map((c) => (c.wa_id === updatedContact.wa_id ? updatedContact : c))
      );
    });
    return () => socket.off("contact_updated");
  }, []);

  return (
    <ChatContext.Provider
      value={{
        contacts,
        currentChat,
        setCurrentChat,
        messages,
        loading: loadingContacts || loadingMessages,
        sendMessage,
        refreshContacts: loadContacts,
        refreshMessages: () => currentChat && loadMessages(currentChat.wa_id),
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
};
