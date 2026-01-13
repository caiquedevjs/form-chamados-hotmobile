import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, Typography, Paper, Chip, TextField, Button, 
  Container, Grid, Avatar, Divider, AppBar, Toolbar, IconButton, CircularProgress, useTheme, useMediaQuery
} from '@mui/material';
import { 
  Send as SendIcon, 
  Person as PersonIcon, 
  SupportAgent as SupportAgentIcon,
  Business as BusinessIcon,
  AttachFile as AttachIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

// ✅ 1. CONFIGURAÇÃO DA URL
const API_URL = 'https://form-chamados-hotmobile-production.up.railway.app';

// --- TIPOS ---
interface Anexo {
  caminho: any; id: number; nomeOriginal: string; nomeArquivo: string; 
}
interface Interacao { 
  id: number; 
  texto: string; 
  autor: 'CLIENTE' | 'SUPORTE'; 
  createdAt: string; 
  anexos?: Anexo[]; 
}
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
  const theme = useTheme();
  // Hook para saber se é celular (tela pequena)
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [novoComentario, setNovoComentario] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    if (id) fetchChamado();
  }, [id]);

  // Scroll automático para o fim do chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chamado?.interacoes, loading]);

  useEffect(() => {
    // ✅ 2. SOCKET E ÁUDIO
    const socket = io(API_URL);
    
    // Instancia o áudio
    const audio = new Audio('/notification.mp3'); 
    
    // Função auxiliar segura para tocar som
    const playNotificationSound = () => {
      audio.play().catch((err) => {
        console.warn("Autoplay bloqueado pelo navegador até interação do usuário:", err);
      });
    };

    socket.on('nova_interacao', (data) => {
      // Verifica se a mensagem pertence a este chamado
      if (Number(data.chamadoId) === Number(id)) {
        
        setChamado((prev) => {
          if (!prev) return null;
          const jaExiste = prev.interacoes.some(i => i.id === data.id);
          if (jaExiste) return prev;
          return { ...prev, interacoes: [...prev.interacoes, data] };
        });

        // Se a mensagem veio do SUPORTE, notifica o cliente
        if (data.autor === 'SUPORTE') {
          playNotificationSound(); // Toca o som
          
          toast.info("🔔 Nova mensagem do suporte!", { 
            position: "top-center", 
            theme: "colored",
            autoClose: 3000
          });
          
          if (document.hidden) {
            dispararNotificacaoNativa("Nova mensagem do Suporte", data.texto);
          }
        }
      }
    });

    socket.on('mudanca_status', (data) => {
      if (Number(data.id) === Number(id)) {
        setChamado((prev) => {
          if (!prev) return null;
          return { ...prev, status: data.status }; 
        });

        if (data.status === 'FINALIZADO') {
           toast.warn("Este chamado foi finalizado pelo suporte.", {
             position: "top-center",
             autoClose: false 
           });
        }
      }
    });

    return () => { socket.disconnect(); };
  }, [id]);

  const fetchChamado = async () => {
    try {
      const response = await api.get(`${API_URL}/chamados/${id}`);
      setChamado(response.data);
    } catch (error) {
      toast.error('Chamado não encontrado.');
    } finally {
      setLoading(false); 
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async () => {
    if (!novoComentario.trim() && files.length === 0) return;

    const formData = new FormData();
    formData.append('texto', novoComentario || 'Segue anexo.'); 
    formData.append('autor', 'CLIENTE');
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      await api.post(`${API_URL}/chamados/${id}/interacoes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setNovoComentario('');
      setFiles([]); 
      if (fileInputRef.current) fileInputRef.current.value = ''; 

      // Scroll para baixo após enviar
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      toast.success("Enviado!", { position: "top-center", autoClose: 1500 });
    } catch (error) {
      toast.error('Erro ao enviar.');
    }
  };

  if (loading) return <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;
  if (!chamado) return <Box sx={{ p: 4 }}><Typography>Erro</Typography></Box>;

  const statusInfo = STATUS_COLORS[chamado.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.NOVO;

  return (
    // ✅ 3. LAYOUT RESPONSIVO (100dvh para mobile)
    <Box sx={{ 
      height: '100dvh', // Ocupa a altura real da tela (bom para mobile)
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#f5f5f5', 
      overflow: 'hidden', // Evita scroll na página inteira, só no chat
      marginTop: 20

    }}>
      
      {/* APP BAR FIXO */}
      <AppBar position="static" color="default" elevation={1} sx={{ bgcolor: 'white', zIndex: 10 }}>
        <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' } }}>
           <IconButton edge="start" onClick={() => window.history.back()}><ArrowBackIcon /></IconButton>
           <Box sx={{ flexGrow: 1, ml: 1, overflow: 'hidden' }}>
             <Typography variant="subtitle2" color="text.secondary" fontSize="0.75rem" noWrap>
                Acompanhamento
             </Typography>
             <Typography variant="h6" fontWeight="bold" fontSize={isMobile ? "1rem" : "1.25rem"} noWrap>
                #{chamado.id} - {chamado.nomeEmpresa}
             </Typography>
           </Box>
           <Chip 
              label={statusInfo.label} 
              size="small" 
              sx={{ bgcolor: statusInfo.bg, color: statusInfo.color, fontWeight: 'bold', fontSize: '0.75rem', height: '24px' }} 
           />
        </Toolbar>
      </AppBar>

      {/* ÁREA DE CONTEÚDO (Preenche o resto da tela) */}
      <Container 
        maxWidth="md" 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          p: { xs: 1, md: 3 }, // Padding menor no mobile
          overflow: 'hidden'
        }}
      >
        <Paper 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: { xs: 2, md: 3 }, 
            bgcolor: '#fff',
            overflow: 'hidden', // Importante para o scroll interno funcionar
            boxShadow: 3
          }}
        >
          
          {/* ÁREA DE MENSAGENS (Scrollável) */}
          <Box sx={{ 
            flexGrow: 1, 
            overflowY: 'auto', 
            p: { xs: 1.5, md: 3 },
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Descrição Original */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mb: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="caption" color="text.secondary" fontSize="0.7rem">{new Date(chamado.createdAt).toLocaleString()}</Typography>
                  <Typography variant="caption" fontWeight="bold">Você</Typography>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: '#1976d2' }}><PersonIcon fontSize="small" /></Avatar>
                </Box>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#E3F2FD', borderRadius: '12px 0 12px 12px', maxWidth: '95%' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{chamado.descricao}</Typography>
                </Paper>
            </Box>

            {/* Lista de Interações */}
            {chamado.interacoes?.map((msg, idx) => {
              const isCliente = msg.autor === 'CLIENTE';
              return (
                <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: isCliente ? 'flex-end' : 'flex-start', mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5} flexDirection={isCliente ? 'row' : 'row-reverse'}>
                    <Typography variant="caption" color="text.secondary" fontSize="0.7rem">{new Date(msg.createdAt).toLocaleString()}</Typography>
                    <Typography variant="caption" fontWeight="bold">{isCliente ? 'Você' : 'Suporte'}</Typography>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: isCliente ? '#1976d2' : '#e65100' }}>{isCliente ? <PersonIcon fontSize="small" /> : <SupportAgentIcon fontSize="small" />}</Avatar>
                  </Box>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: isCliente ? '#E3F2FD' : '#F5F5F5', borderRadius: isCliente ? '12px 0 12px 12px' : '0 12px 12px 12px', maxWidth: '95%' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{msg.texto}</Typography>
                    
                    {msg.anexos && msg.anexos.length > 0 && (
                      <Box mt={1} pt={1} borderTop="1px solid rgba(0,0,0,0.1)">
                        {msg.anexos.map(anexo => (
                          <Chip
                            key={anexo.id}
                            icon={<AttachIcon />}
                            label={anexo.nomeOriginal.length > 15 && isMobile ? anexo.nomeOriginal.substring(0, 10) + '...' : anexo.nomeOriginal}
                            component="a"
                            href={anexo.caminho && anexo.caminho.startsWith('http') ? anexo.caminho : `${API_URL}/uploads/${anexo.nomeArquivo}`}
                            target="_blank"
                            clickable
                            size="small"
                            sx={{ m: 0.5, bgcolor: 'rgba(255,255,255,0.5)', maxWidth: '100%' }}
                          />
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Box>
              );
            })}
            <div ref={chatEndRef} />
          </Box>

          <Divider />

          {/* --- ÁREA DE RESPOSTA (Fixa no fundo do Paper) --- */}
          {chamado.status !== 'FINALIZADO' ? (
            <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: '#fafafa' }}>
              
              {/* Preview dos arquivos */}
              {files.length > 0 && (
                <Box mb={1} display="flex" gap={1} flexWrap="wrap">
                  {files.map((file, i) => (
                    <Chip 
                      key={i} 
                      label={isMobile && file.name.length > 10 ? file.name.substring(0,10)+'...' : file.name} 
                      onDelete={() => removeFile(i)} 
                      size="small" 
                      icon={<AttachIcon />}
                    />
                  ))}
                </Box>
              )}

              <Box display="flex" gap={1} alignItems="flex-end">
                <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                
                <IconButton 
                  color="primary" 
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ border: '1px solid #ccc', borderRadius: 1, p: 1 }}
                >
                  <AttachIcon />
                </IconButton>

                <TextField 
                  fullWidth 
                  placeholder="Mensagem..." 
                  variant="outlined"
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  multiline
                  maxRows={3}
                  size="small"
                  sx={{ bgcolor: 'white' }}
                />
                
                <IconButton 
                  color="primary" 
                  onClick={handleSendReply}
                  disabled={!novoComentario.trim() && files.length === 0}
                  sx={{ bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#1565c0' }, p: 1 }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          ) : (
            <Box p={2} bgcolor="#fafafa">
              <Typography align="center" color="text.secondary" variant="body2">
                🔒 Chamado encerrado.
              </Typography>
            </Box>
          )}
          
        </Paper>
      </Container>
    </Box>
  );
}