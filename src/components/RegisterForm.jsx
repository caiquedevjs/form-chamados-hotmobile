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
  Avatar,
  Tooltip // 👈 Adicionei Tooltip pra ficar chique
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';

// 🎨 Paleta de Cores Disponíveis
const CORES_DISPONIVEIS = [
  '#1976d2', // Azul (Padrão)
  '#d32f2f', // Vermelho
  '#2e7d32', // Verde
  '#ed6c02', // Laranja
  '#9c27b0', // Roxo
  '#0288d1', // Azul Claro
  '#7b1fa2', // Violeta
  '#455a64', // Cinza Azulado
];

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cor: '#1976d2' // 👈 Cor padrão inicial
  });

  // Pega a URL do .env (A mesma que consertamos pro Railway)
  const API_URL = 'https://form-chamados-hotmobile-production.up.railway.app'; 

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 👇 Função para escolher a cor
  const handleColorSelect = (corEscolhida) => {
    setFormData({
      ...formData,
      cor: corEscolhida
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
      // 2. Prepara o payload (Agora com a cor!)
      const payload = {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        cor: formData.cor // 👈 Enviando a cor pro Backend
      };

      // 3. Envia para o Railway
      await axios.post(`${API_URL}/auth/register`, payload);

      toast.success("Usuário cadastrado com sucesso!");
      
      // Limpa o form
      setFormData({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        cor: '#1976d2'
      });

      // Redireciona para Login após 1.5s pra dar tempo de ler o toast
      setTimeout(() => {
         window.location.href = '/login'; 
      }, 1500);

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Erro ao cadastrar usuário.";
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
          {/* O Avatar do topo já mostra a cor escolhida */}
          <Avatar sx={{ m: 1, bgcolor: formData.cor, transition: 'background-color 0.3s' }}>
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

            {/* 👇 SELETOR DE CORES */}
            <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    Escolha sua cor de identificação:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {CORES_DISPONIVEIS.map((cor) => (
                        <Tooltip title="Escolher esta cor" key={cor}>
                            <Box
                                onClick={() => handleColorSelect(cor)}
                                sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: cor,
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, border 0.2s',
                                    transform: formData.cor === cor ? 'scale(1.2)' : 'scale(1)',
                                    border: formData.cor === cor ? '3px solid #333' : '2px solid transparent',
                                    boxShadow: formData.cor === cor ? 3 : 1
                                }}
                            />
                        </Tooltip>
                    ))}
                </Box>
            </Box>

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
              // Botão pega a cor escolhida também pra dar um charme
              sx={{ 
                  mt: 3, 
                  mb: 2, 
                  py: 1.5, 
                  fontWeight: 'bold', 
                  bgcolor: formData.cor,
                  '&:hover': { bgcolor: formData.cor, filter: 'brightness(0.9)' }
              }}
            >
              CADASTRAR
            </LoadingButton>
            
            {/* Link para Login */}
            <Button 
                fullWidth 
                variant="text" 
                size="small"
                onClick={() => window.location.href = '/login'}
                sx={{ color: formData.cor }}
            >
                Já tem uma conta? Faça Login
            </Button>

          </Box>
        </Paper>
      </Box>
    </Container>
  );
}