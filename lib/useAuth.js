import { useState, useEffect } from 'react';
import { supabase, isAdmin as checkIsAdmin } from './supabaseClient';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          setError(error.message);
        } else {
          setSession(data.session);
          setUser(data.session?.user || null);
        }
      } catch (err) {
        console.error('Unexpected error during auth initialization:', err);
        setError('Authentication initialization failed');
      } finally {
        // Always set loading to false to prevent infinite loading states
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    // Setup the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setLoading(false);
      }
    );
    
    // Clean up subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    let active = true;
    if (!user) {
      setIsAdmin(false);
      return undefined;
    }
    checkIsAdmin().then((result) => {
      if (active) setIsAdmin(result);
    });
    return () => {
      active = false;
    };
  }, [user?.email]);
  
  // Helper functions
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error.message);
        setError(error.message);
      }
    } catch (err) {
      console.error('Unexpected error during sign out:', err);
      setError('Sign out failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh session helper
  const refreshSession = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error.message);
        setError(error.message);
      } else {
        setSession(data.session);
        setUser(data.session?.user || null);
      }
    } catch (err) {
      console.error('Unexpected error during session refresh:', err);
      setError('Session refresh failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Return all necessary auth details and functions
  return {
    user,
    session,
    loading,
    error,
    isAdmin,
    signOut,
    refreshSession,
    getToken: () => session?.access_token,
  };
}
