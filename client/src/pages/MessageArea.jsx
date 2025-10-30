import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function MessageArea({ selectedUser, session }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentConversation, setCurrentConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const fetchMessagesFromBackend = async (selectedUser) => {
    if (!session) return;
    try {
      const res = await fetch(`${API_BASE_URL}/messages/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setCurrentConversation(data.conversation);
      setMessages(data.messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    if (selectedUser && session) fetchMessagesFromBackend(selectedUser);
  }, [selectedUser, session]);

  useEffect(() => {
    if (!currentConversation) return;
    const channel = supabase
      .channel(`conversation-${currentConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${currentConversation.id}`,
        },
        (payload) => {
          console.log("Realtime message:", payload.new);
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversation]);

  const handleSend = async () => {
    if (!input.trim() || !currentConversation || !session) return;
    try {
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          conversation_id: currentConversation.id,
          message: input,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Failed to send message:", err);
        return;
      }
      setInput("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (!selectedUser) {
    return (
      <div className="empty-state">
        <div className="empty-state-content">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3>Select a conversation</h3>
          <p>Choose a user from the list to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-container">
      <div className="message-header">
        <div className="message-header-avatar">
          {selectedUser.user_metadata.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <h3 className="message-header-name">{selectedUser.user_metadata.name}</h3>
      </div>

      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`message ${msg.sender_id === session.user.id ? 'message-sent' : 'message-received'}`}
            >
              <div className="message-bubble">
                <p className="message-text">{msg.message}</p>
                <span className="message-time">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
  <div ref={messagesEndRef} />
</div>

      <div className="message-input-container">
        <input
          type="text"
          className="message-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="send-btn" onClick={handleSend}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}