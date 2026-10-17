import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'voter'
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setRole(response.data.user.role || 'voter');
      }
    } catch {
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async ({ role: selectedRole, identifier, password, rememberMe }) => {
    const response = await apiClient.post('/auth/login', {
      role: selectedRole,
      identifier,
      password,
      rememberMe,
    });

    if (response.success && response.data) {
      setUser(response.data.user);
      setRole(response.data.role);
      showToast(
        selectedRole === 'admin'
          ? `Welcome back, ${response.data.user.fullName || response.data.user.username}!`
          : `Welcome! Access verified for voter.`,
        'success'
      );
      return response.data;
    }
    throw new Error('Login failed');
  };

  const register = async ({ username, email, password, fullName }) => {
    const response = await apiClient.post('/auth/register', {
      username,
      email,
      password,
      fullName,
    });

    if (response.success && response.data) {
      setUser(response.data.user);
      setRole(response.data.role);
      showToast(
        `Welcome to LimeSurvey, ${response.data.user.fullName || response.data.user.username}!`,
        'success'
      );
      return response.data;
    }
    throw new Error('Registration failed');
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setRole(null);
      showToast('You have been logged out successfully.', 'info');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isAdmin: role === 'admin' || role === 'superadmin',
        isVoter: role === 'voter',
        isLoading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
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
