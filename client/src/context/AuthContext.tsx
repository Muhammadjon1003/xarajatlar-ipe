import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('xarajatlar_user');
    return savedUser
      ? JSON.parse(savedUser)
      : {
          id: 'test-admin',
          firstName: 'Admin',
          lastName: 'Boshliq',
          phone: '+998901234567',
          roleCode: 'SUPER_ADMIN',
          roleDisplayName: 'Direktor (Test Rejimi)',
        };
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('xarajatlar_token') || 'test-token';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Sync backend user if token exists
    const verifyUser = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('xarajatlar_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn('Auth verification skipped (test mode active)', err);
      }
    };
    verifyUser();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('xarajatlar_token', newToken);
    localStorage.setItem('xarajatlar_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('xarajatlar_token');
    localStorage.removeItem('xarajatlar_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
