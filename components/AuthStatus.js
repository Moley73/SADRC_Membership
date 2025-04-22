import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';

export default function AuthStatus() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [membershipChecked, setMembershipChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initial user check
    const getUser = async () => {
      try {
        setLoading(true);
        // Use getSession instead of getUser for more reliable authentication
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (!data?.session?.user) {
          console.log('No active session found');
          setUser(null);
          setLoading(false);
          return;
        }
        
        const user = data.session.user;
        console.log('User authenticated:', user.email);
        setUser(user);
        
        // No need to check membership status in this component
        // This was causing errors with the non-existent profiles table
      } catch (err) {
        console.error('Unexpected error getting user:', err);
        setUser(null);
      } finally {
        setLoading(false);
        setMembershipChecked(true);
      }
    };
    
    getUser();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setUser(session?.user || null);
      setLoading(false);
      setMembershipChecked(true);
    });
    
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      // Use a more robust approach to sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Error signing out:', error);
        alert('Failed to log out. Please try again.');
      } else {
        console.log('Successfully signed out');
        setUser(null);
        // Force a page reload to clear any cached state
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Unexpected error during logout:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Only show loading spinner briefly during initial load
  if (loading && !membershipChecked) {
    return <CircularProgress size={20} color="inherit" />;
  }

  if (user) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="inherit">
          Logged in as {user.email}
        </Typography>
        <Button color="inherit" onClick={handleLogout} size="small" sx={{ ml: 1 }}>
          Log Out
        </Button>
      </Box>
    );
  } else {
    return (
      <Button color="inherit" onClick={() => router.push('/login')} size="small">
        Log In
      </Button>
    );
  }
}
