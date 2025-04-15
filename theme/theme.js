import { createTheme } from '@mui/material/styles';

const getTheme = (mode = 'light') => createTheme({
  palette: {
    mode,
    primary: {
      main: '#ff9800', // Orange
      contrastText: '#fff',
    },
    secondary: {
      main: '#212121', // Black/dark gray
      contrastText: '#fff',
    },
    background: {
      default: mode === 'dark' ? '#181818' : '#fff',
      paper: mode === 'dark' ? '#232323' : '#fff',
    },
    text: {
      primary: mode === 'dark' ? '#fff' : '#212121',
      secondary: mode === 'dark' ? '#ff9800' : '#ff9800',
      disabled: mode === 'dark' ? '#bdbdbd' : '#757575',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: {
      color: mode === 'dark' ? '#fff' : '#212121',
      fontWeight: 700,
      letterSpacing: 1,
    },
    body1: {
      color: mode === 'dark' ? '#fff' : '#212121',
    },
    body2: {
      color: mode === 'dark' ? '#ff9800' : '#ff9800',
    },
  },
  components: {
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? '#ff9800' : '#212121',
          fontWeight: 500,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          background: mode === 'dark' ? '#232323' : '#fff',
          color: mode === 'dark' ? '#fff' : '#212121',
        },
        notchedOutline: {
          borderColor: mode === 'dark' ? '#ff9800' : '#212121',
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? '#ff9800' : '#212121',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? '#fff' : '#212121',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  },
});

export default getTheme;
