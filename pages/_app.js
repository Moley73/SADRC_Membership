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
            <Container maxWidth="xl">
              <Toolbar sx={{ justifyContent: 'space-between', py: { xs: 1, md: 0.5 } }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => router.push('/')}
                >
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '1.1rem', md: '1.25rem' },
                      color: 'primary.main'
                    }}
                  >
                    SADRC Membership
                  </Typography>
                </Box>
                
                {/* Desktop Navigation */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                  <Button 
                    color="inherit" 
                    onClick={() => router.push('/')}
                    sx={{ 
                      mx: 1, 
                      borderRadius: 2,
                      ...(router.pathname === '/' && { 
                        color: 'primary.main',
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
                      borderRadius: 2,
                      ...(router.pathname.startsWith('/awards') && !router.pathname.includes('/manage') && { 
                        color: 'primary.main',
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
                      borderRadius: 2,
                      ...(router.pathname === '/relay' && { 
                        color: 'primary.main',
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
                      borderRadius: 2,
                      ...(router.pathname === '/xmas-party' && { 
                        color: 'primary.main',
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
                        borderRadius: 2,
                        ...(router.pathname === '/admin' && { 
                          color: 'primary.main',
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
                        borderRadius: 2,
                        ...(router.pathname === '/manage' && { 
                          color: 'primary.main',
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
                        borderRadius: 2,
                        ...(router.pathname === '/awards/manage' && { 
                          color: 'primary.main',
                          bgcolor: 'background.subtle'
                        })
                      }}
                    >
                      Manage Awards
                    </Button>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ColorModeToggle />
                  <Box sx={{ ml: 1 }}>
                    <AuthStatus />
                  </Box>
                  {isMobile && (
                    <IconButton
                      color="inherit"
                      aria-label="open menu"
                      edge="end"
                      onClick={handleMobileMenuOpen}
                      sx={{ ml: 1 }}
                    >
                      <MenuIcon />
                    </IconButton>
                  )}
                </Box>
              </Toolbar>
            </Container>
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
              PaperProps={{
                elevation: 3,
                sx: {
                  mt: 1.5,
                  width: 200,
                  borderRadius: 2,
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                }
              }}
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
