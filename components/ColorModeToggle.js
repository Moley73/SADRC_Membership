import { IconButton, useTheme, Typography, Box } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useContext } from 'react';
import { ColorModeContext } from '../theme/ColorModeContext';

export default function ColorModeToggle() {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  return (
    <Box display="flex" alignItems="center">
      <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 600, mr: 1 }}>
        {theme.palette.mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
      </Typography>
      <IconButton sx={{ ml: 0.5 }} onClick={colorMode.toggleColorMode} color="inherit">
        {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Box>
  );
}
