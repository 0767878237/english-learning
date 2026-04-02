// contexts/AuthContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import type { User, AuthState } from '../types';
import { AuthService } from '../services/AuthService';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const refreshedToken = await AuthService.refreshAccessToken();
        const currentUser = await AuthService.fetchCurrentUser(refreshedToken);
        if (refreshedToken && currentUser) {
          setToken(refreshedToken);
          setUser(currentUser);
        }
      } catch {
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(undefined);
    try {
      const { token: newToken, user: newUser } = await AuthService.login(username, password);
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
      setToken(newToken);
      setUser(newUser);
      if (message) setSuccessMessage(message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } finally {
      setToken(null);
      setUser(null);
      setError(undefined);
      setSuccessMessage(undefined);
    }
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
