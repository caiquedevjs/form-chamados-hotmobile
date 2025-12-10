import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, Typography, Paper, Chip, TextField, Button, 
  Container, Grid, Avatar, Divider, AppBar, Toolbar, IconButton, CircularProgress
} from '@mui/material';
import { 
  Send as SendIcon, 
  Person as PersonIcon, 
  SupportAgent as SupportAgentIcon,
  Business as BusinessIcon,
  AttachFile as AttachIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client'; // <--- Importante para o tempo real

// --- TIPOS ---
interface Anexo { id: number; nomeOriginal: string; nomeArquivo: string; }
interface Interacao { id: number; texto: string; autor: 'CLIENTE' | 'SUPORTE'; createdAt: string; }
interface Chamado {
  id: number;
  nomeEmpresa: string;
  servico: string;
  descricao: string;
  status: string;
  createdAt: string;
  anexos: Anexo[];
  interacoes: Interacao[];
}

const STATUS_COLORS = {
  NOVO: { bg: '#E3F2FD', color: '#1565C0', label: 'Recebido' },
  EM_ATENDIMENTO: { bg: '#FFF3E0', color: '#EF6C00', label: 'Em Atendimento' },
  FINALIZADO: { bg: '#E8F5E9', color: '#2E7D32', label: 'Concluído' },
};


const dispararNotificacaoNativa = (titulo: string, corpo: string) => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(titulo, { body: corpo, icon: '/vite.svg' });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission();
  }
};



export default function ClientTracking() {
  const { id } = useParams();
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [novoComentario, setNovoComentario] = useState('');
  const [loading, setLoading] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // 1. CARREGAMENTO INICIAL
  useEffect(() => {
    if (id) fetchChamado();
  }, [id]);

  // 2. SCROLL AUTOMÁTICO
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chamado?.interacoes]); // Rola sempre que as interações mudarem


  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

// 3. TEMPO REAL (SOCKET.IO) - ATUALIZADO
  useEffect(() => {
    const socket = io('http://localhost:3000');
    const audio = new Audio('/notification.mp3'); 

    socket.on('nova_interacao', (data) => {
      // Verifica se a mensagem é para ESTE chamado
      if (Number(data.chamadoId) === Number(id)) {
        
        setChamado((prev) => {
          if (!prev) return null;
          const jaExiste = prev.interacoes.some(i => i.id === data.id);
          if (jaExiste) return prev;
          return { ...prev, interacoes: [...prev.interacoes, data] };
        });

        // --- AQUI ESTÁ A MUDANÇA ---
        if (data.autor === 'SUPORTE') {
          // 1. Toast (Visual dentro do app)
          toast.info("🔔 O suporte respondeu ao seu chamado!", {
            position: "top-center",
            theme: "colored"
          });
          
          // 2. Som
          audio.play().catch(() => {});

          // 3. Notificação do Navegador (NOVO!)
          // Só mostra se a aba estiver oculta (opcional, mas recomendado) ou sempre
          if (document.hidden) {
             dispararNotificacaoNativa("Nova mensagem do Suporte", data.texto);
          } else {
             // Se quiser mostrar SEMPRE, mesmo com a aba aberta, tire o if(document.hidden)
             dispararNotificacaoNativa("Nova mensagem do Suporte", data.texto);
          }
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  // Função de Enviar (Cliente)
  const handleSendReply = async () => {
    if (!novoComentario.trim()) return;

    try {
      // Envia para o backend
      await axios.post(`http://localhost:3000/chamados/${id}/interacoes`, {
        texto: novoComentario,
        autor: 'CLIENTE'
      });
      
      setNovoComentario('');
      
      // Feedback imediato para o Cliente
      toast.success("Comentário adicionado com sucesso!", {
        position: "top-center",
        autoClose: 3000
      });

    } catch (error) {
      toast.error('Erro ao enviar resposta.');
    }
  };
  const fetchChamado = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/chamados/${id}`);
      setChamado(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Chamado não encontrado.');
    } finally {
      // IMPORTANTE: Isso garante que o loading pare, mesmo se der erro
      setLoading(false); 
    }
  };

  

  // --- TRATAMENTO DE ESTADOS DE CARREGAMENTO ---
  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
        <Typography ml={2}>Carregando chamado...</Typography>
      </Box>
    );
  }

  if (!chamado) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">Chamado não encontrado.</Typography>
        <Button onClick={() => window.history.back()} sx={{ mt: 2 }}>Voltar</Button>
      </Box>
    );
  }

  const statusInfo = STATUS_COLORS[chamado.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.NOVO;

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#f5f5f5', pb: 6, width: '100%' }}>
      
      <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'white' }}>
        <Toolbar>
           <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 1 }} onClick={() => window.history.back()}>
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Acompanhamento
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Chamado #{chamado.id}
            </Typography>
          </Box>
          
          <Chip 
            label={statusInfo.label} 
            size="small"
            sx={{ 
              bgcolor: statusInfo.bg, 
              color: statusInfo.color, 
              fontWeight: 'bold',
              height: 24
            }} 
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: { xs: 2, md: 4 } }}>
        <Grid container spacing={3}>
          
          <Grid item xs={12}>
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BusinessIcon color="primary" />
                <Typography variant="h6" fontWeight="bold" sx={{ wordBreak: 'break-word' }}>
                  {chamado.nomeEmpresa}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Grid container spacing={2} sx={{ mt: 0 }}>
                <Grid item xs={12} sm={6}>
                   <Typography variant="caption" color="text.secondary">Serviço Solicitado</Typography>
                   <Typography variant="body1" fontWeight="500">{chamado.servico}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                   <Typography variant="caption" color="text.secondary">Data de Abertura</Typography>
                   <Typography variant="body1" fontWeight="500">{new Date(chamado.createdAt).toLocaleString()}</Typography>
                </Grid>
              </Grid>

              {chamado.anexos && chamado.anexos.length > 0 && (
                <Box mt={2} bgcolor="#fafafa" p={1.5} borderRadius={1} border="1px solid #eee">
                  <Typography variant="caption" fontWeight="bold" display="block" mb={1}>
                    Arquivos Anexados:
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {chamado.anexos.map((anexo, idx) => (
                      <Chip
                        key={idx}
                        icon={<AttachIcon />}
                        label={anexo.nomeOriginal.length > 20 ? anexo.nomeOriginal.substring(0, 17) + '...' : anexo.nomeOriginal}
                        component="a"
                        href={`http://localhost:3000/uploads/${anexo.nomeArquivo}`}
                        target="_blank"
                        clickable
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, color: '#555', px: 1 }}>Histórico</Typography>
            
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, bgcolor: '#fff' }}>
              
              {/* --- ÁREA DE SCROLL DO CHAT --- */}
              <Box 
                sx={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto', 
                  pr: 1, 
                  mb: 2,
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: '4px' }
                }}
              >
                {/* 1. Abertura */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mb: 3 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(chamado.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" fontWeight="bold">Você</Typography>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: '#1976d2' }}><PersonIcon fontSize="small" /></Avatar>
                  </Box>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#E3F2FD', 
                      borderRadius: '12px 0 12px 12px',
                      maxWidth: { xs: '95%', md: '85%' }, 
                      wordWrap: 'break-word'
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{chamado.descricao}</Typography>
                  </Paper>
                </Box>

                {/* 2. Interações */}
                {chamado.interacoes?.map((msg, idx) => {
                  const isCliente = msg.autor === 'CLIENTE';
                  return (
                    <Box 
                      key={idx} 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: isCliente ? 'flex-end' : 'flex-start',
                        mb: 2 
                      }}
                    >
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        gap={1} 
                        mb={0.5} 
                        flexDirection={isCliente ? 'row' : 'row-reverse'}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {new Date(msg.createdAt).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {isCliente ? 'Você' : 'Suporte'}
                        </Typography>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: isCliente ? '#1976d2' : '#e65100' }}>
                          {isCliente ? <PersonIcon fontSize="small" /> : <SupportAgentIcon fontSize="small" />}
                        </Avatar>
                      </Box>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          bgcolor: isCliente ? '#E3F2FD' : '#F5F5F5', 
                          color: isCliente ? '#0d47a1' : '#333',
                          borderRadius: isCliente ? '12px 0 12px 12px' : '0 12px 12px 12px',
                          maxWidth: { xs: '95%', md: '85%' },
                          wordWrap: 'break-word'
                        }}
                      >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{msg.texto}</Typography>
                      </Paper>
                    </Box>
                  );
                })}
                
                {/* Referência para scroll automático */}
                <div ref={chatEndRef} />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Input */}
              {chamado.status !== 'FINALIZADO' ? (
                <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }}>
                  <TextField 
                    fullWidth 
                    placeholder="Digite uma resposta..." 
                    variant="outlined"
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    multiline
                    maxRows={4}
                    size="small"
                  />
                  <Button 
                    variant="contained" 
                    size="large" 
                    endIcon={<SendIcon />}
                    onClick={handleSendReply}
                    sx={{ height: 'fit-content', minWidth: '120px' }}
                  >
                    Enviar
                  </Button>
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9', textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Este chamado foi encerrado. Caso precise, abra um novo chamado.
                  </Typography>
                </Paper>
              )}
              
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}