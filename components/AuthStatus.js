import { useState, useEffect, useCallback } from 'react';
import { 
  Button, Typography, Box, CircularProgress, Avatar, 
  Menu, MenuItem, IconButton, Tooltip, Divider
} from '@mui/material';
import { useRouter } from 'next/router';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useAuthContext } from '../lib/AuthContext';

export default function AuthStatus() {
  const { user, loading, signOut } = useAuthContext();
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

  // Set user initials when user changes
  useEffect(() => {
    if (user?.email) {
      setUserInitials(generateInitials(user.email));
    }
  }, [user, generateInitials]);

  const handleLogout = async () => {
    try {
      handleMenuClose();
      await signOut();
      
      // Force navigation to home page after logout
      router.push('/');
      
      // Force reload the page to clear any in-memory state
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      console.error('Unexpected error during logout:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };
  
  const handleProfile = () => {
    handleMenuClose();
    // Navigate to the profile page
    router.push('/profile');
  };

  // Only show loading spinner during initial load
  if (loading) {
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
              data-email={user.email}
              data-authenticated="true"
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
