import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import api from "../services/api";
import { saveToken, getToken, removeToken } from "../services/auth";
import { Usuari, LoginRequest, RegisterRequest } from "../types";

interface AuthContextType {
  user: Usuari | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  /** Torna a llegir l'usuari del servidor: cal després d'editar el perfil */
  refreshUser: () => Promise<void>;
  /** Actualitza l'usuari en memòria sense tornar a consultar el servidor */
  setUser: (usuari: Usuari) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuari | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      const { data } = await api.get<Usuari>("/auth/me");
      setUser(data);
    } catch {
      await removeToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (credentials: LoginRequest) => {
    const { data: authData } = await api.post<{ access_token: string; token_type: string }>("/auth/login", credentials);
    await saveToken(authData.access_token);
    const { data: userData } = await api.get<Usuari>("/auth/me");
    setUser(userData);
  }, []);

  const register = useCallback(async (userData: RegisterRequest) => {
    await api.post("/auth/register", userData);
    await login({ email: userData.email, password: userData.password });
  }, [login]);

  const logout = useCallback(async () => {
    await removeToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<Usuari>("/auth/me");
    setUser(data);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth s'ha de fer servir dins d'AuthProvider");
  return ctx;
}
