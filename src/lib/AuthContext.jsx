import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/supabaseClient';
import { appParams } from '@/lib/app-params';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // MOCK: In a full Supabase migration, app settings are typically handled 
      // via a 'settings' table or hardcoded config.
      setAppPublicSettings({
        id: appParams.appId,
        public_settings: {
          name: "Fairway Impact",
          theme: "light"
        }
      });
      
      // Skip the legacy Base44 fetch and proceed to check auth
      await checkUserAuth();
      
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('App state check failed:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const normalizeRole = (role) => {
    if (!role || typeof role !== 'string') return 'user';
    return role.trim().toLowerCase();
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      if (currentUser) {
        currentUser.role = normalizeRole(currentUser.role);
      }
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setIsLoadingAuth(false);
      return currentUser;
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      
      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  const signIn = async (email, password) => {
    try {
      await base44.auth.signIn(email, password);
      const profile = await checkUserAuth();
      return profile;
    } catch (error) {
      console.error('SignIn failed:', error);
      throw error;
    }
  };

  const signUp = async (email, password, metadata) => {
    try {
      const u = await base44.auth.signUp(email, password, metadata);
      // After signup, we might need to wait for trigger or manually create profile
      await checkUserAuth();
      return u;
    } catch (error) {
      console.error('SignUp failed:', error);
      throw error;
    }
  };

  const isAdmin = user?.role === 'admin';
  const refreshUser = checkUserAuth;

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isAdmin,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      signIn,
      signUp,
      navigateToLogin,
      checkAppState,
      refreshUser
    }}>
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
