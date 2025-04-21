import '../styles/globals.css';
import { CssBaseline, ThemeProvider, AppBar, Toolbar, Box, Button, Typography, Container, Link, IconButton, Menu, MenuItem, useMediaQuery } from '@mui/material';
import getTheme from '../theme/theme';
import { useMemo, useState, useEffect } from 'react';
import { ColorModeContext } from '../theme/ColorModeContext';
import ColorModeToggle from '../components/ColorModeToggle';
import AuthStatus from '../components/AuthStatus';
import AdminNavButton from '../components/AdminNavButton';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import MenuIcon from '@mui/icons-material/Menu';

export default function App({ Component, pageProps }) {
  const [mode, setMode] = useState('dark');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const router = useRouter();
  
  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
  }), []);
  
  const theme = useMemo(() => getTheme(mode), [mode]);
  
  // Use the theme after it's initialized
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleNavigation = (path) => {
    router.push(path);
    handleMobileMenuClose();
  };

  useEffect(() => {
    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        
        if (session?.user) {
          try {
            // Simplified query to admin_list table with case-insensitive role check
            const { data, error } = await supabase
              .from('admin_list')
              .select('role')
              .eq('email', session.user.email)
              .maybeSingle();
              
            if (error) {
              console.error('Error fetching admin status:', error);
              // Fallback to hardcoded admin list
              const isAdmin = ['briandarrington@btinternet.com'].includes(session.user.email);
              const isSuperAdmin = ['briandarrington@btinternet.com'].includes(session.user.email);
              setIsAdmin(isAdmin);
              setIsSuperAdmin(isSuperAdmin);
              return;
            }
            
            // Use case-insensitive matching for more flexibility
            const role = data?.role?.toLowerCase() || '';
            const isUserAdmin = role.includes('admin');
            const isUserSuperAdmin = role.includes('super');
            
            setIsAdmin(isUserAdmin);
            setIsSuperAdmin(isUserSuperAdmin);
          } catch (err) {
            console.error('Error checking admin status:', err);
            // Fallback to hardcoded admin list
            const isAdmin = ['briandarrington@btinternet.com'].includes(session.user.email);
            const isSuperAdmin = ['briandarrington@btinternet.com'].includes(session.user.email);
            setIsAdmin(isAdmin);
            setIsSuperAdmin(isSuperAdmin);
          }
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  flexGrow: 0, 
                  fontWeight: 'bold', 
                  color: 'primary.main',
                  mr: 4,
                  cursor: 'pointer'
                }}
                onClick={() => router.push('/')}
              >
                SADRC Members Area
              </Typography>
              {isMobile ? (
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMobileMenuOpen}
                  color="inherit"
                >
                  <MenuIcon />
                </IconButton>
              ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/')}>HOME</Button>
                  <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/resources')}>RESOURCES</Button>
                  {isAdmin && (
                    <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/admin')}>ADMIN</Button>
                  )}
                  {isSuperAdmin && (
                    <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/manage')}>MANAGE</Button>
                  )}
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AuthStatus />
              <ColorModeToggle />
            </Box>
          </Toolbar>
        </AppBar>
        {isMobile && (
          <Menu
            id="menu-appbar"
            anchorEl={mobileMenuAnchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(mobileMenuAnchorEl)}
            onClose={handleMobileMenuClose}
          >
            <MenuItem onClick={() => handleNavigation('/')}>HOME</MenuItem>
            <MenuItem onClick={() => handleNavigation('/resources')}>RESOURCES</MenuItem>
            {isAdmin && (
              <MenuItem onClick={() => handleNavigation('/admin')}>ADMIN</MenuItem>
            )}
            {isSuperAdmin && (
              <MenuItem onClick={() => handleNavigation('/manage')}>MANAGE</MenuItem>
            )}
          </Menu>
        )}
        <Container maxWidth={false} disableGutters sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Component {...pageProps} />
        </Container>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
