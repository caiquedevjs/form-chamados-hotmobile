import React, { useState, useEffect, useRef, useContext } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  Box, Typography, Paper, Card, CardContent, Chip, IconButton,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Grid, List, ListItem, ListItemIcon, ListItemText, Divider, Avatar,
  Badge, FormControlLabel, Switch, Select, MenuItem, Checkbox, ListItemText as MuiListItemText,
  InputLabel, FormControl, Stack, Popover, ListSubheader
} from '@mui/material';
import { ListAlt } from '@mui/icons-material';
import LockIcon from '@mui/icons-material/Lock'; 
import BoltIcon from '@mui/icons-material/Bolt';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

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
  BarChart as BarChartIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Link as LinkIcon,
  MenuBook as BookIcon,
  Dns as DnsIcon,
  Help as HelpIcon,
  Public as PublicIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import LowPriorityIcon from '@mui/icons-material/LowPriority';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; 
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

// --- CONFIGURAÇÃO DAS COLUNAS ---
const COLUMNS = {
  NOVO: { id: 'NOVO', title: '🆕 Novos', bg: '#E3F2FD', border: '#2196F3' },
  EM_ATENDIMENTO: { id: 'EM_ATENDIMENTO', title: '🔥 Em Atendimento', bg: '#FFF3E0', border: '#FF9800' },
  FINALIZADO: { id: 'FINALIZADO', title: '✅ Finalizados', bg: '#E8F5E9', border: '#4CAF50' }
};

// ✅ CONFIGURAÇÃO DE SLA / PRIORIDADE
const PRIORITY_CONFIG = {
  BAIXA:   { label: 'Baixa',   color: '#4CAF50', icon: <LowPriorityIcon fontSize="small"/> }, // Verde
  MEDIA:   { label: 'Média',   color: '#2196F3', icon: <LowPriorityIcon fontSize="small"/> }, // Azul
  ALTA:    { label: 'Alta',    color: '#FF9800', icon: <PriorityHighIcon fontSize="small"/> }, // Laranja
  CRITICA: { label: 'Crítica', color: '#F44336', icon: <PriorityHighIcon fontSize="small"/> }  // Vermelho
};

const FLOW_ORDER = ['NOVO', 'EM_ATENDIMENTO', 'FINALIZADO'];

const API_URL = 'https://form-chamados-hotmobile-production.up.railway.app';

// LINKS ÚTEIS
const SUPORTE_LINKS = [
  { title: 'Central de Ajuda Hotmobile', url: 'https://ajuda.hotmobile.com.br/', icon: <HelpIcon />, color: '#1976d2' },
  { title: 'Central de Ajuda Atendchat', url: 'https://ajudachat.hotmobile.com.br/', icon: <HelpIcon />, color: '#1976d2' },
  { title: 'Central de Ajuda Hotmenu', url: 'https://ajuda.hotmenu.com.br/', icon: <HelpIcon />, color: '#1976d2' },
  { title: 'Formulario de Chamados suporte', url: 'https://form-chamados-hotmobile.vercel.app/', icon: <ListAlt />, color:  '#9c27b0'}, 
  { title: 'Formulario de montagem  de bot', url: 'https://hotmobile.com.br/hot360/monte-seu-bot/', icon: <ListAlt />, color:  '#9c27b0'}, 
  { title: 'Formulario de montagem  de IA', url: 'https://hotmobile.com.br/hot360/monte-sua-ia/', icon: <ListAlt />, color:  '#9c27b0'}, 
  { title: 'Documentação Hot Api', url: 'https://api.hotmobile.com.br/index.html', icon: <BookIcon />, color: '#e65100' },
  { title: 'Atualizações Atendchat', url: 'https://changelog.atendchat.app.br/', icon: <BookIcon />, color: '#e65100' },
  { title: 'Painel Hot', url: 'https://painel.hotmobile.com.br/a/', icon: <DnsIcon />, color: '#2e7d32' },
  { title: 'Site Institucional', url: 'https://hotmobile.com.br', icon: <PublicIcon />, color: '#555' }
];

export default function KanbanBoardView() {
  const navigate = useNavigate(); 
  const [chamados, setChamados] = useState([]);
  const { logout, user } = useAuth();
  
  // --- ESTADOS DE FILTRO ---
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState(Object.keys(COLUMNS)); 
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [apenasNaoLidos, setApenasNaoLidos] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false); 
  const [modalLinksOpen, setModalLinksOpen] = useState(false);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  
  // Estado do Chat e Arquivos
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [files, setFiles] = useState([]); 
  
  // Estado Nota Interna
  const [notaInterna, setNotaInterna] = useState(false);



  // Estados Macros
  const [respostasProntas, setRespostasProntas] = useState([]);
  const [anchorElMacros, setAnchorElMacros] = useState(null); 
  const [modalMacrosOpen, setModalMacrosOpen] = useState(false); 
  const [novaMacro, setNovaMacro] = useState({ titulo: '', texto: '' });

  const fileInputRef = useRef(null); 

  const handleLogout = () => {
    logout(); 
    toast.info('Você saiu do sistema.');
    navigate('/login');
  };

  useEffect(() => {
    carregarChamados();
    carregarMacros(); 
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

  const handleDeleteChamado = async () => {
    if (!chamadoSelecionado) return;

    try {
      await api.delete(`${API_URL}/chamados/${chamadoSelecionado.id}`);
      
      // Remove do estado local (Kanban) sem precisar recarregar tudo
      setChamados((prev) => prev.filter(c => c.id !== chamadoSelecionado.id));
      
      toast.success('Chamado excluído com sucesso.');
      setConfirmDeleteOpen(false); // Fecha confirmação
      setChamadoSelecionado(null); // Fecha modal do chamado
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir chamado.');
    }
  };

  // --- LÓGICA DE MACROS ---
  const carregarMacros = async () => {
    try {
      const { data } = await api.get(`${API_URL}/respostas-prontas`);
      setRespostasProntas(data);
    } catch (error) {
      console.error("Erro ao carregar macros");
    }
  };

  const handleCriarMacro = async () => {
    if (!novaMacro.titulo || !novaMacro.texto) return toast.warning("Preencha título e texto!");
    try {
      await api.post(`${API_URL}/respostas-prontas`, novaMacro);
      toast.success("Resposta salva!");
      setNovaMacro({ titulo: '', texto: '' });
      carregarMacros(); 
    } catch (error) {
      toast.error("Erro ao salvar macro.");
    }
  };

  const handleDeleteMacro = async (id) => {
    try {
      await api.delete(`${API_URL}/respostas-prontas/${id}`);
      carregarMacros();
      toast.success("Resposta removida.");
    } catch (error) {
      toast.error("Erro ao excluir.");
    }
  };

  const handleUsarMacro = (texto) => {
    setNovoComentario(texto); 
    setAnchorElMacros(null); 
  };

  // --- LÓGICA DE SLA / PRIORIDADE ---
  const handleChangePriority = async (novaPrioridade) => {
    try {
        setChamadoSelecionado(prev => ({ ...prev, prioridade: novaPrioridade }));
        setChamados(prev => prev.map(c => c.id === chamadoSelecionado.id ? { ...c, prioridade: novaPrioridade } : c));

        await api.patch(`${API_URL}/chamados/${chamadoSelecionado.id}/status`, {
            prioridade: novaPrioridade
        });
        toast.success(`Prioridade alterada para ${PRIORITY_CONFIG[novaPrioridade].label}`);
    } catch (error) {
        toast.error("Erro ao mudar prioridade");
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const novoStatus = destination.droppableId;
    const chamadoId = parseInt(draggableId);
    
    atualizarStatus(chamadoId, novoStatus);
  };

  const atualizarStatus = async (id, novoStatus) => {
    const chamadosAntigos = [...chamados];
    const dadosAtualizacao = { status: novoStatus };
    
    if (novoStatus === 'EM_ATENDIMENTO') {
        const nomeResponsavel = user?.nome || user?.name || user?.email;
        const corResponsavel = user?.cor || '#1976d2'; 

        if (nomeResponsavel) {
            dadosAtualizacao.responsavel = nomeResponsavel;
            dadosAtualizacao.responsavelCor = corResponsavel;
        }
    }

    setChamados((prev) => prev.map((c) => {
        if (c.id === id) {
            return { 
                ...c, 
                status: novoStatus,
                responsavel: dadosAtualizacao.responsavel || c.responsavel,
                responsavelCor: dadosAtualizacao.responsavelCor || c.responsavelCor 
            };
        }
        return c;
    }));
    
    if (chamadoSelecionado && chamadoSelecionado.id === id) {
      setChamadoSelecionado((prev) => prev ? { 
          ...prev, 
          status: novoStatus,
          responsavel: dadosAtualizacao.responsavel || prev.responsavel,
          responsavelCor: dadosAtualizacao.responsavelCor || prev.responsavelCor 
      } : null);
    }

    try {
      await api.patch(`${API_URL}/chamados/${id}/status`, dadosAtualizacao);
      toast.success('Status atualizado!');
    } catch (error) {
      console.error("❌ Erro ao salvar:", error);
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

  const handleAbrirChamado = async (item) => {
    setChamadoSelecionado(item);
    setChamados(prev => prev.map(c => c.id === item.id ? { ...c, mensagensNaoLidas: 0 } : c));
    try {
        await api.get(`${API_URL}/chamados/${item.id}`); 
    } catch (error) { 
        console.error("Erro ao marcar lido", error); 
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddInteracao = async () => {
    if (!chamadoSelecionado || (!novoComentario.trim() && files.length === 0)) return;
    
    setEnviandoComentario(true);
    
    const formData = new FormData();
    formData.append('texto', novoComentario || 'Segue anexo.');
    formData.append('autor', 'SUPORTE');

    if (notaInterna) {
        formData.append('interno', 'true');
    }
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      await api.post(`${API_URL}/chamados/${chamadoSelecionado.id}/interacoes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setNovoComentario('');
      setFiles([]);
      setNotaInterna(false); 
      if (fileInputRef.current) fileInputRef.current.value = '';

      toast.success(notaInterna ? 'Nota interna adicionada!' : 'Mensagem enviada!');
    } catch (error) {
      toast.error('Erro ao enviar mensagem.');
    } finally {
      setEnviandoComentario(false);
    }
  };

  const chamadosFiltrados = chamados.filter((c) => {
    const termo = busca.toLowerCase();
    const matchTexto = 
      c.nomeEmpresa.toLowerCase().includes(termo) ||
      c.id.toString().includes(termo) ||
      c.servico.toLowerCase().includes(termo) ||
      c.descricao.toLowerCase().includes(termo);

    const matchStatus = filtroStatus.includes(c.status);
    const matchNaoLidos = apenasNaoLidos ? c.mensagensNaoLidas > 0 : true;
    let matchData = true;
    const dataChamado = new Date(c.createdAt);
    
    if (filtroDataInicio) {
        const dataInicio = new Date(filtroDataInicio);
        dataInicio.setHours(0,0,0,0);
        matchData = matchData && dataChamado >= dataInicio;
    }
    
    if (filtroDataFim) {
        const dataFim = new Date(filtroDataFim);
        dataFim.setHours(23,59,59,999); 
        matchData = matchData && dataChamado <= dataFim;
    }

    return matchTexto && matchStatus && matchNaoLidos && matchData;
  });

  const limparFiltros = () => {
      setBusca('');
      setFiltroStatus(Object.keys(COLUMNS));
      setFiltroDataInicio('');
      setFiltroDataFim('');
      setApenasNaoLidos(false);
  };

  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket', 'polling'], reconnection: true });
    const audio = new Audio('/notification.mp3');

    socket.on('nova_interacao', (data) => {
      if (data.autor === 'CLIENTE') {
        audio.play().catch(() => {});
        toast.info(`💬 Nova resposta no chamado #${data.chamadoId}`, {
          position: "top-right", theme: "colored"
        });
      }

      setChamados((prevLista) => prevLista.map(c => {
        if (c.id === Number(data.chamadoId)) {
           const jaExiste = c.interacoes?.some(i => i.id === data.id);
           if (jaExiste) return c;

           let novasNaoLidas = c.mensagensNaoLidas;
           if (data.autor === 'CLIENTE') {
               if (!chamadoSelecionado || chamadoSelecionado.id !== Number(data.chamadoId)) {
                   novasNaoLidas = (c.mensagensNaoLidas || 0) + 1;
               }
           }
           return { 
               ...c, 
               mensagensNaoLidas: novasNaoLidas, 
               interacoes: [...(c.interacoes || []), data] 
           };
        }
        return c;
      }));

      if (chamadoSelecionado && chamadoSelecionado.id === data.chamadoId) {
        setChamadoSelecionado((prev) => {
           if (!prev) return null;
           const jaExiste = prev.interacoes?.some(i => i.id === data.id);
           if (jaExiste) return prev;
           return { ...prev, interacoes: [...(prev.interacoes || []), data] };
        });
      }
    });

    socket.on('novo_chamado', (novoChamado) => {
      audio.play().catch(() => {});
      toast.info(`🆕 Novo chamado de ${novoChamado.nomeEmpresa}!`, {
        position: "top-center", theme: "colored"
      });
      setChamados((prev) => [novoChamado, ...prev]);
    });

    socket.on('mudanca_status', (data) => {
      setChamados((prev) => prev.map(chamado => {
        if (chamado.id === data.id) {
          // Atualiza dados, incluindo prioridade se vier
          return { 
              ...chamado, 
              status: data.status || chamado.status,
              prioridade: data.prioridade || chamado.prioridade, 
              responsavel: data.responsavel || chamado.responsavel,
              responsavelCor: data.responsavelCor || chamado.responsavelCor
          };
        }
        return chamado;
      }));
      
      if (chamadoSelecionado && chamadoSelecionado.id === data.id) {
         setChamadoSelecionado(prev => prev ? { 
             ...prev, 
             status: data.status || prev.status,
             prioridade: data.prioridade || prev.prioridade,
             responsavel: data.responsavel || prev.responsavel,
             responsavelCor: data.responsavelCor || prev.responsavelCor
         } : null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [chamadoSelecionado]);

  return (
    <Box sx={{ p: 3, height: '90vh', backgroundColor: '#F4F5F7', display: 'flex', flexDirection: 'column', marginTop: 5}}>
      
      {/* CABEÇALHO */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#444' }}>
          Fila de Chamados
        </Typography>

        <Box display="flex" gap={2}>
          <Button variant="outlined" color="primary" startIcon={<LinkIcon />} onClick={() => setModalLinksOpen(true)}>Links Úteis</Button>
          <Button variant={mostrarFiltros ? "contained" : "outlined"} onClick={() => setMostrarFiltros(!mostrarFiltros)} startIcon={<FilterListIcon />}>Filtros</Button>
          <Button variant="contained" color="secondary" startIcon={<BarChartIcon />} onClick={() => navigate('/dashboard')}>Relatórios</Button>
          <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ fontWeight: 'bold' }}>Sair</Button>
        </Box>
      </Box>

      {/* PAINEL DE FILTROS */}
      {mostrarFiltros && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                    <TextField fullWidth variant="outlined" placeholder="Buscar..." size="small" value={busca} onChange={(e) => setBusca(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }} />
                </Grid>
                <Grid item xs={12} md={3}>
                    <FormControl size="small" fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select multiple value={filtroStatus} label="Status" onChange={(e) => { const value = e.target.value; setFiltroStatus(typeof value === 'string' ? value.split(',') : value); }} renderValue={(selected) => selected.map(val => COLUMNS[val].title.split(' ')[1]).join(', ')}>
                            {Object.entries(COLUMNS).map(([key, col]) => (
                                <MenuItem key={key} value={key}><Checkbox checked={filtroStatus.indexOf(key) > -1} /><MuiListItemText primary={col.title} /></MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                    <TextField fullWidth label="De" type="date" size="small" InputLabelProps={{ shrink: true }} value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} />
                </Grid>
                <Grid item xs={6} md={2}>
                    <TextField fullWidth label="Até" type="date" size="small" InputLabelProps={{ shrink: true }} value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} />
                </Grid>
                <Grid item xs={12} md={2} display="flex" alignItems="center" justifyContent="space-between">
                    <FormControlLabel control={<Switch checked={apenasNaoLidos} onChange={(e) => setApenasNaoLidos(e.target.checked)} color="success" />} label={<Typography variant="caption" fontWeight="bold">Não Lidos</Typography>} />
                    <IconButton onClick={limparFiltros} title="Limpar Filtros" size="small"><ClearIcon /></IconButton>
                </Grid>
            </Grid>
        </Paper>
      )}

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
                          {(provided, snapshot) => {
                            // ✅ Cor da Borda (SLA)
                            const prioridadeInfo = PRIORITY_CONFIG[item.prioridade || 'BAIXA'];
                            
                            return (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleAbrirChamado(item)}
                              sx={{
                                mb: 2, borderRadius: 2, cursor: 'pointer',
                                boxShadow: snapshot.isDragging ? 6 : 1,
                                transition: 'transform 0.2s',
                                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                                position: 'relative',
                                // 👇 BORDA LATERAL COLORIDA (SLA)
                                borderLeft: `5px solid ${prioridadeInfo.color}` 
                              }}
                            >
                              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                {/* --- CABEÇALHO LIMPO (Sem o Chip Urgente aqui) --- */}
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                  <Typography variant="caption" color="text.secondary">#{item.id}</Typography>

                                  {/* USUÁRIO */}
                                  {item.responsavel && (
                                    <Box display="flex" alignItems="center" gap={1} sx={{ bgcolor: `${item.responsavelCor || '#1976d2'}15`, p: 0.5, borderRadius: 1, maxWidth: '140px' }}>
                                      <Avatar sx={{ width: 20, height: 20, fontSize: 10, bgcolor: item.responsavelCor || '#1976d2', color: '#fff' }}>
                                        {item.responsavel.charAt(0).toUpperCase()}
                                      </Avatar>
                                      <Typography variant="caption" fontWeight="bold" noWrap sx={{ color: item.responsavelCor || '#1976d2' }}>
                                        {item.responsavel}
                                      </Typography>
                                    </Box>
                                  )}
                                  
                                  {/* CONTADOR MSG */}
                                  {item.mensagensNaoLidas > 0 && (
                                    <Box sx={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', backgroundColor: '#2e7d32', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: 2, zIndex: 10 }}>
                                      {item.mensagensNaoLidas}
                                    </Box>
                                  )}

                                  <Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</Typography>
                                </Box>

                                {/* --- TÍTULO --- */}
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{item.nomeEmpresa}</Typography>
                                
                                {/* --- NOVA LINHA DE ETIQUETAS (Serviço + Prioridade) --- */}
                                <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                                    <Chip label={item.servico} size="small" sx={{ bgcolor: column.bg, color: '#444', fontWeight: 'bold', fontSize: '0.75rem' }} />
                                    
                                    {/* 👇 O CHIP URGENTE FICA AQUI AGORA */}
                                    {item.prioridade === 'CRITICA' && (
                                        <Chip 
                                            label="URGENTE" 
                                            size="small" 
                                            sx={{ 
                                                bgcolor: '#ffebee', 
                                                color: '#d32f2f', 
                                                fontWeight: 'bold', 
                                                fontSize: '0.75rem',
                                                border: '1px solid #ffcdd2'
                                            }} 
                                        />
                                    )}
                                </Box>

                                <Typography variant="body2" color="text.secondary" noWrap>{item.descricao}</Typography>
                              </CardContent>
                            </Card>
                          )}}
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

      {/* ... MODAL DETALHES, MACROS, LINKTREE (MANTIDOS IGUAIS) ... */}
      
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
                  label={COLUMNS[chamadoSelecionado.status]?.title || chamadoSelecionado.status} 
                  sx={{ bgcolor: COLUMNS[chamadoSelecionado.status]?.bg || '#eee' }}
                />
              </Box>
              <IconButton onClick={() => setChamadoSelecionado(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={2} sx={{ height: '100%' }}>
                
                {/* COLUNA ESQUERDA: CHAT */}
                <Grid item xs={12} md={8} display="flex" flexDirection="column">
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Histórico do Chamado</Typography>
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

                    {/* Loop de Mensagens */}
                    {chamadoSelecionado.interacoes?.map((interacao, idx) => {
                      const isSuporte = interacao.autor === 'SUPORTE';
                      const isInterno = interacao.interno; 

                      return (
                        <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: isSuporte ? 'flex-end' : 'flex-start', mb: 2 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5} flexDirection={isSuporte ? 'row-reverse' : 'row'}>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: isSuporte ? '#1976d2' : '#9e9e9e' }}>{isSuporte ? <SupportAgentIcon fontSize="small" /> : <PersonIcon fontSize="small" />}</Avatar>
                              <Typography variant="caption" fontWeight="bold">{isSuporte ? 'Suporte' : 'Cliente'}</Typography>
                              <Typography variant="caption" color="text.secondary">{new Date(interacao.createdAt).toLocaleString()}</Typography>
                            </Box>
                            
                            <Paper 
                                elevation={0} 
                                sx={{ 
                                    p: 2, 
                                    bgcolor: isInterno ? '#FFF3E0' : (isSuporte ? '#E3F2FD' : '#ffffff'), 
                                    border: isInterno ? '1px dashed #FF9800' : (isSuporte ? 'none' : '1px solid #ddd'), 
                                    borderRadius: isSuporte ? '12px 0 12px 12px' : '0 12px 12px 12px', 
                                    maxWidth: '90%', 
                                    color: isSuporte ? '#0d47a1' : 'inherit' 
                                }}
                            >
                              {isInterno && (
                                  <Box display="flex" alignItems="center" gap={0.5} mb={0.5} color="warning.main">
                                      <LockIcon style={{ fontSize: 14 }} />
                                      <Typography variant="caption" fontWeight="bold">NOTA INTERNA (Cliente não vê)</Typography>
                                  </Box>
                              )}

                              <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>{interacao.texto}</Typography>
                              
                              {interacao.anexos && interacao.anexos.length > 0 && (
                                <Box mt={1} pt={1} borderTop="1px solid rgba(0,0,0,0.1)">
                                  {interacao.anexos.map(anexo => (
                                    <Chip
                                      key={anexo.id}
                                      icon={<AttachIcon />}
                                      label={anexo.nomeOriginal.length > 20 ? anexo.nomeOriginal.substring(0, 17) + '...' : anexo.nomeOriginal}
                                      component="a"
                                      href={anexo.caminho && anexo.caminho.startsWith('http') ? anexo.caminho : `${API_URL}/uploads/${anexo.nomeArquivo}`}
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
                  
                  {/* ÁREA DE RESPOSTA */}
                  <Box>
                    <Box display="flex" justifyContent="flex-end" mb={1}>
                        <FormControlLabel 
                            control={
                                <Switch 
                                    checked={notaInterna} 
                                    onChange={(e) => setNotaInterna(e.target.checked)} 
                                    color="warning" 
                                    size="small"
                                />
                            } 
                            label={
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    {notaInterna && <LockIcon fontSize="small" color="warning" />}
                                    <Typography variant="caption" sx={{ color: notaInterna ? '#ed6c02' : 'gray', fontWeight: 'bold' }}>
                                        Nota Interna (Privado)
                                    </Typography>
                                </Box>
                            } 
                        />
                    </Box>

                    {files.length > 0 && (
                      <Box mb={1} display="flex" gap={1} flexWrap="wrap">
                        {files.map((file, i) => (
                          <Chip key={i} label={file.name} onDelete={() => removeFile(i)} size="small" icon={<AttachIcon />} />
                        ))}
                      </Box>
                    )}
                    <Box display="flex" gap={1} alignItems="flex-end">
                      <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                      <IconButton onClick={() => fileInputRef.current?.click()} sx={{ border: '1px solid #ccc', borderRadius: 1 }}><AttachIcon /></IconButton>
                      
                      {/* ⚡ BOTÃO DE MACROS */}
                      <IconButton 
                        onClick={(e) => setAnchorElMacros(e.currentTarget)} 
                        sx={{ border: '1px solid #ff9800', color: '#ff9800', borderRadius: 1 }}
                        title="Respostas Prontas"
                      >
                        <BoltIcon />
                      </IconButton>

                      <TextField 
                        fullWidth 
                        size="small" 
                        placeholder={notaInterna ? "Escreva uma nota interna..." : "Responder ao cliente..."}
                        value={novoComentario} 
                        onChange={(e) => setNovoComentario(e.target.value)} 
                        multiline 
                        maxRows={3} 
                        sx={{ bgcolor: notaInterna ? '#FFF3E0' : 'white' }} 
                      />
                      
                      <Button 
                        variant="contained" 
                        onClick={handleAddInteracao} 
                        disabled={enviandoComentario || (!novoComentario.trim() && files.length === 0)}
                        color={notaInterna ? "warning" : "primary"}
                      >
                        <SendIcon />
                      </Button>
                    </Box>
                  </Box>
                </Grid>

                {/* COLUNA DIREITA: INFO + SLA */}
                <Grid item xs={12} md={4}>
                    <Box mb={3}>
                      <Typography variant="subtitle2" color="text.secondary">Empresa</Typography>
                      <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}><BusinessIcon color="primary" fontSize="small"/> {chamadoSelecionado.nomeEmpresa}</Typography>
                    </Box>

                    {/* ✅ SELETOR DE PRIORIDADE (SLA) */}
                    <Box mb={3}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Nível de Urgência (SLA)</Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={chamadoSelecionado.prioridade || 'BAIXA'}
                                onChange={(e) => handleChangePriority(e.target.value)}
                                sx={{ 
                                    color: PRIORITY_CONFIG[chamadoSelecionado.prioridade || 'BAIXA'].color,
                                    fontWeight: 'bold',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: PRIORITY_CONFIG[chamadoSelecionado.prioridade || 'BAIXA'].color }
                                }}
                            >
                                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                    <MenuItem key={key} value={key} sx={{ color: config.color, fontWeight: 'bold' }}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {config.icon} {config.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {chamadoSelecionado.anexos?.length > 0 && (
                      <Box mb={2}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Anexos Iniciais</Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {chamadoSelecionado.anexos?.map((anexo, idx) => (
                             <Chip key={idx} icon={<AttachIcon />} label={anexo.nomeOriginal.substring(0,12)+'...'} clickable component="a" href={anexo.caminho && anexo.caminho.startsWith('http') ? anexo.caminho : `${API_URL}/uploads/${anexo.nomeArquivo}`} target="_blank" rel="noopener noreferrer" variant="outlined" color="primary" size="small" />
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
               
               {/* 🗑️ BOTÃO DE EXCLUIR (Canto Esquerdo) */}
               <Button 
                 variant="text" 
                 color="error" 
                 startIcon={<DeleteIcon />}
                 onClick={() => setConfirmDeleteOpen(true)}
               >
                 Excluir
               </Button>

               {/* BOTÃO DE MOVER (Canto Direito - Lógica antiga mantida) */}
               {chamadoSelecionado.status !== 'FINALIZADO' && (
                <Button variant="contained" color="secondary" endIcon={<ArrowForwardIcon />} onClick={handleNextStep}>
                  Mover para {COLUMNS[FLOW_ORDER[FLOW_ORDER.indexOf(chamadoSelecionado.status) + 1] as keyof typeof COLUMNS]?.title}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ✅ MENU FLUTUANTE DE RESPOSTAS RÁPIDAS (MACROS) */}
      <Popover
        open={Boolean(anchorElMacros)}
        anchorEl={anchorElMacros}
        onClose={() => setAnchorElMacros(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
          <Box p={2} bgcolor="#f5f5f5" borderBottom="1px solid #ddd" display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight="bold">Respostas Prontas</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => setModalMacrosOpen(true)}>Gerenciar</Button>
          </Box>
          <List dense>
            {respostasProntas.length === 0 && <Typography variant="caption" sx={{ p: 2, display: 'block', textAlign: 'center' }}>Nenhuma resposta cadastrada.</Typography>}
            
            {respostasProntas.map((macro) => (
              <ListItem key={macro.id} button onClick={() => handleUsarMacro(macro.texto)}>
                <ListItemText 
                  primary={macro.titulo} 
                  secondary={macro.texto.substring(0, 40) + '...'} 
                  primaryTypographyProps={{ fontWeight: 'bold', fontSize: '0.875rem' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>

      {/* ✅ MODAL PARA CRIAR/GERENCIAR MACROS */}
      <Dialog open={modalMacrosOpen} onClose={() => setModalMacrosOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gerenciar Respostas Prontas</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" gap={2} mb={3} alignItems="flex-start">
            <TextField label="Título (Ex: Saudação)" size="small" value={novaMacro.titulo} onChange={(e) => setNovaMacro({...novaMacro, titulo: e.target.value})} />
            <TextField label="Texto da Mensagem" size="small" fullWidth multiline maxRows={3} value={novaMacro.texto} onChange={(e) => setNovaMacro({...novaMacro, texto: e.target.value})} />
            <Button variant="contained" onClick={handleCriarMacro}>Salvar</Button>
          </Box>

          <Divider sx={{ mb: 2 }}><Chip label="Cadastradas" size="small" /></Divider>

          <List dense>
            {respostasProntas.map((macro) => (
              <ListItem key={macro.id} secondaryAction={
                <IconButton edge="end" color="error" onClick={() => handleDeleteMacro(macro.id)}><DeleteIcon /></IconButton>
              }>
                <ListItemText primary={macro.titulo} secondary={macro.texto} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions><Button onClick={() => setModalMacrosOpen(false)}>Fechar</Button></DialogActions>
      </Dialog>

      {/* ✅ MODAL "LINKTREE" */}
      <Dialog 
        open={modalLinksOpen} 
        onClose={() => setModalLinksOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pb: 1 }}>
          Links & Ferramentas
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" align="center" gutterBottom mb={3}>
            Acesso rápido às ferramentas do suporte.
          </Typography>
          
          <Stack spacing={2}>
            {SUPORTE_LINKS.map((link, idx) => (
              <Button
                key={idx}
                variant="outlined"
                component="a"
                href={link.url}
                target="_blank"
                startIcon={link.icon}
                sx={{ 
                  justifyContent: 'flex-start', 
                  py: 1.5, 
                  px: 3, 
                  color: link.color, 
                  borderColor: link.color,
                  '&:hover': {
                    backgroundColor: `${link.color}10`, // 10% de opacidade
                    borderColor: link.color
                  }
                }}
              >
                {link.title}
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setModalLinksOpen(false)} color="inherit">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>


      {/* 🚨 MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle sx={{ color: '#d32f2f', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon /> Excluir Chamado?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o chamado <strong>#{chamadoSelecionado?.id}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Essa ação apagará todo o histórico de conversas e anexos permanentemente.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleDeleteChamado} variant="contained" color="error">
            Sim, Excluir
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}