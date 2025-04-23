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
import { useAuthContext } from '../lib/AuthContext';
import { useMembership } from '../lib/useMembership';

function checkAvatarInDOM() {
  if (typeof window !== 'undefined') {
    const avatarElement = document.querySelector('.MuiAvatar-root');
    if (avatarElement) {
      console.log('Avatar detected in DOM, user is logged in');
      return true;
    }
  }
  return false;
}

export default function Home() {
  const router = useRouter();
  // Use our new authentication hooks
  const { user, loading: authLoading, isAdmin } = useAuthContext();
  const { membershipData, hasMembership, loading: membershipLoading, error, refreshMembership } = useMembership();
  
  // Local state
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  
  // Derived loading state
  const loading = authLoading || membershipLoading;

  const runDiagnostics = async () => {
    if (!user) {
      setDebugInfo({ error: 'User not authenticated' });
      return;
    }
    
    setRunningDiagnostics(true);
    
    try {
      // Test the auth state
      const authState = await debugAuthState();
      
      // Test table access
      const tableAccess = await testTableAccess();
      
      setDebugInfo({
        user: user.email,
        authState,
        tableAccess
      });
    } catch (err) {
      setDebugInfo({ error: err.message });
    } finally {
      setRunningDiagnostics(false);
    }
  };

  // Calculate membership expiry date in human-readable format
  const formatExpiryDate = () => {
    if (!membershipData?.membership_expiry) return 'Not set';
    
    const expiryDate = dayjs(membershipData.membership_expiry);
    const now = dayjs();
    const daysRemaining = expiryDate.diff(now, 'day');
    
    if (daysRemaining < 0) {
      return `Expired ${Math.abs(daysRemaining)} days ago`;
    } else if (daysRemaining === 0) {
      return 'Expires today';
    } else if (daysRemaining === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${daysRemaining} days`;
    }
  };

  // Format a membership status with proper capitalization
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
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
              
              {!user && (
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
            {user && (
              <Box sx={{ mb: 6 }}>
                <Typography variant="h4" component="h2" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
                  My Membership
                </Typography>
                
                {hasMembership && membershipData ? (
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
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            width: 60,
                            height: 60,
                            mr: 2
                          }}
                        >
                          {membershipData.first_name?.charAt(0)}{membershipData.surname?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight={600}>
                            {membershipData.first_name} {membershipData.surname}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {membershipData.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Chip 
                          label={formatStatus(membershipData.membership_status || 'active')} 
                          color={membershipData.membership_status === 'active' ? 'success' : 'warning'}
                          size="small"
                        />
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
                                {membershipData.membership_type || 'Standard'}
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
                                  {formatExpiryDate()}
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
                                {membershipData.ea_number || 'Not registered'}
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
                    
                    {(process.env.NODE_ENV === 'development' || isAdmin) && (
                      <Box sx={{ mt: 4, p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                        <Typography variant="h6">Debug Info:</Typography>
                        <Typography variant="body1">Email: {user?.email}</Typography>
                        <Typography variant="body1">Is Admin: {isAdmin ? 'Yes' : 'No'}</Typography>
                        <Typography variant="body1">Auth State: {user ? 'Authenticated' : 'Not authenticated'}</Typography>
                        <Button 
                          variant="contained" 
                          color="secondary" 
                          size="small"
                          onClick={() => {
                            console.log('Manual admin override triggered');
                            refreshMembership();
                          }}
                          sx={{ mt: 2 }}
                        >
                          Force Refresh Membership
                        </Button>
                      </Box>
                    )}
                  </Paper>
                )}
              </Box>
            )}
            
            {/* Original content for non-authenticated users */}
            {!user && (
              <Box sx={{ mt: 6, textAlign: 'center' }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Please log in to access membership features.
                </Typography>
              </Box>
            )}
            
            {/* Debug panel */}
            {user && !hasMembership && (
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
                    
                    {debugInfo && (
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
                        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
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
