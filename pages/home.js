import Head from 'next/head';
import { Container, Typography, Box, Button, Paper, Grid } from '@mui/material';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthGuard from '../components/AuthGuard';

function HomePage() {
  const [userData, setUserData] = useState(null);
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('No user logged in');
          setLoading(false);
          return;
        }
        
        setUserData(user);
        
        // Check if user has a membership
        const { data: memberData, error } = await supabase
          .from('members')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching membership:', error);
        } else {
          setMembershipData(memberData);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  return (
    <>
      <Head>
        <title>SADRC Members Area - Home</title>
        <meta name="description" content="Skegness and District Running Club Members Area" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Welcome to SADRC Members Area
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <Typography>Loading your information...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* User Information Card */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Your Account
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    <strong>Email:</strong> {userData?.email}
                  </Typography>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Link href="/profile" passHref legacyBehavior>
                    <Button variant="outlined" color="primary" fullWidth>
                      Manage Profile
                    </Button>
                  </Link>
                </Box>
              </Paper>
            </Grid>
            
            {/* Membership Status Card */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Membership Status
                </Typography>
                {membershipData ? (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body1">
                        <strong>Name:</strong> {membershipData.first_name} {membershipData.surname}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Status:</strong> {membershipData.pending_update ? 'Update Pending' : 'Active'}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Link href="/update" passHref legacyBehavior>
                        <Button variant="contained" color="primary" fullWidth>
                          Update Membership
                        </Button>
                      </Link>
                      <Link href="/view-application" passHref legacyBehavior>
                        <Button variant="outlined" color="primary" fullWidth>
                          View Application
                        </Button>
                      </Link>
                    </Box>
                  </>
                ) : (
                  <>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      You don't have an active membership yet.
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <Link href="/apply" passHref legacyBehavior>
                        <Button variant="contained" color="primary" fullWidth>
                          Apply for Membership
                        </Button>
                      </Link>
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>
            
            {/* Quick Links Card */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Quick Links
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Link href="/resources" passHref legacyBehavior>
                    <Button variant="outlined" color="primary" fullWidth>
                      Club Resources
                    </Button>
                  </Link>
                  <Link href="https://www.skegnessanddistrictrc.co.uk/" passHref legacyBehavior>
                    <Button variant="outlined" color="primary" fullWidth component="a" target="_blank">
                      Club Website
                    </Button>
                  </Link>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
}

// Wrap the page with AuthGuard to ensure only authenticated users can access it
export default function Home() {
  return (
    <AuthGuard>
      <HomePage />
    </AuthGuard>
  );
}
