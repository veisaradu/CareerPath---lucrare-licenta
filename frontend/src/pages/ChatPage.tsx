import { useEffect, useRef, useState } from "react";
import {
  getSessions,
  createSession,
  getMessages,
  sendMessage,
  type ChatSession,
  type ChatMessage,
} from "../api/chat";

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSessions()
      .then((data) => {
        setSessions(data);
        if (data.length > 0) selectSession(data[data.length - 1]);
      })
      .finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectSession = async (session: ChatSession) => {
    setActiveSession(session);
    setMessages([]);
    setLoadingMessages(true);
    try {
      const msgs = await getMessages(session.id);
      setMessages(msgs.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ));
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleNewSession = async () => {
    const session = await createSession();
    setSessions((prev) => [...prev, session]);
    setActiveSession(session);
    setMessages([]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !input.trim() || sending) return;

    const text = input.trim();
    setInput("");
    setSending(true);

    // Optimistic user message
    const tempMsg: ChatMessage = {
      id: Date.now(),
      session: activeSession.id,
      sender: "user",
      message: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const aiMsg = await sendMessage(activeSession.id, text);
      setMessages((prev) => [...prev, aiMsg]);

      // Actualizează topic-ul sesiunii în sidebar
      if (!activeSession.topic) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id ? { ...s, topic: text.slice(0, 60) } : s
          )
        );
        setActiveSession((prev) =>
          prev ? { ...prev, topic: text.slice(0, 60) } : prev
        );
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          session: activeSession.id,
          sender: "ai",
          message: "Eroare la trimiterea mesajului. Încearcă din nou.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 120px)",
        gap: "1rem",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      {/* Sidebar sesiuni */}
      <div
        style={{
          width: "220px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          overflowY: "auto",
        }}
      >
        <button
          onClick={handleNewSession}
          style={{
            background: "#646cff",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "0.6rem",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.85rem",
            marginBottom: "0.5rem",
          }}
        >
          + Conversație nouă
        </button>

        {loadingSessions ? (
          <p style={{ color: "#666", fontSize: "0.85rem" }}>Se încarcă...</p>
        ) : sessions.length === 0 ? (
          <p style={{ color: "#555", fontSize: "0.82rem" }}>
            Nicio conversație
          </p>
        ) : (
          [...sessions].reverse().map((s) => (
            <button
              key={s.id}
              onClick={() => selectSession(s)}
              style={{
                background:
                  activeSession?.id === s.id ? "#1a1a3a" : "#141414",
                border: `1px solid ${
                  activeSession?.id === s.id ? "#646cff" : "#2a2a2a"
                }`,
                borderRadius: "6px",
                padding: "0.6rem 0.75rem",
                cursor: "pointer",
                textAlign: "left",
                color: "#ddd",
                fontSize: "0.82rem",
                lineHeight: 1.4,
              }}
            >
              <div
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.topic || "Conversație nouă"}
              </div>
              <div style={{ color: "#555", fontSize: "0.72rem", marginTop: "0.2rem" }}>
                {new Date(s.created_at).toLocaleDateString("ro-RO")}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          border: "1px solid #2a2a2a",
          borderRadius: "10px",
          overflow: "hidden",
          background: "#141414",
        }}
      >
        {!activeSession ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#555",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>💬</span>
            <p>Selectează sau creează o conversație</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              style={{
                padding: "0.9rem 1.25rem",
                borderBottom: "1px solid #222",
                fontSize: "0.9rem",
                color: "#aaa",
              }}
            >
              {activeSession.topic || "Conversație nouă"} ·{" "}
              <span style={{ color: "#555" }}>
                Asistent CareerPath
              </span>
            </div>

            {/* Mesaje */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {loadingMessages ? (
                <p style={{ color: "#555" }}>Se încarcă mesajele...</p>
              ) : messages.length === 0 ? (
                <div style={{ color: "#555", textAlign: "center", marginTop: "2rem" }}>
                  <p>Scrie primul mesaj 👇</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))
              )}
              {sending && (
                <div style={{ alignSelf: "flex-start" }}>
                  <TypingIndicator />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              style={{
                padding: "0.9rem 1.25rem",
                borderTop: "1px solid #222",
                display: "flex",
                gap: "0.75rem",
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrie un mesaj..."
                disabled={sending}
                style={{
                  flex: 1,
                  padding: "0.6rem 0.9rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  background: "#1a1a1a",
                  color: "#fff",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as unknown as React.FormEvent);
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                style={{
                  background:
                    sending || !input.trim() ? "#2a2a2a" : "#646cff",
                  color: sending || !input.trim() ? "#555" : "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.6rem 1.1rem",
                  cursor:
                    sending || !input.trim() ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                }}
              >
                Trimite
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.sender === "user";
  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "75%",
      }}
    >
      <div
        style={{
          padding: "0.65rem 1rem",
          borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
          background: isUser ? "#646cff" : "#1e1e1e",
          color: isUser ? "#fff" : "#ddd",
          fontSize: "0.9rem",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          border: isUser ? "none" : "1px solid #2a2a2a",
        }}
      >
        {msg.message}
      </div>
      <div
        style={{
          fontSize: "0.7rem",
          color: "#555",
          marginTop: "0.2rem",
          textAlign: isUser ? "right" : "left",
        }}
      >
        {new Date(msg.timestamp).toLocaleTimeString("ro-RO", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div
      style={{
        padding: "0.65rem 1rem",
        background: "#1e1e1e",
        border: "1px solid #2a2a2a",
        borderRadius: "12px 12px 12px 2px",
        display: "flex",
        gap: "4px",
        alignItems: "center",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#646cff",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}