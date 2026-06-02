import { useState, useRef, useEffect } from "react";
import { getToken } from "../api/auth";

const API_URL = import.meta.env.VITE_API_URL;

export function Chat({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            setLoading(false);
            return;
          }
          if (data.startsWith("[ERROR]")) {
            throw new Error(data.slice(8));
          }
          const content = data.replace(/\\n/g, "\n");
          setMessages((prev) => {
            const msgs = [...prev];
            const last = msgs[msgs.length - 1];
            if (last?.role === "assistant") {
              msgs[msgs.length - 1] = { ...last, content: last.content + content };
            }
            return msgs;
          });
        }
      }
    } catch (err) {
      setError(
        err.message.includes("fetch")
          ? "No se pudo conectar con el servidor. Verifica que el backend esté activo."
          : err.message
      );
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.messages}>
        {messages.length === 0 && (
          <p style={styles.placeholder}>
            Escribe un mensaje para empezar. Puedes preguntar sobre pedidos (ej: PED-1234),
            políticas de devolución, reembolsos y más.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble),
            }}
          >
            {msg.content || (loading && i === messages.length - 1 ? "▌" : "")}
          </div>
        ))}
        {error && <div style={styles.error}>{error}</div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={styles.form}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          disabled={loading}
        />
        <button style={styles.button} type="submit" disabled={loading || !input.trim()}>
          {loading ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    fontFamily: "sans-serif",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  placeholder: {
    color: "#888",
    textAlign: "center",
    marginTop: "2rem",
    fontSize: "0.9rem",
  },
  bubble: {
    maxWidth: "70%",
    padding: "0.75rem 1rem",
    borderRadius: "1rem",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#2563eb",
    color: "#fff",
    borderBottomRightRadius: "0.25rem",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    color: "#1e293b",
    borderBottomLeftRadius: "0.25rem",
  },
  error: {
    alignSelf: "center",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "0.5rem 1rem",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
  },
  form: {
    display: "flex",
    gap: "0.5rem",
    padding: "1rem",
    borderTop: "1px solid #e2e8f0",
  },
  input: {
    flex: 1,
    padding: "0.75rem 1rem",
    borderRadius: "0.5rem",
    border: "1px solid #cbd5e1",
    fontSize: "1rem",
    outline: "none",
  },
  button: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    cursor: "pointer",
  },
};
