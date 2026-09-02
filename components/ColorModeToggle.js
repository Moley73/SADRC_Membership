import { IconButton, useTheme, Typography, Box } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useContext } from 'react';
import { ColorModeContext } from '../theme/ColorModeContext';

export default function ColorModeToggle() {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  return (
    <Box display="flex" alignItems="center">
      <Typography variant="body2" noWrap sx={{ color: 'inherit', fontWeight: 600, mr: 1, display: { xs: 'none', sm: 'block' } }}>
        {theme.palette.mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
      </Typography>
      <IconButton
        sx={{ ml: { xs: 0, sm: 0.5 } }}
        onClick={colorMode.toggleColorMode}
        color="inherit"
        aria-label={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Box>
  );
}
