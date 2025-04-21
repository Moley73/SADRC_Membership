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
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error getting user:', error);
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (data?.user) {
          console.log('User authenticated:', data.user.email);
          setUser(data.user);
          
          // Check membership status
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('has_membership')
              .eq('id', data.user.id)
              .single();
              
            if (profileError) {
              console.error('Error checking membership:', profileError);
            } else {
              console.log('Membership status checked:', profile?.has_membership);
            }
          } catch (membershipError) {
            console.error('Error in membership check:', membershipError);
          }
        } else {
          setUser(null);
        }
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        setUser(null);
        router.push('/login');
      }
    } catch (err) {
      console.error('Unexpected error during logout:', err);
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
