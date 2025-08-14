import {
  createContext,
  useContext,
  useState,
  useRef,
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

  const lastLoadedWaIdRef = useRef(null);

  const loadMessages = useCallback(async (waId) => {
    if (!waId || waId === lastLoadedWaIdRef.current) return;

    lastLoadedWaIdRef.current = waId;

    try {
      setLoadingMessages(true);
      const data = await fetchMessages(waId);
      setMessages(data.messages ?? data);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

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
        await markRead(currentChat.waId, unreadIds);
        setMessages((prev) =>
          prev.map((m) =>
            unreadIds.includes(m._id) ? { ...m, status: "read" } : m
          )
        );

        // update contact unread count
        setContacts((prev) =>
          prev.map((c) =>
            c.wa_id === currentChat.waId ? { ...c, unread_count: 0 } : c
          )
        );
      }
    } catch (e) {
      console.error("Failed to mark read:", e);
    }
  }, [currentChat, messages]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (currentChat) {
      loadMessages(currentChat.wa_id);
      markCurrentChatRead();
    }
  }, [currentChat, loadMessages, markCurrentChatRead]);

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

  const refreshMessages = useCallback(() => {
    if (currentChat?.waId) {
      loadMessages(currentChat.waId);
    }
  }, [currentChat?.waId, loadMessages]);

  useEffect(() => {
    socket.on("contact_updated", (updatedContact) => {
      setContacts((prev) =>
        prev.map((c) => (c.wa_id === updatedContact.wa_id ? updatedContact : c))
      );
    });
    return () => socket.off("contact_updated");
  }, []);

  useEffect(() => {
    socket.on(
      "conversation:update",
      ({ wa_id, last_message, last_timestamp }) => {
        setContacts((prev) =>
          prev.map((c) =>
            c.wa_id === wa_id ? { ...c, last_message, last_timestamp } : c
          )
        );
      }
    );

    return () => socket.off("conversation:update");
  }, [socket]);

  function updateContactAfterMessage(waId, message) {
    const updatedContacts = contacts.map((contact) => {
      if (contact.waId === waId) {
        return {
          ...contact,
          lastMessagePreview: message,
          lastMessageAt: new Date().toISOString(), // or from server
          unread: 0, // or update accordingly
        };
      }
      return contact;
    });

    // Sort contacts so the most recent message comes first
    updatedContacts.sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );

    setContacts(updatedContacts); // Add this setter in context if not already there
  }

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
        refreshMessages,
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
