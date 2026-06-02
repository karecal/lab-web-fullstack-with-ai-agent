import { createContext, useContext, useState } from "react";
import { login as apiLogin, logout as apiLogout, isAuthenticated } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuth, setIsAuth] = useState(isAuthenticated);

  async function login(email, password) {
    await apiLogin(email, password);
    setIsAuth(true);
  }

  function logout() {
    apiLogout();
    setIsAuth(false);
  }

  return (
    <AuthContext.Provider value={{ isAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
