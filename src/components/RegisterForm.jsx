import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  InputAdornment,
  IconButton,
  Avatar
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });

  // Pega a URL do .env (A mesma que consertamos pro Railway)
  const API_URL = 'https://form-chamados-hotmobile-production.up.railway.app'; 

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // 1. Validações Básicas
    if (!formData.nome || !formData.email || !formData.senha) {
      toast.warning("Preencha todos os campos obrigatórios.");
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast.error("As senhas não coincidem!");
      return;
    }

    if (formData.senha.length < 6) {
      toast.warning("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      // 2. Prepara o payload (o backend espera: nome, email, senha)
      // O 'role' ou 'cargo' geralmente o backend define como padrão se não enviar
      const payload = {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha
      };

      // 3. Envia para o Railway
      await axios.post(`${API_URL}/auth/register`, payload);

      toast.success("Usuário cadastrado com sucesso!");
      
      // Limpa o form
      setFormData({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: ''
      });

      // Opcional: Redirecionar para o Login aqui
       window.location.href = '/login'; 

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Erro ao cadastrar usuário.";
      // Se vier array de erros do backend, junta eles
      if (Array.isArray(msg)) {
        toast.error(msg.join(', '));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: '100%',
            borderRadius: 2
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <PersonAddIcon />
          </Avatar>
          
          <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
            Criar Nova Conta
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            
            {/* Campo Nome */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="nome"
              label="Nome Completo"
              name="nome"
              autoComplete="name"
              autoFocus
              value={formData.nome}
              onChange={handleChange}
            />

            {/* Campo Email */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Endereço de E-mail"
              name="email"
              autoComplete="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />

            {/* Campo Senha */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="senha"
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              id="senha"
              autoComplete="new-password"
              value={formData.senha}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Campo Confirmar Senha */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmarSenha"
              label="Confirmar Senha"
              type={showPassword ? 'text' : 'password'}
              id="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              error={formData.confirmarSenha !== '' && formData.senha !== formData.confirmarSenha}
              helperText={
                formData.confirmarSenha !== '' && formData.senha !== formData.confirmarSenha 
                ? "As senhas não conferem" 
                : ""
              }
            />

            <LoadingButton
              type="submit"
              fullWidth
              variant="contained"
              loading={loading}
              sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
            >
              CADASTRAR
            </LoadingButton>
            
            {/* Link para Login (Futuro) */}
            <Button 
                fullWidth 
                variant="text" 
                size="small"
                onClick={() =>  window.location.href = '/login'}
            >
                Já tem uma conta? Faça Login
            </Button>

          </Box>
        </Paper>
      </Box>
    </Container>
  );
}