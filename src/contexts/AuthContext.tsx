// Authentication Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api.service';
import { LoginRequest, LoginResponse } from '../services/api.config';

interface AuthContextType {
  isAuthenticated: boolean;
  user: LoginResponse | null;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState<LoginResponse | null>({
    access_token: 'admin-mock-token',
    token_type: 'bearer',
    user_id: 1,
    username: 'admin',
    role: 'admin'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Override logic to be fully authenticated without login
    apiService.setToken('admin-mock-token');
    setIsAuthenticated(true);
  }, []);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    return true;
  };

  const logout = () => {
    // No-op for admin-only mode
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
