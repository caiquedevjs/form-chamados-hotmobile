import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  Box, Typography, Paper, Card, CardContent, Chip, IconButton, Tooltip,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Grid, Divider, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { 
  AttachFile as AttachIcon,
  WhatsApp as WhatsAppIcon,
  Business as BusinessIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

// --- CONFIGURAÇÃO DAS COLUNAS ---
const COLUMNS = {
  NOVO: { id: 'NOVO', title: '🆕 Novos', bg: '#E3F2FD', border: '#2196F3' },
  EM_ATENDIMENTO: { id: 'EM_ATENDIMENTO', title: '🔥 Em Atendimento', bg: '#FFF3E0', border: '#FF9800' },
  FINALIZADO: { id: 'FINALIZADO', title: '✅ Finalizados', bg: '#E8F5E9', border: '#4CAF50' }
};

// Ordem do fluxo para o botão "Próxima Etapa"
const FLOW_ORDER = ['NOVO', 'EM_ATENDIMENTO', 'FINALIZADO'];

// --- INTERFACES ---
interface Email { id: number; endereco: string; }
interface Telefone { id: number; numero: string; }
interface Anexo { id: number; nomeOriginal: string; nomeArquivo: string; }

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
}

export default function KanbanBoardView() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [busca, setBusca] = useState(''); // Estado da pesquisa
  const [chamadoSelecionado, setChamadoSelecionado] = useState<Chamado | null>(null); // Estado do Modal

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

  // Função centralizada para atualizar status (usada no Drag e no Botão do Modal)
  const atualizarStatus = async (id: number, novoStatus: string) => {
    const chamadosAntigos = [...chamados];

    // Atualiza visualmente
    setChamados((prev) => prev.map((c) => c.id === id ? { ...c, status: novoStatus } : c));
    
    // Se o modal estiver aberto com esse chamado, atualiza o modal também
    if (chamadoSelecionado && chamadoSelecionado.id === id) {
      setChamadoSelecionado({ ...chamadoSelecionado, status: novoStatus });
    }

    try {
      await axios.patch(`http://localhost:3000/chamados/${id}/status`, { status: novoStatus });
      toast.success('Status atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status.');
      setChamados(chamadosAntigos); // Rollback
    }
  };

  // --- LÓGICA DO MODAL ---
  const handleNextStep = () => {
    if (!chamadoSelecionado) return;
    
    const currentIndex = FLOW_ORDER.indexOf(chamadoSelecionado.status);
    if (currentIndex < FLOW_ORDER.length - 1) {
      const nextStatus = FLOW_ORDER[currentIndex + 1];
      atualizarStatus(chamadoSelecionado.id, nextStatus);
    }
  };

  // --- FILTRAGEM (PESQUISA) ---
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
      
      {/* CABEÇALHO COM PESQUISA */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#444' }}>
          Fila de Chamados
        </Typography>
        <TextField
          variant="outlined"
          placeholder="Pesquisar (Empresa, ID, Serviço)..."
          size="small"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          sx={{ width: 300, bgcolor: 'white', borderRadius: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* ÁREA DO KANBAN */}
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
                              onClick={() => setChamadoSelecionado(item)} // ABRE O MODAL AO CLICAR
                              sx={{
                                mb: 2, borderRadius: 2, cursor: 'pointer', position: 'relative',
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

      {/* --- MODAL DE DETALHES --- */}
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
                  sx={{ bgcolor: COLUMNS[chamadoSelecionado.status as keyof typeof COLUMNS]?.bg }}
                />
              </Box>
              <IconButton onClick={() => setChamadoSelecionado(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={2}>
                {/* Lado Esquerdo: Info Principal */}
                <Grid item xs={12} md={8}>
                  <Box mb={3}>
                    <Typography variant="subtitle2" color="text.secondary">Empresa</Typography>
                    <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                      <BusinessIcon color="primary" /> {chamadoSelecionado.nomeEmpresa}
                    </Typography>
                  </Box>

                  <Box mb={3}>
                    <Typography variant="subtitle2" color="text.secondary">Descrição do Problema</Typography>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f9f9f9', mt: 1, border: '1px solid #eee' }}>
                      <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                        {chamadoSelecionado.descricao}
                      </Typography>
                    </Paper>
                  </Box>

                  {chamadoSelecionado.anexos && chamadoSelecionado.anexos.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Anexos</Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {chamadoSelecionado.anexos.map((anexo, idx) => (
                           <Chip
                             key={idx}
                             icon={<AttachIcon />}
                             label={anexo.nomeOriginal}
                             clickable
                             component="a"
                             // Ajuste a URL baseada na sua configuração de ServeStatic
                             href={`http://localhost:3000/uploads/${anexo.nomeArquivo}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             variant="outlined"
                             color="primary"
                           />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>

                {/* Lado Direito: Contatos */}
                <Grid item xs={12} md={4}>
                   <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Contatos</Typography>
                      
                      <List dense>
                        {chamadoSelecionado.emails.map((email, idx) => (
                          <ListItem key={idx} disableGutters>
                            <ListItemIcon sx={{ minWidth: 30 }}><EmailIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary={email.endereco} />
                          </ListItem>
                        ))}
                        {chamadoSelecionado.telefones.map((tel, idx) => (
                          <ListItem key={idx} disableGutters>
                            <ListItemIcon sx={{ minWidth: 30 }}><PhoneIcon fontSize="small" /></ListItemIcon>
                            <ListItemText 
                              primary={tel.numero} 
                              secondary={
                                <a 
                                  href={`https://wa.me/55${tel.numero.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  style={{ textDecoration: 'none', color: '#25D366', fontSize: '0.8rem', fontWeight: 'bold' }}
                                >
                                  Abrir WhatsApp
                                </a>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                   </Paper>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Criado em: {new Date(chamadoSelecionado.createdAt).toLocaleString()}
              </Typography>
              
              {/* Botão de Avançar Etapa */}
              {chamadoSelecionado.status !== 'FINALIZADO' && (
                <Button 
                  variant="contained" 
                  color="primary" 
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