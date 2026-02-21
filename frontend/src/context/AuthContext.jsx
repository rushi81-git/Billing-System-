import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('pos_token');
    const stored = localStorage.getItem('pos_owner');
    if (token && stored) {
      try {
        setOwner(JSON.parse(stored));
      } catch {
        localStorage.removeItem('pos_owner');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, owner: ownerData } = res.data.data;
    localStorage.setItem('pos_token', token);
    localStorage.setItem('pos_owner', JSON.stringify(ownerData));
    setOwner(ownerData);
    return ownerData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (_) {}
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_owner');
    setOwner(null);
    toast.success('Logged out successfully.');
  }, []);

  const isAuthenticated = !!owner;

  return (
    <AuthContext.Provider value={{ owner, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
