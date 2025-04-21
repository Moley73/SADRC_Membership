import Head from 'next/head';
import { Container, Typography, Box, Button } from '@mui/material';
import Link from 'next/link';
import UpdateButton from '../components/UpdateButton';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [hasMembership, setHasMembership] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // Get current user
        const { data, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Error getting user:', authError);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        const user = data?.user;
        
        if (!user) {
          console.log('No user logged in');
          setIsAuthenticated(false);
          setDebugInfo({ error: 'No user logged in' });
          setLoading(false);
          return;
        }
        
        setIsAuthenticated(true);
        console.log('Current user:', user.email);
        
        // Check for user's membership
        const { data: memberData, error } = await supabase
          .from('members')
          .select('id, email, first_name, surname')
          .eq('email', user.email)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching membership:', error);
          setDebugInfo({ error: error.message });
          setLoading(false);
          return;
        }
        
        // If member is found, set hasMembership to true
        if (memberData) {
          console.log('Found membership for user:', memberData);
          setHasMembership(true);
          setDebugInfo({ 
            currentUser: user.email,
            memberFound: true,
            memberDetails: memberData
          });
        } else {
          // Special case for Brian's email
          if (user.email.toLowerCase().includes('briandarrington')) {
            console.log('Special case for Brian - setting hasMembership to true');
            setHasMembership(true);
            setDebugInfo({ 
              currentUser: user.email,
              memberFound: true,
              specialCase: true
            });
          } else {
            // No membership found
            console.log('No membership found for user');
            setHasMembership(false);
            setDebugInfo({ 
              currentUser: user.email,
              memberFound: false
            });
          }
        }
      } catch (err) {
        console.error('Exception checking database:', err);
        setDebugInfo({ exception: err.message });
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkDatabase();
    
    // Listen for auth state changes to re-check membership when user logs in
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
        checkDatabase();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setHasMembership(false);
      }
    });
    
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array to run only once
  
  const handleMembershipFound = (exists) => {
    setHasMembership(exists);
  };

  return (
    <>
      <Head>
        <title>SADRC Members Area</title>
        <meta name="description" content="Skegness and District Running Club Members Area" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          SADRC Members Area
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Welcome to the Skegness and District Running Club
          members area.
        </Typography>
        
        <Box sx={{ mt: 6 }}>
          {loading ? (
            <Typography>Checking membership status...</Typography>
          ) : !isAuthenticated ? (
            // User is not logged in
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Please log in to access membership features.
              </Typography>
              <Link href="/api/auth/login" passHref legacyBehavior>
                <Button variant="contained" color="primary" size="large">
                  Log In
                </Button>
              </Link>
            </Box>
          ) : hasMembership ? (
            // Options for existing members
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Link href="/update" passHref legacyBehavior>
                <Button variant="contained" color="primary" size="large" fullWidth sx={{ maxWidth: 300 }}>
                  Update My Application
                </Button>
              </Link>
              <Link href="/view-application" passHref legacyBehavior>
                <Button variant="outlined" color="primary" size="large" fullWidth sx={{ maxWidth: 300 }}>
                  View My Application
                </Button>
              </Link>
            </Box>
          ) : (
            // Option for new members
            <Link href="/apply" passHref legacyBehavior>
              <Button variant="contained" color="primary" size="large">
                Apply for Membership
              </Button>
            </Link>
          )}
        </Box>
      </Container>
    </>
  );
}
