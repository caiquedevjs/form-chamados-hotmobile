import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, Typography, Paper, Chip, TextField, Button, 
  Container, Avatar, AppBar, Toolbar, IconButton, CircularProgress, 
  useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, Divider
} from '@mui/material';
import { 
  Send as SendIcon, 
  Person as PersonIcon, 
  SupportAgent as SupportAgentIcon,
  AttachFile as AttachIcon,
  ArrowBack as ArrowBackIcon,
  WarningAmberRounded as WarningIcon,
  Mic as MicIcon // 👈 Ícone Mic
} from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import AudioRecorder from './AudioRecorder'; 

const API_URL = 'https://form-chamados-hotmobile-production.up.railway.app';

const STATUS_COLORS = {
  NOVO: { bg: '#E3F2FD', color: '#1565C0', label: 'Recebido' },
  EM_ATENDIMENTO: { bg: '#FFF3E0', color: '#EF6C00', label: 'Em Atendimento' },
  FINALIZADO: { bg: '#E8F5E9', color: '#2E7D32', label: 'Concluído' },
};

export default function ClientTracking() {
  const { id } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [chamado, setChamado] = useState(null);
  const [novoComentario, setNovoComentario] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const [openWarning, setOpenWarning] = useState(false);

  useEffect(() => {
    if (id) fetchChamado();
  }, [id]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chamado?.interacoes, loading]);

  useEffect(() => {
    const socket = io(API_URL);
    const audioNotification = new Audio('/notification.mp3'); 
    
    socket.on('nova_interacao', (data) => {
      if (data.interno === true) return; 

      if (Number(data.chamadoId) === Number(id)) {
        setChamado((prev) => {
          if (!prev) return null;
          const jaExiste = prev.interacoes.some(i => i.id === data.id);
          if (jaExiste) return prev;
          return { ...prev, interacoes: [...prev.interacoes, data] };
        });

        if (data.autor === 'SUPORTE') {
          audioNotification.play().catch(() => {});
          toast.info("🔔 Nova mensagem do suporte!");
        }
      }
    });

    socket.on('mudanca_status', (data) => {
      if (Number(data.id) === Number(id)) {
        setChamado((prev) => prev ? { ...prev, status: data.status } : null);
        if (data.status === 'FINALIZADO') toast.warn("Chamado finalizado.");
      }
    });

    return () => { socket.disconnect(); };
  }, [id]);

  const fetchChamado = async () => {
    try {
      const response = await api.get(`${API_URL}/chamados/public/${id}`);
      setChamado(response.data);
    } catch (error) {
      toast.error('Chamado não encontrado.');
    } finally {
      setLoading(false); 
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const validFiles = selectedFiles.filter(file => allowedTypes.includes(file.type));

      if (validFiles.length < selectedFiles.length) setOpenWarning(true);
      if (validFiles.length > 0) setFiles((prev) => [...prev, ...validFiles]);
      
      e.target.value = '';
    }
  };

  const handleAudioRecorded = (audioFile) => {
    setFiles((prev) => [...prev, audioFile]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async () => {
    if (!novoComentario.trim() && files.length === 0) return;

    const formData = new FormData();
    formData.append('texto', novoComentario || 'Segue anexo.'); 
    formData.append('autor', 'CLIENTE');
    files.forEach((file) => formData.append('files', file));

    try {
      await api.post(`${API_URL}/chamados/${id}/interacoes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNovoComentario('');
      setFiles([]); 
      if (fileInputRef.current) fileInputRef.current.value = ''; 
      toast.success("Enviado!");
    } catch (error) {
      toast.error('Erro ao enviar.');
    }
  };

  if (loading) return <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;
  if (!chamado) return <Box sx={{ p: 4 }}><Typography>Erro</Typography></Box>;

  const statusInfo = STATUS_COLORS[chamado.status] || STATUS_COLORS.NOVO;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5', pt: { xs: 9, md: 12 } }}>
      <AppBar position="fixed" color="default" elevation={1} sx={{ bgcolor: 'white' }}>
        <Toolbar>
           <IconButton edge="start" onClick={() => window.history.back()}><ArrowBackIcon /></IconButton>
           <Box sx={{ flexGrow: 1, ml: 1 }}>
             <Typography variant="subtitle2" color="text.secondary" fontSize="0.75rem">Acompanhamento</Typography>
             <Typography variant="h6" fontWeight="bold" fontSize={isMobile ? "1rem" : "1.25rem"}>#{chamado.id} - {chamado.nomeEmpresa}</Typography>
           </Box>
           <Chip label={statusInfo.label} size="small" sx={{ bgcolor: statusInfo.bg, color: statusInfo.color, fontWeight: 'bold' }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: { xs: 1, md: 3 }, overflow: 'hidden' }}>
        <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
            
            {/* Abertura (Descrição Original) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mb: 3 }}>
                <Box display="flex" gap={1} mb={0.5}><Typography variant="caption" fontWeight="bold">Você</Typography><Avatar sx={{ width: 24, height: 24, bgcolor: '#1976d2' }}><PersonIcon fontSize="small" /></Avatar></Box>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#E3F2FD', borderRadius: '12px 0 12px 12px', maxWidth: '90%' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{chamado.descricao}</Typography>
                  
                  {/* ✅ EXIBIR ANEXOS/ÁUDIO DO FORMULÁRIO INICIAL */}
                  {chamado.anexos && chamado.anexos.length > 0 && (
                      <Box mt={1} pt={1} borderTop="1px solid rgba(0,0,0,0.1)">
                          {chamado.anexos.map(anexo => {
                              const isAudio = anexo.nomeArquivo.match(/\.(mp3|wav|webm|ogg)$/i);
                              const url = anexo.caminho.startsWith('http') ? anexo.caminho : `${API_URL}/uploads/${anexo.nomeArquivo}`;
                              
                              if (isAudio) {
                                  return (<Box key={anexo.id} mt={1}><audio controls src={url} style={{ height: 35, width: '100%', maxWidth: 250 }} /></Box>);
                              }
                              return (<Chip key={anexo.id} icon={<AttachIcon />} label={anexo.nomeOriginal} component="a" href={url} target="_blank" clickable size="small" sx={{ m: 0.5 }} />);
                          })}
                      </Box>
                  )}
                </Paper>
            </Box>

            {/* Chat */}
            {chamado.interacoes?.map((msg, idx) => {
              const isCliente = msg.autor === 'CLIENTE';
              return (
                <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: isCliente ? 'flex-end' : 'flex-start', mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5} flexDirection={isCliente ? 'row' : 'row-reverse'}>
                    <Typography variant="caption" color="text.secondary">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Typography>
                    <Typography variant="caption" fontWeight="bold">{isCliente ? 'Você' : 'Suporte'}</Typography>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: isCliente ? '#1976d2' : '#e65100' }}>{isCliente ? <PersonIcon fontSize="small" /> : <SupportAgentIcon fontSize="small" />}</Avatar>
                  </Box>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: isCliente ? '#E3F2FD' : '#F5F5F5', borderRadius: isCliente ? '12px 0 12px 12px' : '0 12px 12px 12px', maxWidth: '90%' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{msg.texto}</Typography>
                    
                    {/* ✅ EXIBIR ÁUDIO E ANEXOS NO CHAT */}
                    {msg.anexos && msg.anexos.length > 0 && (
                      <Box mt={1} pt={1} borderTop="1px solid rgba(0,0,0,0.1)">
                        {msg.anexos.map(anexo => {
                          const isAudio = anexo.nomeArquivo.match(/\.(mp3|wav|webm|ogg)$/i);
                          const url = anexo.caminho.startsWith('http') ? anexo.caminho : `${API_URL}/uploads/${anexo.nomeArquivo}`;
                          
                          if (isAudio) {
                             return (<Box key={anexo.id} mt={1}><audio controls src={url} style={{ height: 35, width: '100%', maxWidth: 250 }} /></Box>);
                          }
                          return (<Chip key={anexo.id} icon={<AttachIcon />} label={anexo.nomeOriginal} component="a" href={url} target="_blank" clickable size="small" sx={{ m: 0.5 }} />);
                        })}
                      </Box>
                    )}
                  </Paper>
                </Box>
              );
            })}
            <div ref={chatEndRef} />
          </Box>

          <Divider />

          {/* ÁREA DE RESPOSTA */}
          {chamado.status !== 'FINALIZADO' ? (
            <Box sx={{ p: 2, bgcolor: '#fafafa' }}>
              {files.length > 0 && (
                <Box mb={1} display="flex" gap={1} flexWrap="wrap">
                  {files.map((file, i) => <Chip key={i} label={file.name} onDelete={() => removeFile(i)} size="small" icon={file.type.includes('audio') ? <MicIcon/> : <AttachIcon />} />)}
                </Box>
              )}

              <Box display="flex" gap={1} alignItems="flex-end">
                <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                <IconButton color="primary" onClick={() => fileInputRef.current?.click()} sx={{ border: '1px solid #ccc' }}><AttachIcon /></IconButton>
                
                {/* ✅ BOTÃO DE GRAVAR PARA O CLIENTE */}
                <AudioRecorder onAudioReady={handleAudioRecorded} />

                <TextField 
                  fullWidth size="small" placeholder="Responder..." variant="outlined" multiline maxRows={3} 
                  value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)} sx={{ bgcolor: 'white' }} 
                />
                
                <IconButton color="primary" onClick={handleSendReply} disabled={!novoComentario.trim() && files.length === 0} sx={{ bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#1565c0' } }}><SendIcon /></IconButton>
              </Box>
            </Box>
          ) : (
            <Box p={2} bgcolor="#fafafa"><Typography align="center" color="text.secondary">🔒 Chamado encerrado.</Typography></Box>
          )}
          
        </Paper>
      </Container>

      <Dialog open={openWarning} onClose={() => setOpenWarning(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ed6c02' }}><WarningIcon /> Tipo Inválido</DialogTitle>
        <DialogContent><DialogContentText>Apenas JPG, PNG e PDF permitidos.</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setOpenWarning(false)}>OK</Button></DialogActions>
      </Dialog>

    </Box>
  );
}