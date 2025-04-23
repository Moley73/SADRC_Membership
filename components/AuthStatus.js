import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Button, Typography, Box, CircularProgress, Avatar, 
  Menu, MenuItem, IconButton, Tooltip, Divider
} from '@mui/material';
import { useRouter } from 'next/router';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

export default function AuthStatus() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [membershipChecked, setMembershipChecked] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userInitials, setUserInitials] = useState('');
  const router = useRouter();
  
  const open = Boolean(anchorEl);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Memoize the generateInitials function to prevent unnecessary re-renders
  const generateInitials = useCallback((email) => {
    if (!email) return '';
    
    // Extract the part before @ in the email
    const name = email.split('@')[0];
    
    // Split by common separators (., _, -)
    const parts = name.split(/[._-]/);
    
    if (parts.length > 1) {
      // If there are multiple parts, use first letter of first and last part
      return `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase();
    } else if (name.length > 1) {
      // If single word, use first two letters
      return name.substring(0, 2).toUpperCase();
    } else {
      // Fallback to just the first letter
      return name[0].toUpperCase();
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    let authCheckTimeout = null;
    
    // Initial user check
    const getUser = async () => {
      try {
        if (!mounted) return;
        setLoading(true);
        
        // Use getSession instead of getUser for more reliable authentication
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            // If we're in a production environment and have retries left, try again
            if (process.env.NODE_ENV === 'production' && retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying session check (${retryCount}/${maxRetries})...`);
              setTimeout(getUser, 1000); // Wait 1 second before retrying
              return;
            }
            setUser(null);
            setLoading(false);
          }
          return;
        }
        
        if (!mounted) return;
        
        if (!data?.session?.user) {
          console.log('No active session found');
          // Check localStorage directly as a fallback
          if (typeof window !== 'undefined') {
            const storedSession = localStorage.getItem('sadrc-membership-auth');
            if (storedSession) {
              try {
                const parsedSession = JSON.parse(storedSession);
                if (parsedSession?.user) {
                  console.log('Found session in localStorage, attempting to recover');
                  // Try to refresh the session
                  const { data: refreshData } = await supabase.auth.refreshSession();
                  if (refreshData?.session?.user) {
                    console.log('Session recovered successfully');
                    setUser(refreshData.session.user);
                    setUserInitials(generateInitials(refreshData.session.user.email));
                    setLoading(false);
                    setMembershipChecked(true);
                    return;
                  }
                }
              } catch (e) {
                console.error('Error parsing stored session:', e);
              }
            }
          }
          
          if (mounted) {
            setUser(null);
            setLoading(false);
            setMembershipChecked(true);
          }
          return;
        }
        
        const currentUser = data.session.user;
        console.log('User authenticated:', currentUser.email);
        
        if (mounted) {
          setUser(currentUser);
          setUserInitials(generateInitials(currentUser.email));
          setLoading(false);
          setMembershipChecked(true);
        }
      } catch (err) {
        // Don't log null errors which are normal when no session exists
        if (err) {
          console.error('Unexpected error getting user:', err);
        }
        if (mounted) {
          setUser(null);
          setLoading(false);
          setMembershipChecked(true);
        }
      }
    };
    
    getUser();
    
    // Add a safety timeout to prevent infinite loading
    authCheckTimeout = setTimeout(() => {
      if (mounted && loading && !membershipChecked) {
        console.log('Auth check timed out, showing default state');
        setLoading(false);
        setMembershipChecked(true);
      }
    }, 5000); // 5 second timeout
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      // Only log meaningful auth events
      if (event !== 'INITIAL_SESSION') {
        console.log('Auth state changed:', event, session?.user?.email || 'No user');
      }
      
      if (session?.user) {
        setUser(session.user);
        setUserInitials(generateInitials(session.user.email));
      } else {
        setUser(null);
      }
      
      setLoading(false);
      setMembershipChecked(true);
    });
    
    // Cleanup function to prevent memory leaks and state updates after unmount
    return () => {
      mounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
      if (authCheckTimeout) {
        clearTimeout(authCheckTimeout);
      }
    };
  }, [generateInitials]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      handleMenuClose();
      
      // Use a more robust approach to sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Error signing out:', error);
        alert('Failed to log out. Please try again.');
      } else {
        console.log('Successfully signed out');
        // Don't navigate here - let the auth state change listener handle it
      }
    } catch (err) {
      console.error('Unexpected error during logout:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleProfile = () => {
    handleMenuClose();
    // Navigate to the profile page
    router.push('/profile');
  };

  // Only show loading spinner briefly during initial load
  if (loading && !membershipChecked) {
    return <CircularProgress size={20} color="inherit" />;
  }

  if (user) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={`Logged in as ${user.email}`}>
          <IconButton 
            onClick={handleMenuOpen}
            size="small"
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            sx={{ ml: 1 }}
          >
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: '0.875rem',
                fontWeight: 'bold'
              }}
            >
              {userInitials}
            </Avatar>
          </IconButton>
        </Tooltip>
        
        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
              mt: 1,
              minWidth: 180,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              }
            },
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" noWrap>
              {user.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleProfile}>
            <PersonIcon fontSize="small" sx={{ mr: 1.5 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            Logout
          </MenuItem>
        </Menu>
      </Box>
    );
  } else {
    return (
      <Button 
        color="inherit" 
        onClick={() => router.push('/login')} 
        size="small"
        variant="outlined"
        sx={{ 
          borderRadius: 4,
          px: 2,
          py: 0.5,
          fontWeight: 'medium'
        }}
      >
        Log In
      </Button>
    );
  }
}
