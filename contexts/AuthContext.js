import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Create the auth context
export const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [membershipChecked, setMembershipChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authCheckTimeout = null;
    
    // Check for existing session
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error && mounted) {
          console.error('Error checking auth session:', error);
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (mounted) {
          setUser(data?.session?.user || null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error in auth check:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };
    
    checkUser();
    
    // Add a safety timeout
    authCheckTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('Auth context check timed out');
        setLoading(false);
      }
    }, 5000);
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );
    
    // Cleanup
    return () => {
      mounted = false;
      if (authCheckTimeout) clearTimeout(authCheckTimeout);
      if (authListener?.subscription) authListener.subscription.unsubscribe();
    };
  }, []);
  
  // Values to be provided by the context
  const value = {
    user,
    loading,
    membershipChecked,
    setMembershipChecked,
    isAuthenticated: !!user,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
