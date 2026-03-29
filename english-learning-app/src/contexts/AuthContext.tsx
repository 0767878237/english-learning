// contexts/AuthContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import type { User, AuthState } from '../types';
import { AuthService } from '../services/AuthService';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearSuccessMessage: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const storedToken = AuthService.getStoredToken();
    if (storedToken && AuthService.isTokenValid(storedToken)) {
      setToken(storedToken);
      // In real app, fetch user data from token or API
      try {
        const decoded = JSON.parse(atob(storedToken));
        setUser({
          id: decoded.userId,
          username: decoded.username,
          createdAt: new Date(),
        });
      } catch {
        AuthService.clearToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(undefined);
    try {
      const { token: newToken, user: newUser } = await AuthService.login(username, password);
      AuthService.storeToken(newToken);
      setToken(newToken);
      setUser(newUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(undefined);
    setSuccessMessage(undefined);
    try {
      const { token: newToken, user: newUser, message } = await AuthService.signup(username, email, password);
      AuthService.storeToken(newToken);
      setToken(newToken);
      setUser(newUser);
      if (message) {
        setSuccessMessage(message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.clearToken();
    setToken(null);
    setUser(null);
    setError(undefined);
    setSuccessMessage(undefined);
  };

  const clearSuccessMessage = () => {
    setSuccessMessage(undefined);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoggedIn: !!token && !!user,
    isLoading,
    error,
    successMessage,
    login,
    signup,
    logout,
    clearSuccessMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
