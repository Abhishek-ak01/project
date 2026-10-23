import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS } from '../services/mockData';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { addToast } = useToast();
  
  // Default to customer role for smooth onboarding, with instant switchability
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('localloop_demo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    return DEMO_USERS.customer;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('localloop_demo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('localloop_demo_user');
    }
  }, [user]);

  // Instant Persona Switcher for Hackathon Judges & Demos
  const switchDemoRole = (role) => {
    if (DEMO_USERS[role]) {
      setUser(DEMO_USERS[role]);
      addToast(`Switched active persona to ${DEMO_USERS[role].fullName} (${role.toUpperCase()})`, 'info');
    }
  };

  const login = async ({ email, password, role = 'customer' }) => {
    // In hackathon mode, authenticate based on role
    const matchedUser = DEMO_USERS[role] || {
      id: `user-${Date.now()}`,
      email,
      fullName: email.split('@')[0],
      role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    };
    setUser(matchedUser);
    addToast(`Welcome back, ${matchedUser.fullName}!`, 'success');
    return matchedUser;
  };

  const registerCustomer = async ({ fullName, email, phone, neighborhood }) => {
    const newUser = {
      id: `user-customer-${Date.now()}`,
      email,
      fullName,
      phone,
      neighborhood: neighborhood || 'Greenville Downtown',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    };
    setUser(newUser);
    addToast(`Account created! Welcome to LocalLoop, ${fullName}.`, 'success');
    return newUser;
  };

  const registerSeller = async ({ fullName, storeName, email, phone, neighborhood, description }) => {
    const newSellerId = `seller-${Date.now()}`;
    const newUser = {
      id: `user-seller-${Date.now()}`,
      email,
      fullName,
      phone,
      role: 'seller',
      sellerId: newSellerId,
      storeName,
      neighborhood: neighborhood || 'Eastside Mill District',
      description,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    };
    setUser(newUser);
    addToast(`Seller account registered! Welcome ${storeName}.`, 'success');
    return newUser;
  };

  const logout = () => {
    setUser(null);
    addToast('You have been logged out.', 'info');
  };

  const value = {
    user,
    role: user?.role || 'guest',
    isAuthenticated: Boolean(user),
    isCustomer: user?.role === 'customer',
    isSeller: user?.role === 'seller',
    isAdmin: user?.role === 'admin',
    switchDemoRole,
    login,
    registerCustomer,
    registerSeller,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
