import { createContext, useContext, useState, useEffect } from "react";
import { fetchContacts, fetchMessages } from "../config/axios";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await fetchContacts();
      setContacts(data);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (waId) => {
    try {
      setLoading(true);
      const data = await fetchMessages(waId);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (waId, text) => {
    try {
      // Optimistic update
      const tempId = crypto.randomUUID();
      const tempMessage = {
        _id: tempId,
        text,
        from_me: true,
        timestamp: new Date().toISOString(),
        status: "sending",
      };

      setMessages((prev) => [...prev, tempMessage]);

      const response = await api.post(`/messages/${waId}`, { text });

      // Update messages with server response
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? response.data : msg))
      );

      // Update contact's last message
      setContacts((prev) =>
        prev.map((contact) =>
          contact.wa_id === waId
            ? {
                ...contact,
                last_message: text,
                last_timestamp: new Date().toISOString(),
              }
            : contact
        )
      );

      // Simulate message states (remove in production)
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === response.data._id
              ? { ...msg, status: "delivered" }
              : msg
          )
        );
      }, 1000);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === response.data._id ? { ...msg, status: "read" } : msg
          )
        );
      }, 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (currentChat) {
      loadMessages(currentChat.wa_id);
    }
  }, [currentChat]);

  return (
    <ChatContext.Provider
      value={{
        contacts,
        currentChat,
        setCurrentChat,
        messages,
        loading,
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
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
