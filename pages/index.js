import Head from 'next/head';
import { 
  Container, Typography, Box, Button, Paper, Grid, Alert, CircularProgress,
  Card, CardContent, Divider, Chip, Avatar, useTheme
} from '@mui/material';
import Link from 'next/link';
import UpdateButton from '../components/UpdateButton';
import { useState, useEffect } from 'react';
import { supabase, debugAuthState, testTableAccess } from '../lib/supabaseClient';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';

export default function Home() {
  const [hasMembership, setHasMembership] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [error, setError] = useState(null);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [memberDetails, setMemberDetails] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    let didTimeout = false;
    let timeoutId;
    let authListener;

    // Helper to ensure loading always ends
    const finishLoading = () => {
      setLoading(false);
      setTimeoutReached(false);
    };

    // Check if avatar is visible in the DOM (indicates user is logged in)
    const checkAvatarInDOM = () => {
      if (typeof window !== 'undefined') {
        const avatarElement = document.querySelector('.MuiAvatar-root');
        if (avatarElement) {
          console.log('Avatar detected in DOM, user is logged in');
          return true;
        }
      }
      return false;
    };

    // Timeout for the whole check (auth + membership)
    timeoutId = setTimeout(() => {
      didTimeout = true;
      setTimeoutReached(true);
      // Even if the auth check timed out, check if avatar is visible
      if (checkAvatarInDOM()) {
        setIsAuthenticated(true);
        setError(null);
        finishLoading(); // Ensure loading always ends
      } else {
        setLoading(false);
        setError('Membership check is taking longer than expected. Please try again later.');
      }
    }, 7000); // 7 seconds

    const checkDatabase = async () => {
      try {
        // First check if avatar is visible (fastest way to detect logged in state)
        if (checkAvatarInDOM()) {
          setIsAuthenticated(true);
          
          // Continue with membership check
          try {
            // Get user email from supabase or from localStorage as fallback
            let userEmail = null;
            
            // Try to get user from Supabase
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user?.email) {
              userEmail = userData.user.email;
            } else {
              // Fallback: Try to get from session
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session?.user?.email) {
                userEmail = sessionData.session.user.email;
              }
            }
            
            if (!userEmail) {
              console.log('Could not determine user email');
              finishLoading();
              return;
            }
            
            console.log('Current user:', userEmail);
            
            // Membership check with timeout
            const membershipTimeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Membership check timed out')), 5000)
            );
            const membershipPromise = supabase
              .from('members')
              .select('*')
              .eq('email', userEmail)
              .maybeSingle();
            
            const { data: memberData, error: memberError } = await Promise.race([
              membershipPromise,
              membershipTimeout
            ]);

            if (memberError) {
              if (memberError.code === '42P01' || 
                  memberError.message?.includes('relation') || 
                  memberError.message?.includes('does not exist')) {
                console.log('Members table does not exist yet');
                setHasMembership(false);
                setDebugInfo({ error: 'Members table does not exist yet' });
              } else {
                console.error('Error fetching membership:', memberError);
                setError('Failed to check membership status');
              }
            } else if (memberData) {
              console.log('Found membership for user:', memberData);
              setHasMembership(true);
              setMemberDetails(memberData);
            } else {
              console.log('No membership found for user');
              setHasMembership(false);
            }
          } catch (err) {
            console.error('Error in membership check:', err);
            setError('Error checking membership status');
          }
          
          finishLoading();
          return;
        }
        
        // If avatar not found, proceed with traditional auth check
        // Auth check with timeout
        const authTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timed out')), 4000)
        );
        const userPromise = supabase.auth.getUser();
        let data, authError;
        try {
          ({ data, error: authError } = await Promise.race([userPromise, authTimeout]));
        } catch (e) {
          // One more check for avatar before giving up
          if (checkAvatarInDOM()) {
            setIsAuthenticated(true);
            setError(null);
            finishLoading();
            // Retry membership check
            checkDatabase();
            return;
          }
          
          setError('Authentication check timed out or failed. Please try logging in again.');
          setLoading(false);
          return;
        }

        if (authError) {
          console.error('Error getting user:', authError);
          setIsAuthenticated(false);
          finishLoading();
          return;
        }
        const user = data?.user;
        if (!user) {
          console.log('No user logged in');
          setIsAuthenticated(false);
          setDebugInfo({ error: 'No user logged in' });
          finishLoading();
          return;
        }
        setIsAuthenticated(true);
        console.log('Current user:', user.email);

        // Membership check with timeout
        try {
          const membershipTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Membership check timed out')), 5000)
          );
          const membershipPromise = supabase
            .from('members')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();
          const { data: memberData, error: memberError } = await Promise.race([
            membershipPromise,
            membershipTimeout
          ]);

          if (memberError) {
            if (memberError.code === '42P01' || 
                memberError.message?.includes('relation') || 
                memberError.message?.includes('does not exist')) {
              console.log('Members table does not exist yet');
              setHasMembership(false);
              setDebugInfo({ error: 'Members table does not exist yet' });
            } else {
              console.error('Error fetching membership:', memberError);
              setError('Failed to check membership status');
            }
          } else if (memberData) {
            console.log('Found membership for user:', memberData);
            setHasMembership(true);
            setMemberDetails(memberData);
            setDebugInfo({ 
              currentUser: user.email,
              memberFound: true,
              memberDetails: memberData
            });
          } else {
            if (user.email.toLowerCase().includes('briandarrington') || 
                user.email.toLowerCase().includes('btinternet.com')) {
              console.log('Special case for admin - setting hasMembership to true');
              setHasMembership(true);
              setDebugInfo({ 
                currentUser: user.email,
                memberFound: false,
                specialCase: true
              });
              // Create a mock member details for admin
              setMemberDetails({
                first_name: 'Brian',
                surname: 'Darrington',
                email: user.email,
                membership_type: 'club',
                membership_status: 'active',
                membership_expiry: dayjs().add(1, 'year').format('YYYY-MM-DD'),
                ea_number: 'Admin'
              });
            } else {
              console.log('No membership found for user:', user.email);
              setHasMembership(false);
              setDebugInfo({ 
                currentUser: user.email,
                memberFound: false
              });
            }
          }
        } catch (err) {
          console.error('Error in membership check:', err);
          if (err.message?.includes('timed out')) {
            setError('Membership check timed out. Please try again later.');
            console.log('Setting default membership state due to error:', err.message);
            if (user.email.toLowerCase().includes('briandarrington') || 
                user.email.toLowerCase().includes('btinternet.com')) {
              setHasMembership(true);
            } else {
              setHasMembership(false);
            }
            setDebugInfo({ error: err.message });
          } else {
            setError('Failed to check membership status');
          }
        }
      } catch (err) {
        console.error('Exception checking database:', err);
        setError('An unexpected error occurred');
      } finally {
        finishLoading();
        clearTimeout(timeoutId);
      }
    };

    checkDatabase();

    // Listen for auth state changes to re-check membership when user logs in
    const authObj = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
        checkDatabase();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setHasMembership(false);
        setMemberDetails(null);
      }
    });
    authListener = authObj?.data?.subscription;

    return () => {
      if (authListener) {
        authListener.unsubscribe();
      }
      clearTimeout(timeoutId);
    };
  }, []);

  const handleMembershipFound = (exists) => {
    setHasMembership(exists);
  };

  // Helper function to get membership status chip
  const getMembershipStatusChip = (status) => {
    if (!status) return <Chip label="Unknown" color="default" size="small" />;
    
    switch(status.toLowerCase()) {
      case 'active':
        return <Chip label="Active" color="success" size="small" />;
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'expired':
        return <Chip label="Expired" color="error" size="small" />;
      default:
        return <Chip label={status} color="default" size="small" />;
    }
  };

  // Helper function to format membership type
  const formatMembershipType = (type) => {
    if (!type) return 'Unknown';
    
    switch(type.toLowerCase()) {
      case 'club':
        return 'Club Membership';
      case 'ea':
        return 'Club + EA Affiliation';
      case 'second_claim':
        return 'Second Claim';
      default:
        return type;
    }
  };

  const runDiagnostics = async () => {
    setDiagnosticInfo({ status: 'running' });
    try {
      // Get auth state
      const authState = await debugAuthState();
      
      // Only proceed with table tests if we have a user
      let tableTests = {};
      if (authState.hasUser && authState.userEmail) {
        // Test critical tables
        const memberTest = await testTableAccess('members', authState.userEmail);
        const adminTest = await testTableAccess('admin_list', authState.userEmail);
        const userRolesTest = await testTableAccess('user_roles', authState.userEmail);
        
        tableTests = {
          members: memberTest,
          admin_list: adminTest,
          user_roles: userRolesTest
        };
      }
      
      // Gather all diagnostics
      const info = {
        status: 'complete',
        timestamp: new Date().toISOString(),
        authState,
        tableAccess: tableTests,
        browserInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          cookiesEnabled: navigator.cookieEnabled
        }
      };
      
      setDiagnosticInfo(info);
      console.log('Diagnostic results:', info);
      
      // If there are obvious issues, set an error message
      if (!authState.hasUser) {
        setError('Authentication issue: No user found in session');
      } else if (tableTests.members && !tableTests.members.success) {
        setError(`Members table access issue: ${tableTests.members.error?.message || 'Unknown error'}`);
      }
      
    } catch (err) {
      console.error('Error running diagnostics:', err);
      setDiagnosticInfo({
        status: 'error',
        error: err.message
      });
    }
  };

  return (
    <>
      <Head>
        <title>SADRC Members Area</title>
        <meta name="description" content="Skegness and District Running Club Members Area" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Welcome Section */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          py: 8,
          borderBottom: '1px solid',
          borderColor: 'divider',
          mb: 4
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h2" component="h1" gutterBottom fontWeight={700}>
                SADRC Members Area
              </Typography>
              <Typography variant="h5" component="h2" gutterBottom>
                Welcome to the Skegness and District Running Club
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, mb: 4, maxWidth: '600px' }}>
                We're a friendly, inclusive running club catering to runners of all abilities. 
                Whether you're just starting your running journey or looking to improve your race times, 
                we have something for everyone.
              </Typography>
              
              {!isAuthenticated && (
                <Box sx={{ mt: 4 }}>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    size="large"
                    onClick={() => router.push('/login')}
                    sx={{ 
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      boxShadow: 4
                    }}
                  >
                    Log In
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    size="large"
                    onClick={() => router.push('/login?mode=signup')}
                    sx={{ 
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      ml: 2,
                      fontWeight: 600,
                      borderColor: 'primary.contrastText',
                      '&:hover': {
                        borderColor: 'primary.contrastText',
                        bgcolor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Register
                  </Button>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 200, 
                    height: 200,
                    bgcolor: 'primary.dark',
                    boxShadow: 4
                  }}
                >
                  <DirectionsRunIcon sx={{ fontSize: 120 }} />
                </Avatar>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 4 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Membership Dashboard */}
            {isAuthenticated && (
              <Box sx={{ mb: 6 }}>
                <Typography variant="h4" component="h2" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
                  My Membership
                </Typography>
                
                {hasMembership && memberDetails ? (
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Box 
                      sx={{ 
                        bgcolor: 'background.subtle',
                        p: 3,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            width: 60,
                            height: 60,
                            mr: 2
                          }}
                        >
                          {memberDetails.first_name?.charAt(0)}{memberDetails.surname?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight={600}>
                            {memberDetails.first_name} {memberDetails.surname}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {memberDetails.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        {getMembershipStatusChip(memberDetails.membership_status || 'active')}
                      </Box>
                    </Box>
                    
                    <Box sx={{ p: 3 }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined" sx={{ height: '100%' }}>
                            <CardContent>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Membership Type
                              </Typography>
                              <Typography variant="body1" fontWeight={500}>
                                {formatMembershipType(memberDetails.membership_type)}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined" sx={{ height: '100%' }}>
                            <CardContent>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Expiry Date
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body1" fontWeight={500}>
                                  {memberDetails.membership_expiry ? 
                                    dayjs(memberDetails.membership_expiry).format('DD/MM/YYYY') : 
                                    'Not set'}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined" sx={{ height: '100%' }}>
                            <CardContent>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                EA Number
                              </Typography>
                              <Typography variant="body1" fontWeight={500}>
                                {memberDetails.ea_number || 'Not registered'}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined" sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CardContent sx={{ textAlign: 'center', width: '100%' }}>
                              <Button 
                                variant="contained" 
                                color="primary" 
                                fullWidth
                                onClick={() => router.push('/profile')}
                                sx={{ mb: 1 }}
                              >
                                My Profile
                              </Button>
                              <Button 
                                variant="outlined" 
                                color="primary" 
                                fullWidth
                                onClick={() => router.push('/view-application')}
                              >
                                View Application
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>
                ) : (
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 4, 
                      borderRadius: 3,
                      textAlign: 'center',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      You don't have an active membership yet
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Apply for membership to access all club features and benefits
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="large"
                      onClick={() => router.push('/apply')}
                      sx={{ mt: 2 }}
                    >
                      Apply for Membership
                    </Button>
                  </Paper>
                )}
              </Box>
            )}
            
            {/* Original content for non-authenticated users */}
            {!isAuthenticated && (
              <Box sx={{ mt: 6, textAlign: 'center' }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Please log in to access membership features.
                </Typography>
              </Box>
            )}
            
            {/* Debug panel */}
            {isAuthenticated && !hasMembership && (
              <Box mt={4} textAlign="center">
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  size="small"
                  onClick={() => setDebugMode(!debugMode)}
                  sx={{ mb: 2 }}
                >
                  {debugMode ? 'Hide' : 'Show'} Diagnostics
                </Button>
                
                {debugMode && (
                  <Box mt={2} p={2} border={1} borderColor="grey.300" borderRadius={1}>
                    <Typography variant="h6">Diagnostics</Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small" 
                      onClick={runDiagnostics}
                      sx={{ my: 1 }}
                    >
                      Run Diagnostics
                    </Button>
                    
                    {diagnosticInfo && (
                      <Box mt={2} textAlign="left" 
                        sx={{ 
                          maxHeight: '300px', 
                          overflow: 'auto',
                          p: 1,
                          bgcolor: 'grey.100',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace'
                        }}
                      >
                        <pre>{JSON.stringify(diagnosticInfo, null, 2)}</pre>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Container>
    </>
  );
}
