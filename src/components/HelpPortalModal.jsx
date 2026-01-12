import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function HelpPortalModal() {
  // Começa como true para abrir assim que renderizar
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  const portals = [
    { 
      name: 'Ajuda Hotmobile', 
      url: 'https://ajuda.hotmobile.com.br/',
      desc: 'Dúvidas sobre o sistema de gestão'
    },
    { 
      name: 'Ajuda Atendchat', 
      url: 'https://ajudachat.hotmobile.com.br/',
      desc: 'Configurações de Chat e WhatsApp'
    },
    { 
      name: 'Ajuda Hotmenu', 
      url: 'https://ajuda.hotmenu.com.br/',
      desc: 'Cardápio digital e pedidos'
    }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      aria-labelledby="help-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="help-dialog-title" sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <HelpOutlineIcon color="primary" />
        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
          Centrais de Ajuda
        </Typography>
        
        {/* Botão X no canto superior direito */}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
          Antes de abrir um chamado, verifique se sua dúvida já está respondida em nossas bases de conhecimento:
        </Typography>

        <Stack spacing={2}>
          {portals.map((portal) => (
            <Button
              key={portal.name}
              variant="outlined"
              size="large"
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewIcon />}
              sx={{
                justifyContent: 'space-between',
                textAlign: 'left',
                p: 2,
                borderRadius: 2,
                borderWidth: '1px',
                '&:hover': {
                  borderWidth: '1px',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  {portal.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {portal.desc}
                </Typography>
              </Box>
            </Button>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} variant="contained" color="primary">
          Já verifiquei, quero abrir um chamado
        </Button>
      </DialogActions>
    </Dialog>
  );
}