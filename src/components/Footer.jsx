// components/Footer.jsx
import React from 'react';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        textAlign: 'center',
        padding: '8px 0',
        backgroundColor: 'transparent',
        color: 'gray',
        fontSize: '14px',
      }}
    >
      <Typography variant="body2">
        Desenvolvido por <strong>Hotmobile</strong> © 2025
      </Typography>
    </footer>
  );
}
