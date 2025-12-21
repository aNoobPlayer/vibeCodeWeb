import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

interface User {
  id: string;
  username: string;
  role: string;
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authRequestId = useRef(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const requestId = ++authRequestId.current;
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (requestId !== authRequestId.current) return null;

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      if (requestId !== authRequestId.current) return null;
      setUser(null);
      return null;
    } finally {
      if (requestId === authRequestId.current) {
        setLoading(false);
      }
    }
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    await response.json(); // consume payload so the cookie can be set
    const userData = await checkAuth();
    if (!userData) {
      throw new Error("Unable to verify login. Please try again.");
    }

    if (userData.role === "admin") {
      setLocation("/admin");
    } else {
      setLocation("/student");
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    authRequestId.current += 1;
    setUser(null);
    setLocation("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
