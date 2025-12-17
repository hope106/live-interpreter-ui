import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState } from '../types';

interface AuthContextType {
  auth: AuthState;
  login: () => void;
  logout: () => void;
  setToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: null,
  });

  // 로컬 스토리지에서 토큰 복원 (자동 로그인)
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      verifyAndSetToken(token);
    }
  }, []);

  const verifyAndSetToken = async (token: string) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/auth/verify?token=${token}`);

      if (response.ok) {
        const data = await response.json();
        setAuth({
          isAuthenticated: true,
          token,
          user: {
            email: data.email,
            name: data.name,
          },
        });
        localStorage.setItem('auth_token', token);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
  };

  const login = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    // 백엔드 로그인 엔드포인트로 리다이렉트
    window.location.href = `${backendUrl}/auth/google/login`;
  };

  const logout = () => {
    setAuth({
      isAuthenticated: false,
      token: null,
      user: null,
    });
    localStorage.removeItem('auth_token');
  };

  const setToken = async (token: string) => {
    await verifyAndSetToken(token);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
