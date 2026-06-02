import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Chat } from "../components/Chat";

export function ChatPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function nuevaConversacion() {
    setSessionId(crypto.randomUUID());
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.headerTitle}>Asistente de Soporte</span>
        <div style={styles.headerActions}>
          <button style={styles.secondaryBtn} onClick={nuevaConversacion}>
            Nueva conversación
          </button>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main style={styles.main}>
        <Chat sessionId={sessionId} />
      </main>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1.5rem",
    backgroundColor: "#1e293b",
    color: "#fff",
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: "1rem",
  },
  headerActions: {
    display: "flex",
    gap: "0.5rem",
  },
  secondaryBtn: {
    padding: "0.4rem 0.9rem",
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "1px solid #475569",
    borderRadius: "0.4rem",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  logoutBtn: {
    padding: "0.4rem 0.9rem",
    backgroundColor: "transparent",
    color: "#f87171",
    border: "1px solid #f87171",
    borderRadius: "0.4rem",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  main: {
    flex: 1,
    overflow: "hidden",
  },
};
