import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  Box, Typography, Paper, Card, CardContent, Chip, IconButton,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Grid, List, ListItem, ListItemIcon, ListItemText, Divider, Avatar
} from '@mui/material';
import { 
  AttachFile as AttachIcon,
  Business as BusinessIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Person as PersonIcon,
  SupportAgent as SupportAgentIcon,
  BarChart as BarChartIcon 
} from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; 
import { io } from 'socket.io-client';

// --- CONFIGURAÇÃO DAS COLUNAS ---
const COLUMNS = {
  NOVO: { id: 'NOVO', title: '🆕 Novos', bg: '#E3F2FD', border: '#2196F3' },
  EM_ATENDIMENTO: { id: 'EM_ATENDIMENTO', title: '🔥 Em Atendimento', bg: '#FFF3E0', border: '#FF9800' },
  FINALIZADO: { id: 'FINALIZADO', title: '✅ Finalizados', bg: '#E8F5E9', border: '#4CAF50' }
};

const FLOW_ORDER = ['NOVO', 'EM_ATENDIMENTO', 'FINALIZADO'];

// ✅ 1. URL DA API (Fundamental para o Socket funcionar na Vercel)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Email { id: number; endereco: string; }
interface Telefone { id: number; numero: string; }
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
  emails: Email[];
  telefones: Telefone[];
  interacoes: Interacao[];
}

export default function KanbanBoardView() {
  const navigate = useNavigate(); 
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [busca, setBusca] = useState('');
  
  const [chamadoSelecionado, setChamadoSelecionado] = useState<Chamado | null>(null);
  
  // Estado do Chat e Arquivos
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [files, setFiles] = useState<File[]>([]); 
  const fileInputRef = useRef<HTMLInputElement>(null); 

  useEffect(() => {
    carregarChamados();
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const carregarChamados = async () => {
    try {
      const response = await api.get(`${API_URL}/chamados`);
      setChamados(response.data);
    } catch (error) {
      toast.error('Erro ao carregar chamados.');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const novoStatus = destination.droppableId;
    const chamadoId = parseInt(draggableId);
    
    atualizarStatus(chamadoId, novoStatus);
  };

  const atualizarStatus = async (id: number, novoStatus: string) => {
    const chamadosAntigos = [...chamados];
    setChamados((prev) => prev.map((c) => c.id === id ? { ...c, status: novoStatus } : c));
    
    if (chamadoSelecionado && chamadoSelecionado.id === id) {
      setChamadoSelecionado({ ...chamadoSelecionado, status: novoStatus });
    }

    try {
      await api.patch(`${API_URL}/chamados/${id}/status`, { status: novoStatus });
      toast.success('Status atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status.');
      setChamados(chamadosAntigos);
    }
  };

  const handleNextStep = () => {
    if (!chamadoSelecionado) return;
    const currentIndex = FLOW_ORDER.indexOf(chamadoSelecionado.status);
    if (currentIndex < FLOW_ORDER.length - 1) {
      const nextStatus = FLOW_ORDER[currentIndex + 1];
      atualizarStatus(chamadoSelecionado.id, nextStatus);
    }
  };

  // --- LÓGICA DE ARQUIVOS (ADMIN) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddInteracao = async () => {
    if (!chamadoSelecionado || (!novoComentario.trim() && files.length === 0)) return;
    
    setEnviandoComentario(true);
    
    const formData = new FormData();
    formData.append('texto', novoComentario || 'Segue anexo.');
    formData.append('autor', 'SUPORTE');
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      await api.post(`${API_URL}/chamados/${chamadoSelecionado.id}/interacoes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setNovoComentario('');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      toast.success('Mensagem enviada!');
    } catch (error) {
      toast.error('Erro ao enviar mensagem.');
    } finally {
      setEnviandoComentario(false);
    }
  };

  const chamadosFiltrados = chamados.filter((c) => {
    const termo = busca.toLowerCase();
    return (
      c.nomeEmpresa.toLowerCase().includes(termo) ||
      c.id.toString().includes(termo) ||
      c.servico.toLowerCase().includes(termo) ||
      c.descricao.toLowerCase().includes(termo)
    );
  });

  // ✅ 2. LÓGICA COMPLETA DE SOCKET
  useEffect(() => {
    // Conecta na URL correta (Produção ou Local)
    const socket = io(API_URL);
    const audio = new Audio('/notification.mp3');

    // --- A. NOVA INTERAÇÃO (Chat) ---
    socket.on('nova_interacao', (data) => {
      // 1. Notifica se foi o Cliente que mandou
      if (data.autor === 'CLIENTE') {
        audio.play().catch(() => {});
        toast.info(`💬 Nova resposta no chamado #${data.chamadoId}`, {
          position: "top-right",
          theme: "colored"
        });
      }

      // 2. Atualiza a lista geral (Kanban) para ter os dados frescos
      setChamados((prevLista) => prevLista.map(c => {
        if (c.id === data.chamadoId) {
           const jaExiste = c.interacoes?.some(i => i.id === data.id);
           if (jaExiste) return c;
           // Adiciona a nova interação na lista do card
           return { ...c, interacoes: [...(c.interacoes || []), data] };
        }
        return c;
      }));

      // 3. Se o Modal estiver aberto neste chamado, atualiza o chat na hora
      if (chamadoSelecionado && chamadoSelecionado.id === data.chamadoId) {
        setChamadoSelecionado((prev) => {
           if (!prev) return null;
           const jaExiste = prev.interacoes?.some(i => i.id === data.id);
           if (jaExiste) return prev;
           return { ...prev, interacoes: [...(prev.interacoes || []), data] };
        });
      }
    });

    // --- B. NOVO CHAMADO (Toast + Lista) ---
    socket.on('novo_chamado', (novoChamado) => {
      audio.play().catch(() => {});
      toast.info(`🆕 Novo chamado de ${novoChamado.nomeEmpresa}!`, {
        position: "top-center", theme: "colored"
      });
      setChamados((prev) => [novoChamado, ...prev]);
    });

    // --- C. MUDANÇA DE STATUS (Outros Admins) ---
    socket.on('mudanca_status', (data) => {
      setChamados((prev) => prev.map(chamado => {
        if (chamado.id === data.id) {
          return { ...chamado, status: data.status };
        }
        return chamado;
      }));
      
      if (chamadoSelecionado && chamadoSelecionado.id === data.id) {
         setChamadoSelecionado(prev => prev ? { ...prev, status: data.status } : null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [chamadoSelecionado]); // Importante depender do chamadoSelecionado para atualizar o modal correto

  return (
    <Box sx={{ p: 3, height: '90vh', backgroundColor: '#F4F5F7', display: 'flex', flexDirection: 'column', marginTop: 5}}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#444' }}>
          Fila de Chamados
        </Typography>

        <Box display="flex" gap={2}>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<BarChartIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Ver Relatórios
          </Button>

          <TextField
            variant="outlined"
            placeholder="Pesquisar..."
            size="small"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            sx={{ width: 300, bgcolor: 'white', borderRadius: 1 }}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
            }}
          />
        </Box>
      </Box>

      {/* KANBAN */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 10, overflowX: 'auto', flexGrow: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
          {Object.entries(COLUMNS).map(([columnId, column]) => {
            const cardsDaColuna = chamadosFiltrados.filter((c) => c.status === columnId);

            return (
              <Droppable key={columnId} droppableId={columnId}>
                {(provided, snapshot) => (
                  <Paper
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    elevation={0}
                    sx={{
                      width: 350, minWidth: 350,
                      backgroundColor: snapshot.isDraggingOver ? '#e0e0e0' : '#ebecf0',
                      p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column',
                      maxHeight: '100%'
                    }}
                  >
                    <Box sx={{ mb: 2, pb: 1, borderBottom: `3px solid ${column.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#555' }}>{column.title}</Typography>
                      <Chip label={cardsDaColuna.length} size="small" />
                    </Box>

                    <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                      {cardsDaColuna.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setChamadoSelecionado(item)}
                              sx={{
                                mb: 2, borderRadius: 2, cursor: 'pointer',
                                boxShadow: snapshot.isDragging ? 6 : 1,
                                transition: 'transform 0.2s',
                                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
                              }}
                            >
                              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="caption" color="text.secondary">#{item.id}</Typography>
                                  <Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</Typography>
                                </Box>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{item.nomeEmpresa}</Typography>
                                <Chip label={item.servico} size="small" sx={{ mb: 1, bgcolor: column.bg, color: '#444', fontWeight: '500' }} />
                                <Typography variant="body2" color="text.secondary" noWrap>{item.descricao}</Typography>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  </Paper>
                )}
              </Droppable>
            );
          })}
        </Box>
      </DragDropContext>

      {/* --- MODAL DETALHES --- */}
      <Dialog 
        open={Boolean(chamadoSelecionado)} 
        onClose={() => setChamadoSelecionado(null)}
        maxWidth="md"
        fullWidth
      >
        {chamadoSelecionado && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f5f5f5' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6">Chamado #{chamadoSelecionado.id}</Typography>
                <Chip 
                  label={COLUMNS[chamadoSelecionado.status as keyof typeof COLUMNS]?.title || chamadoSelecionado.status} 
                  sx={{ bgcolor: COLUMNS[chamadoSelecionado.status as keyof typeof COLUMNS]?.bg || '#eee' }}
                />
              </Box>
              <IconButton onClick={() => setChamadoSelecionado(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={2} sx={{ height: '100%' }}>
                
                {/* ÁREA DE CHAT (ESQUERDA) */}
                <Grid item xs={12} md={8} display="flex" flexDirection="column">
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Histórico do Chamado</Typography>
                  
                  {/* Lista de Mensagens */}
                  <Box sx={{ flexGrow: 1, bgcolor: '#f9f9f9', borderRadius: 2, p: 2, mb: 2, border: '1px solid #eee', maxHeight: '400px', overflowY: 'auto' }}>
                    
                    {/* Descrição Inicial */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: '#9e9e9e' }}><PersonIcon fontSize="small" /></Avatar>
                          <Typography variant="caption" fontWeight="bold">Cliente (Abertura)</Typography>
                          <Typography variant="caption" color="text.secondary">{new Date(chamadoSelecionado.createdAt).toLocaleString()}</Typography>
                        </Box>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #ddd', borderRadius: '0 12px 12px 12px', maxWidth: '90%' }}>
                          <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>{chamadoSelecionado.descricao}</Typography>
                        </Paper>
                    </Box>

                    {/* Mensagens */}
                    {chamadoSelecionado.interacoes?.map((interacao, idx) => {
                      const isSuporte = interacao.autor === 'SUPORTE';
                      return (
                        <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: isSuporte ? 'flex-end' : 'flex-start', mb: 2 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5} flexDirection={isSuporte ? 'row-reverse' : 'row'}>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: isSuporte ? '#1976d2' : '#9e9e9e' }}>{isSuporte ? <SupportAgentIcon fontSize="small" /> : <PersonIcon fontSize="small" />}</Avatar>
                              <Typography variant="caption" fontWeight="bold">{isSuporte ? 'Suporte' : 'Cliente'}</Typography>
                              <Typography variant="caption" color="text.secondary">{new Date(interacao.createdAt).toLocaleString()}</Typography>
                            </Box>
                            
                            <Paper elevation={0} sx={{ p: 2, bgcolor: isSuporte ? '#E3F2FD' : '#ffffff', border: isSuporte ? 'none' : '1px solid #ddd', borderRadius: isSuporte ? '12px 0 12px 12px' : '0 12px 12px 12px', maxWidth: '90%', color: isSuporte ? '#0d47a1' : 'inherit' }}>
                              <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>{interacao.texto}</Typography>
                              
                              {/* RENDERIZAÇÃO DE ANEXOS */}
                              {interacao.anexos && interacao.anexos.length > 0 && (
                                <Box mt={1} pt={1} borderTop="1px solid rgba(0,0,0,0.1)">
                                  {interacao.anexos.map(anexo => (
                                    <Chip
                                      key={anexo.id}
                                      icon={<AttachIcon />}
                                      label={anexo.nomeOriginal.length > 20 ? anexo.nomeOriginal.substring(0, 17) + '...' : anexo.nomeOriginal}
                                      component="a"
                                      href={
                                        anexo.caminho && anexo.caminho.startsWith('http') 
                                          ? anexo.caminho 
                                          : `${API_URL}/uploads/${anexo.nomeArquivo}`
                                      }
                                      target="_blank"
                                      clickable
                                      size="small"
                                      sx={{ m: 0.5, bgcolor: 'rgba(0,0,0,0.05)' }}
                                    />
                                  ))}
                                </Box>
                              )}
                            </Paper>
                        </Box>
                      )
                    })}
                  </Box>

                  {/* INPUT AREA */}
                  <Box>
                    {/* Preview dos arquivos selecionados */}
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
                      <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                      
                      <IconButton 
                        onClick={() => fileInputRef.current?.click()}
                        sx={{ border: '1px solid #ccc', borderRadius: 1 }}
                      >
                        <AttachIcon />
                      </IconButton>

                      <TextField 
                        fullWidth 
                        size="small" 
                        placeholder="Adicionar resposta..." 
                        value={novoComentario} 
                        onChange={(e) => setNovoComentario(e.target.value)} 
                        multiline 
                        maxRows={3} 
                      />
                      
                      <Button 
                        variant="contained" 
                        onClick={handleAddInteracao} 
                        disabled={enviandoComentario || (!novoComentario.trim() && files.length === 0)}
                      >
                        <SendIcon />
                      </Button>
                    </Box>
                  </Box>
                </Grid>

                {/* INFO AREA (DIREITA) */}
                <Grid item xs={12} md={4}>
                   <Box mb={2}>
                     <Typography variant="subtitle2" color="text.secondary">Empresa</Typography>
                     <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}><BusinessIcon color="primary" fontSize="small"/> {chamadoSelecionado.nomeEmpresa}</Typography>
                   </Box>
                   
                   {/* Anexos da Abertura do Chamado (Separados) */}
                   {chamadoSelecionado.anexos?.length > 0 && (
                     <Box mb={2}>
                       <Typography variant="subtitle2" color="text.secondary" gutterBottom>Anexos Iniciais</Typography>
                       <Box display="flex" gap={1} flexWrap="wrap">
                         {chamadoSelecionado.anexos?.map((anexo, idx) => (
                            <Chip 
                                key={idx} 
                                icon={<AttachIcon />} 
                                label={anexo.nomeOriginal.substring(0,12)+'...'} 
                                clickable 
                                component="a" 
                                href={
                                    anexo.caminho && anexo.caminho.startsWith('http') 
                                        ? anexo.caminho 
                                        : `${API_URL}/uploads/${anexo.nomeArquivo}`
                                }
                                target="_blank" 
                                rel="noopener noreferrer" 
                                variant="outlined" 
                                color="primary" 
                                size="small" 
                            />
                         ))}
                       </Box>
                     </Box>
                   )}
                   <Divider sx={{ my: 2 }} />
                   <Typography variant="subtitle2" color="text.secondary" gutterBottom>Contatos</Typography>
                   <List dense disablePadding>
                     {chamadoSelecionado.emails?.map((email, idx) => (
                       <ListItem key={idx} disableGutters><ListItemIcon sx={{ minWidth: 30 }}><EmailIcon fontSize="small" /></ListItemIcon><ListItemText primary={email.endereco} /></ListItem>
                     ))}
                     {chamadoSelecionado.telefones?.map((tel, idx) => (
                       <ListItem key={idx} disableGutters>
                         <ListItemIcon sx={{ minWidth: 30 }}><PhoneIcon fontSize="small" /></ListItemIcon>
                         <ListItemText primary={tel.numero} secondary={<a href={`https://wa.me/55${tel.numero.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#25D366', fontSize: '0.8rem', fontWeight: 'bold' }}>Abrir WhatsApp</a>} />
                       </ListItem>
                     ))}
                   </List>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 2, justifyContent: 'space-between', bgcolor: '#f5f5f5' }}>
               <Box /> 
               {chamadoSelecionado.status !== 'FINALIZADO' && (
                <Button variant="contained" color="secondary" endIcon={<ArrowForwardIcon />} onClick={handleNextStep}>
                  Mover para {COLUMNS[FLOW_ORDER[FLOW_ORDER.indexOf(chamadoSelecionado.status) + 1] as keyof typeof COLUMNS]?.title}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}