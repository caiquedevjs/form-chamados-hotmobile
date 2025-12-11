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
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

// --- TIPOS ---
interface Anexo { id: number; nomeOriginal: string; nomeArquivo: string; }
interface Interacao { 
  id: number; 
  texto: string; 
  autor: 'CLIENTE' | 'SUPORTE'; 
  createdAt: string; 
  anexos?: Anexo[]; // Novo campo
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

// Função auxiliar para notificação
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
  
  // Estados para Anexos no Chat
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    if (id) fetchChamado();
  }, [id]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chamado?.interacoes]);

  // SOCKET.IO
  useEffect(() => {
    const socket = io('http://localhost:3000');
    const audio = new Audio('/notification.mp3'); 

    socket.on('nova_interacao', (data) => {
      if (Number(data.chamadoId) === Number(id)) {
        setChamado((prev) => {
          if (!prev) return null;
          const jaExiste = prev.interacoes.some(i => i.id === data.id);
          if (jaExiste) return prev;
          return { ...prev, interacoes: [...prev.interacoes, data] };
        });

        if (data.autor === 'SUPORTE') {
          toast.info("🔔 O suporte respondeu!", { position: "top-center", theme: "colored" });
          audio.play().catch(() => {});
          if (document.hidden) dispararNotificacaoNativa("Nova mensagem do Suporte", data.texto);
        }
      }
    });

    return () => { socket.disconnect(); };
  }, [id]);

  const fetchChamado = async () => {
    try {
      const response = await api.get(`http://localhost:3000/chamados/${id}`);
      setChamado(response.data);
    } catch (error) {
      toast.error('Chamado não encontrado.');
    } finally {
      setLoading(false); 
    }
  };

  // --- LÓGICA DE ARQUIVOS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Converte FileList para Array e soma aos existentes
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // --- ENVIO COM FORMDATA (TEXTO + ARQUIVOS) ---
  const handleSendReply = async () => {
    if (!novoComentario.trim() && files.length === 0) return;

    // Monta o FormData
    const formData = new FormData();
    formData.append('texto', novoComentario || 'Segue anexo.'); // Garante texto se só mandar anexo
    formData.append('autor', 'CLIENTE');
    
    // Adiciona cada arquivo
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      await api.post(`http://localhost:3000/chamados/${id}/interacoes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setNovoComentario('');
      setFiles([]); // Limpa arquivos
      if (fileInputRef.current) fileInputRef.current.value = ''; // Limpa input

      toast.success("Enviado com sucesso!", { position: "top-center", autoClose: 2000 });
    } catch (error) {
      toast.error('Erro ao enviar.');
    }
  };

  if (loading) return <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;
  if (!chamado) return <Box sx={{ p: 4 }}><Typography>Erro</Typography></Box>;

  const statusInfo = STATUS_COLORS[chamado.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.NOVO;

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#f5f5f5', pb: 6, width: '100%' }}>
      <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'white' }}>
        <Toolbar>
           <IconButton edge="start" onClick={() => window.history.back()}><ArrowBackIcon /></IconButton>
           <Box sx={{ flexGrow: 1, ml: 1 }}>
             <Typography variant="subtitle2" color="text.secondary" fontSize="0.8rem">Acompanhamento</Typography>
             <Typography variant="h6" fontWeight="bold">Chamado #{chamado.id}</Typography>
           </Box>
           <Chip label={statusInfo.label} size="small" sx={{ bgcolor: statusInfo.bg, color: statusInfo.color, fontWeight: 'bold' }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: { xs: 2, md: 4 } }}>
        <Grid container spacing={3}>
          {/* Card Info ... (Mantido igual, omitido pra poupar espaço) ... */}
          <Grid item xs={12}>
             {/* ... Cabeçalho info da empresa ... */}
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, color: '#555', px: 1 }}>Histórico</Typography>
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, bgcolor: '#fff' }}>
              
              <Box sx={{ maxHeight: '400px', overflowY: 'auto', pr: 1, mb: 2 }}>
                
                {/* Descrição Original */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mb: 3 }}>
                   <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                     <Typography variant="caption" color="text.secondary">{new Date(chamado.createdAt).toLocaleString()}</Typography>
                     <Typography variant="caption" fontWeight="bold">Você</Typography>
                     <Avatar sx={{ width: 24, height: 24, bgcolor: '#1976d2' }}><PersonIcon fontSize="small" /></Avatar>
                   </Box>
                   <Paper elevation={0} sx={{ p: 2, bgcolor: '#E3F2FD', borderRadius: '12px 0 12px 12px', maxWidth: '90%' }}>
                     <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{chamado.descricao}</Typography>
                   </Paper>
                </Box>

                {/* Lista de Interações */}
                {chamado.interacoes?.map((msg, idx) => {
                  const isCliente = msg.autor === 'CLIENTE';
                  return (
                    <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: isCliente ? 'flex-end' : 'flex-start', mb: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5} flexDirection={isCliente ? 'row' : 'row-reverse'}>
                        <Typography variant="caption" color="text.secondary">{new Date(msg.createdAt).toLocaleString()}</Typography>
                        <Typography variant="caption" fontWeight="bold">{isCliente ? 'Você' : 'Suporte'}</Typography>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: isCliente ? '#1976d2' : '#e65100' }}>{isCliente ? <PersonIcon fontSize="small" /> : <SupportAgentIcon fontSize="small" />}</Avatar>
                      </Box>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: isCliente ? '#E3F2FD' : '#F5F5F5', borderRadius: isCliente ? '12px 0 12px 12px' : '0 12px 12px 12px', maxWidth: '90%' }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{msg.texto}</Typography>
                        
                        {/* --- EXIBIR ANEXOS DA MENSAGEM --- */}
                        {msg.anexos && msg.anexos.length > 0 && (
                          <Box mt={1} pt={1} borderTop="1px solid rgba(0,0,0,0.1)">
                            {msg.anexos.map(anexo => (
                              <Chip
                                key={anexo.id}
                                icon={<AttachIcon />}
                                label={anexo.nomeOriginal}
                                component="a"
                                href={`http://localhost:3000/uploads/${anexo.nomeArquivo}`}
                                target="_blank"
                                clickable
                                size="small"
                                sx={{ m: 0.5, bgcolor: 'rgba(255,255,255,0.5)' }}
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

              <Divider sx={{ my: 3 }} />

              {/* --- ÁREA DE RESPOSTA COM ANEXO --- */}
              {chamado.status !== 'FINALIZADO' ? (
                <Box>
                  {/* Pré-visualização dos arquivos selecionados */}
                  {files.length > 0 && (
                    <Box mb={1} display="flex" gap={1} flexWrap="wrap">
                      {files.map((file, i) => (
                        <Chip 
                          key={i} 
                          label={file.name} 
                          onDelete={() => removeFile(i)} 
                          size="small" 
                          icon={<AttachIcon />}
                        />
                      ))}
                    </Box>
                  )}

                  <Box display="flex" gap={1} alignItems="flex-end">
                    {/* Input de Arquivo (Oculto) */}
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    
                    {/* Botão de Anexo */}
                    <IconButton 
                      color="primary" 
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ border: '1px solid #ccc', borderRadius: 1 }}
                    >
                      <AttachIcon />
                    </IconButton>

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
                      endIcon={<SendIcon />}
                      onClick={handleSendReply}
                      sx={{ height: '40px' }}
                    >
                      Enviar
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography align="center" color="text.secondary">Chamado encerrado.</Typography>
              )}
              
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}