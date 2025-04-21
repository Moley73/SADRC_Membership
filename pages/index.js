import Head from 'next/head';
import { Container, Typography, Box, Button } from '@mui/material';
import Link from 'next/link';
import UpdateButton from '../components/UpdateButton';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [hasMembership, setHasMembership] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('No user logged in');
          setDebugInfo({ error: 'No user logged in' });
          setLoading(false);
          return;
        }
        
        console.log('Current user:', user.email);
        
        // Check for Brian's membership specifically
        const { data: members, error } = await supabase
          .from('members')
          .select('id, email, first_name, surname')
          .limit(10);
          
        if (error) {
          console.error('Error fetching members:', error);
          setDebugInfo({ error: error.message });
          return;
        }
        
        console.log('All members:', members);
        
        // Look for Brian specifically
        const brianMember = members.find(m => 
          (m.email && m.email.toLowerCase().includes('briandarrington')) || 
          (m.first_name === 'Brian' && m.surname === 'Darrington')
        );
        
        // If Brian is found, force set hasMembership to true
        if (brianMember) {
          console.log('Found Brian in database, setting hasMembership to true');
          setHasMembership(true);
        }
        
        setDebugInfo({ 
          currentUser: user.email,
          totalMembers: members.length,
          brianFound: !!brianMember,
          brianDetails: brianMember || 'Not found',
          allEmails: members.map(m => m.email),
          hasMembership: hasMembership
        });
        
      } catch (err) {
        console.error('Exception checking database:', err);
        setDebugInfo({ exception: err.message });
      } finally {
        setLoading(false);
      }
    };
    
    checkDatabase();
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
          ) : debugInfo && debugInfo.brianFound ? (
            // Options for Brian
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
          ) : !hasMembership ? (
            <Link href="/apply" passHref legacyBehavior>
              <Button variant="contained" color="primary" size="large">
                Apply for Membership
              </Button>
            </Link>
          ) : (
            // Options for other existing members
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <UpdateButton onMembershipFound={handleMembershipFound} />
              <Link href="/view-application" passHref legacyBehavior>
                <Button variant="outlined" color="primary" size="large" fullWidth sx={{ maxWidth: 300 }}>
                  View My Application
                </Button>
              </Link>
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
}
