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
import Head from 'next/head';
import { AuthProvider, useAuthContext } from '../lib/AuthContext';

export default function App({ Component, pageProps }) {
  const [mode, setMode] = useState('dark');
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

  return (
    <AuthProvider>
      <AppContent 
        Component={Component} 
        pageProps={pageProps} 
        mode={mode}
        colorMode={colorMode}
        theme={theme}
        isMobile={isMobile}
        mobileMenuAnchorEl={mobileMenuAnchorEl}
        handleMobileMenuOpen={handleMobileMenuOpen}
        handleMobileMenuClose={handleMobileMenuClose}
        handleNavigation={handleNavigation}
        router={router}
      />
    </AuthProvider>
  );
}

// Separate component that can access AuthContext
function AppContent({ 
  Component, 
  pageProps, 
  mode, 
  colorMode, 
  theme, 
  isMobile, 
  mobileMenuAnchorEl, 
  handleMobileMenuOpen, 
  handleMobileMenuClose, 
  handleNavigation, 
  router 
}) {
  const { user, isAdmin } = useAuthContext();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        return;
      }
      
      try {
        // Check if user has super admin role
        const { data, error } = await supabase
          .from('admin_list')
          .select('role')
          .ilike('email', user.email)  // Case-insensitive match
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching admin status:', error);
          // Fallback for known super admins
          setIsSuperAdmin(['briandarrington@btinternet.com'].includes(user.email));
          return;
        }
        
        // Check for super_admin role
        const role = data?.role?.toLowerCase() || '';
        setIsSuperAdmin(role.includes('super'));
      } catch (err) {
        console.error('Error checking admin role:', err);
        // Fallback for known super admins
        setIsSuperAdmin(['briandarrington@btinternet.com'].includes(user.email));
      }
    };
    
    checkAdminRole();
  }, [user]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar 
            position="sticky" 
            elevation={0}
            sx={{ 
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              color: 'text.primary'
            }}
          >
            <Toolbar>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  flexGrow: 1, 
                  fontWeight: 700, 
                  color: 'primary.main',
                  display: 'flex', 
                  alignItems: 'center'
                }}
              >
                <Link 
                  color="inherit" 
                  href="/" 
                  underline="none"
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    '&:hover': {
                      color: 'primary.dark'
                    }
                  }}
                >
                  SADRC Membership
                </Link>
              </Typography>
              {/* Desktop Navigation */}
              {!isMobile ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button 
                    color="inherit" 
                    onClick={() => router.push('/')}
                    sx={{ 
                      mx: 1,
                      borderRadius: 1,
                      ...(router.pathname === '/' && { 
                        bgcolor: 'background.subtle'
                      })
                    }}
                  >
                    Home
                  </Button>
                  <Button 
                    color="inherit" 
                    onClick={() => router.push('/awards')}
                    sx={{ 
                      mx: 1,
                      borderRadius: 1,
                      ...(router.pathname.startsWith('/awards') && !router.pathname.includes('/manage') && { 
                        bgcolor: 'background.subtle'
                      })
                    }}
                  >
                    Awards
                  </Button>
                  <Button 
                    color="inherit" 
                    onClick={() => router.push('/relay')}
                    sx={{ 
                      mx: 1,
                      borderRadius: 1,
                      ...(router.pathname === '/relay' && { 
                        bgcolor: 'background.subtle'
                      })
                    }}
                  >
                    Relay
                  </Button>
                  <Button 
                    color="inherit" 
                    onClick={() => router.push('/xmas-party')}
                    sx={{ 
                      mx: 1,
                      borderRadius: 1,
                      ...(router.pathname === '/xmas-party' && { 
                        bgcolor: 'background.subtle'
                      })
                    }}
                  >
                    Xmas Party
                  </Button>
                  {isAdmin && (
                    <Button 
                      color="inherit" 
                      onClick={() => router.push('/admin')}
                      sx={{ 
                        mx: 1,
                        borderRadius: 1,
                        ...(router.pathname === '/admin' && { 
                          bgcolor: 'background.subtle'
                        })
                      }}
                    >
                      Admin
                    </Button>
                  )}
                  {isSuperAdmin && (
                    <Button 
                      color="inherit" 
                      onClick={() => router.push('/manage')}
                      sx={{ 
                        mx: 1,
                        borderRadius: 1,
                        ...(router.pathname === '/manage' && { 
                          bgcolor: 'background.subtle'
                        })
                      }}
                    >
                      Manage
                    </Button>
                  )}
                  {isSuperAdmin && (
                    <Button 
                      color="inherit" 
                      onClick={() => router.push('/awards/manage')}
                      sx={{ 
                        mx: 1,
                        borderRadius: 1,
                        ...(router.pathname === '/awards/manage' && { 
                          bgcolor: 'background.subtle'
                        })
                      }}
                    >
                      Manage Awards
                    </Button>
                  )}
                  <Box sx={{ mx: 1 }}>
                    <ColorModeToggle />
                  </Box>
                  <Box sx={{ mx: 1 }}>
                    <AuthStatus />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ mx: 0.5 }}>
                    <ColorModeToggle />
                  </Box>
                  <Box sx={{ mx: 0.5 }}>
                    <AuthStatus />
                  </Box>
                  <IconButton
                    color="inherit"
                    aria-label="open menu"
                    aria-controls="mobile-menu"
                    aria-haspopup="true"
                    onClick={handleMobileMenuOpen}
                    edge="end"
                  >
                    <MenuIcon />
                  </IconButton>
                </Box>
              )}
            </Toolbar>
          </AppBar>
          
          {/* Mobile menu */}
          {isMobile && (
            <Menu
              id="mobile-menu"
              anchorEl={mobileMenuAnchorEl}
              keepMounted
              open={Boolean(mobileMenuAnchorEl)}
              onClose={handleMobileMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                  mt: 1.5,
                  width: 200,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem 
                onClick={() => handleNavigation('/')}
                sx={{ 
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  px: 2,
                  ...(router.pathname === '/' && { 
                    color: 'primary.main',
                    bgcolor: 'background.subtle'
                  })
                }}
              >
                Home
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigation('/awards')}
                sx={{ 
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  px: 2,
                  ...(router.pathname.startsWith('/awards') && !router.pathname.includes('/manage') && { 
                    color: 'primary.main',
                    bgcolor: 'background.subtle'
                  })
                }}
              >
                Awards
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigation('/relay')}
                sx={{ 
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  px: 2,
                  ...(router.pathname === '/relay' && { 
                    color: 'primary.main',
                    bgcolor: 'background.subtle'
                  })
                }}
              >
                Relay
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigation('/xmas-party')}
                sx={{ 
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  px: 2,
                  ...(router.pathname === '/xmas-party' && { 
                    color: 'primary.main',
                    bgcolor: 'background.subtle'
                  })
                }}
              >
                Xmas Party
              </MenuItem>
              {isAdmin && (
                <MenuItem 
                  onClick={() => handleNavigation('/admin')}
                  sx={{ 
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    px: 2,
                    ...(router.pathname === '/admin' && { 
                      color: 'primary.main',
                      bgcolor: 'background.subtle'
                    })
                  }}
                >
                  Admin
                </MenuItem>
              )}
              {isSuperAdmin && (
                <MenuItem 
                  onClick={() => handleNavigation('/manage')}
                  sx={{ 
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    px: 2,
                    ...(router.pathname === '/manage' && { 
                      color: 'primary.main',
                      bgcolor: 'background.subtle'
                    })
                  }}
                >
                  Manage
                </MenuItem>
              )}
              {isSuperAdmin && (
                <MenuItem 
                  onClick={() => handleNavigation('/awards/manage')}
                  sx={{ 
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    px: 2,
                    ...(router.pathname === '/awards/manage' && { 
                      color: 'primary.main',
                      bgcolor: 'background.subtle'
                    })
                  }}
                >
                  Manage Awards
                </MenuItem>
              )}
            </Menu>
          )}
          <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
            <Component {...pageProps} />
          </Box>
          <Box 
            component="footer" 
            sx={{ 
              py: 3, 
              px: 2, 
              mt: 'auto', 
              backgroundColor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Container maxWidth="lg">
              <Typography variant="body2" color="text.secondary" align="center">
                {new Date().getFullYear()} Skegness and District Running Club. All rights reserved.
              </Typography>
            </Container>
          </Box>
        </Box>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
