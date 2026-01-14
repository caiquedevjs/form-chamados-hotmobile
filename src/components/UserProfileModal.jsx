import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Avatar, IconButton,
  InputAdornment, Divider, Grid
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  AccountCircle as AccountIcon,
  Palette as PaletteIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext'; // Para atualizar o contexto global

// Paleta de Cores para o Usuário
const USER_COLORS = [
  '#1976d2', '#dc004e', '#388e3c', '#f57c00', '#7b1fa2',
  '#0288d1', '#00796b', '#c2185b', '#512da8', '#d32f2f',
  '#455a64', '#689f38', '#e64a19', '#5d4037', '#616161'
];

export default function UserProfileModal({ open, onClose }) {
  const { user, setUser } = useAuth(); // Pega dados do contexto
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cor: '#1976d2',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  // Carrega dados atuais quando abre o modal
  useEffect(() => {
    if (user && open) {
      setFormData({
        nome: user.nome || user.name || '',
        email: user.email || '',
        cor: user.cor || '#1976d2',
        password: '',
        confirmPassword: ''
      });
    }
  }, [user, open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    // Validações básicas
    if (!formData.nome || !formData.email) {
      return toast.warning("Nome e E-mail são obrigatórios.");
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      return toast.error("As senhas não coincidem!");
    }

    try {
      // Monta objeto para envio (remove senha se estiver vazia)
      const payload = {
        nome: formData.nome,
        email: formData.email,
        cor: formData.cor
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const { data: userAtualizado } = await api.patch('/users/me', payload);

      // Atualiza o contexto global (para mudar o avatar no topo na hora)
      setUser(prev => ({ ...prev, ...userAtualizado }));
      
      toast.success("Perfil atualizado com sucesso!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar perfil.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1}>
            <AccountIcon color="primary" />
            <Typography variant="h6">Meu Perfil</Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
           {/* Preview do Avatar */}
           <Avatar 
             sx={{ 
               width: 80, 
               height: 80, 
               bgcolor: formData.cor, 
               fontSize: 32,
               mb: 1,
               boxShadow: 3
             }}
           >
             {formData.nome.charAt(0)?.toUpperCase()}
           </Avatar>
           <Typography variant="caption" color="text.secondary">Pré-visualização do Avatar</Typography>
        </Box>

        <Grid container spacing={2}>
            {/* Dados Básicos */}
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Nome Completo"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    variant="outlined"
                />
            </Grid>
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="E-mail"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    variant="outlined"
                />
            </Grid>

            {/* Seletor de Cor */}
            <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
                    <PaletteIcon fontSize="small" color="action"/> Cor do Avatar
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" p={1} bgcolor="#f5f5f5" borderRadius={2}>
                    {USER_COLORS.map(cor => (
                        <Box
                           key={cor}
                           onClick={() => setFormData(prev => ({ ...prev, cor }))}
                           sx={{
                               width: 30, height: 30, borderRadius: '50%', bgcolor: cor,
                               cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                               border: formData.cor === cor ? '2px solid #333' : '2px solid transparent',
                               transform: formData.cor === cor ? 'scale(1.1)' : 'scale(1)',
                               transition: 'all 0.2s'
                           }}
                        >
                            {formData.cor === cor && <CheckCircleIcon sx={{ color: 'white', fontSize: 18 }} />}
                        </Box>
                    ))}
                </Box>
            </Grid>

            <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Alterar Senha (Opcional)" /></Divider></Grid>

            {/* Senha */}
            <Grid item xs={6}>
                <TextField
                    fullWidth
                    label="Nova Senha"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                    }}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField
                    fullWidth
                    label="Confirmar Senha"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={!formData.password}
                />
            </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary" startIcon={<SaveIcon />}>
            Salvar Alterações
        </Button>
      </DialogActions>
    </Dialog>
  );
}