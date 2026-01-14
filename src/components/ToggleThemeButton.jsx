import React from 'react';
import IconButton from '@mui/material/IconButton';
import { useColorMode } from '../contexts/ThemeProviderContext';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Box from '@mui/material/Box';

export default function ToggleThemeButton() {
  const theme = useTheme();
  const colorMode = useColorMode();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Tooltip title={isDark ? "Mudar para Claro" : "Mudar para Escuro"}>
      <IconButton 
        onClick={colorMode.toggleColorMode} 
        color="inherit"
        sx={{ 
          transition: 'transform 0.4s ease-in-out',
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            transform: 'rotate(15deg)'
          }
        }}
      >
        {/* Animação simples de troca */}
        <Box 
            component="span" 
            sx={{ 
                display: 'flex', 
                alignItems: 'center',
                animation: 'fadeIn 0.3s',
                '@keyframes fadeIn': {
                    '0%': { opacity: 0, transform: 'scale(0.5)' },
                    '100%': { opacity: 1, transform: 'scale(1)' },
                }
            }}
        >
            {isDark ? <LightModeIcon sx={{ color: '#FDB813' }} /> : <DarkModeIcon sx={{ color: '#90caf9' }} />}
        </Box>
      </IconButton>
    </Tooltip>
  );
}