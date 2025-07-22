// ThemeProviderContext.jsx
import React, { createContext, useMemo, useState, useContext } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ColorModeContext = createContext();

export function useColorMode() {
  return useContext(ColorModeContext);
}

export default function ThemeProviderContext({ children }) {
  const [mode, setMode] = useState('light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    []
  );

  const theme = useMemo(() => {
    const isDark = mode === 'dark';

    return createTheme({
      palette: {
        mode,
        background: {
          default: isDark ? '#121212' : '#f5f5f5',
          paper: isDark ? '#1e1e1e' : '#ffffff',
        },
        text: {
          primary: isDark ? '#b0b0b0' : '#000000',
        },
      },
      typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
      },
      components: {
        MuiInputLabel: {
          styleOverrides: {
            root: {
              color: isDark ? '#b0b0b0' : undefined,
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            notchedOutline: {
              borderColor: isDark ? '#555' : undefined,
            },
            input: {
              color: isDark ? '#b0b0b0' : undefined,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              color: isDark ? '#b0b0b0' : undefined,
              borderColor: isDark ? '#777' : undefined,
            },
          },
        },
        MuiSvgIcon: {
          styleOverrides: {
            root: {
              color: isDark ? '#b0b0b0' : undefined,
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
