import { useState, useEffect } from 'react';
import { AuthState } from '../types/auth';

const STORAGE_KEY = 'auth_state';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123'; // In a real app, this would be handled securely

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    // Check for existing auth state on component mount
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        setAuthState(parsed);
      } catch (err) {
        console.error('Failed to parse auth state:', err);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const authData = { 
        isAuthenticated: true, 
        user: username,
        timestamp: Date.now() 
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
      setAuthState({ isAuthenticated: true, user: username });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthState({ isAuthenticated: false, user: null });
    // Redirect to login page
    window.location.href = 'admin.html';
  };

  return { ...authState, login, logout };
}