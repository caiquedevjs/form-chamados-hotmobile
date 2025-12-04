import React, { useState, useEffect } from 'react';
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
  SupportAgent as SupportAgentIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

// --- CONFIGURAÇÃO DAS COLUNAS ---
const COLUMNS = {
  NOVO: { id: 'NOVO', title: '🆕 Novos', bg: '#E3F2FD', border: '#2196F3' },
  EM_ATENDIMENTO: { id: 'EM_ATENDIMENTO', title: '🔥 Em Atendimento', bg: '#FFF3E0', border: '#FF9800' },
  FINALIZADO: { id: 'FINALIZADO', title: '✅ Finalizados', bg: '#E8F5E9', border: '#4CAF50' }
};

const FLOW_ORDER = ['NOVO', 'EM_ATENDIMENTO', 'FINALIZADO'];

// --- INTERFACES ---
interface Email { id: number; endereco: string; }
interface Telefone { id: number; numero: string; }
interface Anexo { id: number; nomeOriginal: string; nomeArquivo: string; }
// Nova Interface para o Histórico
interface Interacao { 
  id: number; 
  texto: string; 
  autor: 'CLIENTE' | 'SUPORTE'; 
  createdAt: string; 
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
  interacoes: Interacao[]; // Adicionado array de interações
}

export default function KanbanBoardView() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [busca, setBusca] = useState('');
  const [chamadoSelecionado, setChamadoSelecionado] = useState<Chamado | null>(null);
  
  // Estado para o texto do novo comentário
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  useEffect(() => {
    carregarChamados();
  }, []);

  const carregarChamados = async () => {
    try {
      const response = await axios.get('http://localhost:3000/chamados');
      setChamados(response.data);
    } catch (error) {
      toast.error('Erro ao carregar chamados.');
    }
  };

  // --- LÓGICA DO KANBAN ---
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
      await axios.patch(`http://localhost:3000/chamados/${id}/status`, { status: novoStatus });
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

  // --- NOVA LÓGICA: ENVIAR COMENTÁRIO ---
  const handleAddInteracao = async () => {
    if (!chamadoSelecionado || !novoComentario.trim()) return;

    setEnviandoComentario(true);
    try {
      // 1. Envia para o backend
      const response = await axios.post(`http://localhost:3000/chamados/${chamadoSelecionado.id}/interacoes`, {
        texto: novoComentario,
        autor: 'SUPORTE' // Como estamos no painel admin, sempre é SUPORTE
      });

      const novaInteracao = response.data;

      // 2. Atualiza o estado local (Lista Geral)
      setChamados((prev) => prev.map(c => {
        if (c.id === chamadoSelecionado.id) {
          // Garante que interacoes exista
          const interacoesAtuais = c.interacoes || [];
          return { ...c, interacoes: [...interacoesAtuais, novaInteracao] };
        }
        return c;
      }));

      // 3. Atualiza o estado do Modal Aberto
      setChamadoSelecionado((prev) => {
        if (!prev) return null;
        const interacoesAtuais = prev.interacoes || [];
        return { ...prev, interacoes: [...interacoesAtuais, novaInteracao] };
      });

      setNovoComentario('');
      toast.success('Comentário adicionado!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar comentário.');
    } finally {
      setEnviandoComentario(false);
    }
  };

  // Filtro de pesquisa
  const chamadosFiltrados = chamados.filter((c) => {
    const termo = busca.toLowerCase();
    return (
      c.nomeEmpresa.toLowerCase().includes(termo) ||
      c.id.toString().includes(termo) ||
      c.servico.toLowerCase().includes(termo) ||
      c.descricao.toLowerCase().includes(termo)
    );
  });

  return (
    <Box sx={{ p: 3, height: '90vh', backgroundColor: '#F4F5F7', display: 'flex', flexDirection: 'column' }}>
      
      {/* CABEÇALHO */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#444' }}>
          Fila de Chamados
        </Typography>
        <TextField
          variant="outlined"
          placeholder="Pesquisar..."
          size="small"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          sx={{ width: 300, bgcolor: 'white', borderRadius: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
            ),
          }}
        />
      </Box>

      {/* KANBAN */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', flexGrow: 1, alignItems: 'flex-start' }}>
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
                
                {/* Lado Esquerdo: Histórico e Conversa */}
                <Grid item xs={12} md={8} display="flex" flexDirection="column">
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Histórico do Chamado
                  </Typography>

                  {/* Área de Scroll das Mensagens */}
                  <Box sx={{ 
                    flexGrow: 1, 
                    bgcolor: '#f9f9f9', 
                    borderRadius: 2, 
                    p: 2, 
                    mb: 2,
                    border: '1px solid #eee',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    
                    {/* 1. Descrição Original (Sempre aparece primeiro) */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: '#9e9e9e' }}><PersonIcon fontSize="small" /></Avatar>
                          <Typography variant="caption" fontWeight="bold">Cliente (Abertura)</Typography>
                          <Typography variant="caption" color="text.secondary">
                             {new Date(chamadoSelecionado.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #ddd', borderRadius: '0 12px 12px 12px', maxWidth: '90%' }}>
                          <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>{chamadoSelecionado.descricao}</Typography>
                        </Paper>
                    </Box>

                    {/* 2. Lista de Interações (Comentários) */}
                    {chamadoSelecionado.interacoes?.map((interacao, idx) => {
                      const isSuporte = interacao.autor === 'SUPORTE';
                      return (
                        <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: isSuporte ? 'flex-end' : 'flex-start', mb: 2 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5} flexDirection={isSuporte ? 'row-reverse' : 'row'}>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: isSuporte ? '#1976d2' : '#9e9e9e' }}>
                                {isSuporte ? <SupportAgentIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                              </Avatar>
                              <Typography variant="caption" fontWeight="bold">{isSuporte ? 'Suporte' : 'Cliente'}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(interacao.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                            <Paper 
                              elevation={0} 
                              sx={{ 
                                p: 2, 
                                bgcolor: isSuporte ? '#E3F2FD' : '#ffffff', 
                                border: isSuporte ? 'none' : '1px solid #ddd',
                                borderRadius: isSuporte ? '12px 0 12px 12px' : '0 12px 12px 12px', 
                                maxWidth: '90%',
                                color: isSuporte ? '#0d47a1' : 'inherit'
                              }}
                            >
                              <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>{interacao.texto}</Typography>
                            </Paper>
                        </Box>
                      )
                    })}
                  </Box>

                  {/* Input de Novo Comentário */}
                  <Box display="flex" gap={1}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Adicionar observação ou resposta..."
                      value={novoComentario}
                      onChange={(e) => setNovoComentario(e.target.value)}
                      multiline
                      maxRows={3}
                    />
                    <Button 
                      variant="contained" 
                      onClick={handleAddInteracao}
                      disabled={enviandoComentario || !novoComentario.trim()}
                    >
                      <SendIcon />
                    </Button>
                  </Box>
                </Grid>

                {/* Lado Direito: Detalhes e Contatos */}
                <Grid item xs={12} md={4}>
                   <Box mb={2}>
                     <Typography variant="subtitle2" color="text.secondary">Empresa</Typography>
                     <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                       <BusinessIcon color="primary" fontSize="small"/> {chamadoSelecionado.nomeEmpresa}
                     </Typography>
                   </Box>

                   {/* Anexos */}
                   {chamadoSelecionado.anexos?.length > 0 && (
                     <Box mb={2}>
                       <Typography variant="subtitle2" color="text.secondary" gutterBottom>Anexos</Typography>
                       <Box display="flex" gap={1} flexWrap="wrap">
                         {chamadoSelecionado.anexos?.map((anexo, idx) => (
                            <Chip
                              key={idx}
                              icon={<AttachIcon />}
                              label={anexo.nomeOriginal.length > 15 ? anexo.nomeOriginal.substring(0,12)+'...' : anexo.nomeOriginal}
                              clickable
                              component="a"
                              href={`http://localhost:3000/uploads/${anexo.nomeArquivo}`}
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
                       <ListItem key={idx} disableGutters>
                         <ListItemIcon sx={{ minWidth: 30 }}><EmailIcon fontSize="small" /></ListItemIcon>
                         <ListItemText primary={email.endereco} />
                       </ListItem>
                     ))}
                     {chamadoSelecionado.telefones?.map((tel, idx) => (
                       <ListItem key={idx} disableGutters>
                         <ListItemIcon sx={{ minWidth: 30 }}><PhoneIcon fontSize="small" /></ListItemIcon>
                         <ListItemText 
                           primary={tel.numero} 
                           secondary={
                             <a href={`https://wa.me/55${tel.numero.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#25D366', fontSize: '0.8rem', fontWeight: 'bold' }}>
                               Abrir WhatsApp
                             </a>
                           }
                         />
                       </ListItem>
                     ))}
                   </List>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: 'space-between', bgcolor: '#f5f5f5' }}>
               <Box /> {/* Espaço vazio para alinhar botão à direita */}
               
               {chamadoSelecionado.status !== 'FINALIZADO' && (
                <Button 
                  variant="contained" 
                  color="secondary" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNextStep}
                >
                  Mover para {
                    COLUMNS[FLOW_ORDER[FLOW_ORDER.indexOf(chamadoSelecionado.status) + 1] as keyof typeof COLUMNS]?.title
                  }
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}