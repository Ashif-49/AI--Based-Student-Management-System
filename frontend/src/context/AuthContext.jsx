import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAuthenticatedUser = (nextUser) => {
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const clearAuthenticatedUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await authAPI.me();
    const nextUser = res.data.user;
    return setAuthenticatedUser(nextUser);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');

    if (stored) {
      setUser(JSON.parse(stored));
    }

    if (!token) {
      setLoading(false);
      return;
    }

    refreshUser()
      .catch(() => {
        clearAuthenticatedUser();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    return setAuthenticatedUser(userData);
  };

  const logout = () => {
    clearAuthenticatedUser();
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser, setAuthenticatedUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
