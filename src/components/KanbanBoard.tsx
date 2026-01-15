import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Box, Typography, Paper, Card, CardContent, Chip, IconButton,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Grid, List, ListItem, ListItemIcon, ListItemText, Divider, Avatar,
  FormControlLabel, Switch, Select, MenuItem, Checkbox, ListItemText as MuiListItemText,
  InputLabel, FormControl, Stack, Popover, Autocomplete 
} from '@mui/material';
import { ListAlt } from '@mui/icons-material';
import LockIcon from '@mui/icons-material/Lock'; 
import BoltIcon from '@mui/icons-material/Bolt';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LabelIcon from '@mui/icons-material/Label'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon from '@mui/icons-material/Settings'; 
import EditIcon from '@mui/icons-material/Edit'; 
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MicIcon from '@mui/icons-material/Mic'; // Ícone para indicar áudio
import { useTheme } from '@mui/material/styles';

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
  Book as BookIcon,
  Dns as DnsIcon,
  Help as HelpIcon,
  Public as PublicIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import InboxIcon from '@mui/icons-material/Inbox';       
import LoopIcon from '@mui/icons-material/Loop';         
import TaskAltIcon from '@mui/icons-material/TaskAlt';   
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import LowPriorityIcon from '@mui/icons-material/LowPriority';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; 
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import UserProfileModal from './UserProfileModal';
import ToggleThemeButton from '../components/ToggleThemeButton';
import AudioRecorder from './AudioRecorder'; // 👈 IMPORTANTE: Componente de Gravação

// --- CONFIGURAÇÃO DAS COLUNAS ---
const COLUMNS = {
  NOVO: { id: 'NOVO', title: 'Novos', icon: <InboxIcon />, bg: '#E3F2FD', border: '#2196F3', iconColor: '#1976d2' },
  EM_ATENDIMENTO: { id: 'EM_ATENDIMENTO', title: 'Em Atendimento', icon: <LoopIcon />, bg: '#FFF3E0', border: '#FF9800', iconColor: '#f57c00' },
  FINALIZADO: { id: 'FINALIZADO', title: 'Finalizados', icon: <TaskAltIcon />, bg: '#E8F5E9', border: '#4CAF50', iconColor: '#2e7d32' }
};

// --- CONFIGURAÇÃO DE SLA ---
const PRIORITY_CONFIG = {
  BAIXA:   { label: 'Baixa',   color: '#4CAF50', icon: <LowPriorityIcon fontSize="small"/> }, 
  MEDIA:   { label: 'Média',   color: '#2196F3', icon: <LowPriorityIcon fontSize="small"/> }, 
  ALTA:    { label: 'Alta',    color: '#FF9800', icon: <PriorityHighIcon fontSize="small"/> }, 
  CRITICA: { label: 'Crítica', color: '#F44336', icon: <PriorityHighIcon fontSize="small"/> }  
};

const TAG_COLORS = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];
const FLOW_ORDER = ['NOVO', 'EM_ATENDIMENTO', 'FINALIZADO'];
const API_URL = 'https://form-chamados-hotmobile-production.up.railway.app';

// LINKS ÚTEIS
const SUPORTE_LINKS = [
  { title: 'Central de Ajuda Hotmobile', url: 'https://ajuda.hotmobile.com.br/', icon: <HelpIcon />, color: '#1976d2' },
  { title: 'Painel Hot', url: 'https://painel.hotmobile.com.br/a/', icon: <DnsIcon />, color: '#2e7d32' },
];

function stringToColor(string) {
    if (!string) return '#999';
    let hash = 0;
    for (let i = 0; i < string.length; i++) { hash = string.charCodeAt(i) + ((hash << 5) - hash); }
    let color = '#';
    for (let i = 0; i < 3; i++) { const value = (hash >> (i * 8)) & 0xff; color += `00${value.toString(16)}`.slice(-2); }
    return color;
}

export default function KanbanBoardView() {
  const theme = useTheme(); 
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate(); 
  const [chamados, setChamados] = useState([]);
  const { logout, user } = useAuth();
  
  const [equipe, setEquipe] = useState([]); 

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState(Object.keys(COLUMNS)); 
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [apenasNaoLidos, setApenasNaoLidos] = useState(false);
  const [filtroResponsavel, setFiltroResponsavel] = useState([]);
  const [filtroTags, setFiltroTags] = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false); 
  const [modalPerfilOpen, setModalPerfilOpen] = useState(false);
  
  // UI
  const [modalLinksOpen, setModalLinksOpen] = useState(false);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false); 

  // Chat
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [files, setFiles] = useState([]); 
  const [notaInterna, setNotaInterna] = useState(false);
  const fileInputRef = useRef(null); 

  // Macros e Tags
  const [respostasProntas, setRespostasProntas] = useState([]);
  const [anchorElMacros, setAnchorElMacros] = useState(null); 
  const [modalMacrosOpen, setModalMacrosOpen] = useState(false); 
  const [novaMacro, setNovaMacro] = useState({ titulo: '', texto: '' });
  const [todasTags, setTodasTags] = useState([]);
  const [modalCriarTagOpen, setModalCriarTagOpen] = useState(false);
  const [modalGerenciarTagsOpen, setModalGerenciarTagsOpen] = useState(false); 
  const [novaTagData, setNovaTagData] = useState({ nome: '', cor: TAG_COLORS[5] });
  const [editandoTagId, setEditandoTagId] = useState(null);

  const handleLogout = () => { logout(); toast.info('Você saiu do sistema.'); navigate('/login'); };

  useEffect(() => {
    carregarChamados(); carregarMacros(); carregarTags(); carregarUsuarios();
    if ("Notification" in window && Notification.permission !== "granted") Notification.requestPermission();
  }, []);

  const carregarChamados = async () => {
    try { const response = await api.get(`${API_URL}/chamados`); setChamados(response.data); } 
    catch (error) { toast.error('Erro ao carregar chamados.'); }
  };

  const carregarUsuarios = async () => {
    try {
        const { data } = await api.get('/auth/users');
        const listaFormatada = data.map(u => ({ id: u.id, nome: u.nome, cor: u.cor || stringToColor(u.nome) }));
        setEquipe(listaFormatada);
    } catch (error) { console.error("Erro ao carregar equipe:", error); }
  };

  const carregarTags = async () => { try { const { data } = await api.get(`${API_URL}/chamados/tags/list`); setTodasTags(data); } catch (error) { console.error("Erro tags"); } };
  const carregarMacros = async () => { try { const { data } = await api.get(`${API_URL}/respostas-prontas`); setRespostasProntas(data); } catch (error) { console.error("Erro macros"); } };

  // --- LÓGICA DE ENVIO (Com suporte a Áudio) ---
  const handleFileChange = (e) => { if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files)]); };
  const handleAudioRecorded = (audioFile) => { setFiles((prev) => [...prev, audioFile]); };
  const removeFile = (index) => { setFiles((prev) => prev.filter((_, i) => i !== index)); };

  const handleAddInteracao = async () => {
    if (!chamadoSelecionado || (!novoComentario.trim() && files.length === 0)) return;
    setEnviandoComentario(true);
    
    const formData = new FormData();
    formData.append('texto', novoComentario || 'Segue anexo.');
    formData.append('autor', 'SUPORTE');
    if (notaInterna) formData.append('interno', 'true');
    // ✅ O nome do campo deve ser 'files' para bater com o backend
    files.forEach((file) => formData.append('files', file));

    try {
      await api.post(`${API_URL}/chamados/${chamadoSelecionado.id}/interacoes`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNovoComentario(''); setFiles([]); setNotaInterna(false); 
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success(notaInterna ? 'Nota interna adicionada!' : 'Mensagem enviada!');
    } catch (error) { toast.error('Erro ao enviar mensagem.'); } finally { setEnviandoComentario(false); }
  };

  // --- LÓGICA DE UPDATE / WEBSOCKET ---
  // (Mantida igual ao anterior para brevidade, focando nas mudanças visuais)
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    atualizarStatus(parseInt(draggableId), destination.droppableId);
  };

  const atualizarStatus = async (id, novoStatus) => {
    const dadosAtualizacao = { status: novoStatus };
    if (novoStatus === 'EM_ATENDIMENTO') {
        const nome = user?.nome || user?.name;
        if (nome) { dadosAtualizacao.responsavel = nome; dadosAtualizacao.responsavelCor = user?.cor || '#1976d2'; }
    }
    setChamados((prev) => prev.map((c) => c.id === id ? { ...c, ...dadosAtualizacao } : c));
    if (chamadoSelecionado && chamadoSelecionado.id === id) setChamadoSelecionado((prev) => ({ ...prev, ...dadosAtualizacao }));
    try { await api.patch(`${API_URL}/chamados/${id}/status`, dadosAtualizacao); toast.success('Status atualizado!'); } 
    catch (error) { toast.error('Erro ao atualizar.'); }
  };

  const handleTrocarResponsavel = async (novoResponsavel) => {
    if (!chamadoSelecionado) return;
    const nome = novoResponsavel ? (novoResponsavel.nome || novoResponsavel) : null;
    const cor = novoResponsavel ? (novoResponsavel.cor || '#999') : null;
    setChamadoSelecionado(prev => ({ ...prev, responsavel: nome, responsavelCor: cor }));
    setChamados(prev => prev.map(c => c.id === chamadoSelecionado.id ? { ...c, responsavel: nome, responsavelCor: cor } : c));
    try { await api.patch(`${API_URL}/chamados/${chamadoSelecionado.id}/responsavel`, { responsavel: nome, responsavelCor: cor }); toast.success(`Responsável: ${nome || 'Ninguém'}`); } 
    catch (error) { toast.error("Erro ao alterar."); }
  };

  const handleSalvarTags = async (novasTags) => {
    setChamadoSelecionado(prev => ({ ...prev, tags: novasTags }));
    setChamados(prev => prev.map(c => c.id === chamadoSelecionado.id ? { ...c, tags: novasTags } : c));
    try { await api.patch(`${API_URL}/chamados/${chamadoSelecionado.id}/tags`, { tagIds: novasTags.map(t=>t.id) }); } catch (error) { toast.error("Erro ao salvar tags."); }
  };

  const handleChangePriority = async (val) => {
      setChamadoSelecionado(prev => ({ ...prev, prioridade: val }));
      setChamados(prev => prev.map(c => c.id === chamadoSelecionado.id ? { ...c, prioridade: val } : c));
      try { await api.patch(`${API_URL}/chamados/${chamadoSelecionado.id}/status`, { prioridade: val }); toast.success('Prioridade alterada'); } catch (error) {}
  };

  // Socket
  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket', 'polling'], reconnection: true });
    socket.on('nova_interacao', (data) => {
      if (data.autor === 'CLIENTE') toast.info(`💬 Nova resposta: #${data.chamadoId}`);
      setChamados((prev) => prev.map(c => {
        if (c.id === Number(data.chamadoId)) {
           const exists = c.interacoes?.some(i => i.id === data.id);
           if (exists) return c;
           return { ...c, mensagensNaoLidas: (data.autor === 'CLIENTE' && (!chamadoSelecionado || chamadoSelecionado.id !== c.id)) ? (c.mensagensNaoLidas || 0) + 1 : c.mensagensNaoLidas, interacoes: [...(c.interacoes || []), data] };
        }
        return c;
      }));
      if (chamadoSelecionado && chamadoSelecionado.id === data.chamadoId) {
        setChamadoSelecionado((prev) => prev.interacoes?.some(i=>i.id===data.id) ? prev : { ...prev, interacoes: [...(prev.interacoes || []), data] });
      }
    });
    socket.on('novo_chamado', (nc) => { toast.info(`🆕 Novo chamado!`); setChamados(prev => [nc, ...prev]); });
    socket.on('mudanca_status', (d) => {
        setChamados(prev => prev.map(c => c.id === d.id ? { ...c, ...d } : c));
        if (chamadoSelecionado && chamadoSelecionado.id === d.id) setChamadoSelecionado(prev => ({ ...prev, ...d }));
    });
    return () => socket.disconnect();
  }, [chamadoSelecionado]);

  // Filtros Logica
  const chamadosFiltrados = chamados.filter((c) => {
    const termo = busca.toLowerCase();
    const matchTexto = c.nomeEmpresa.toLowerCase().includes(termo) || c.id.toString().includes(termo);
    return matchTexto && filtroStatus.includes(c.status) && (filtroResponsavel.length === 0 || filtroResponsavel.includes(c.responsavel));
  });

  return (
    <Box sx={{ p: 3, height: '90vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', marginTop: 5}}>
      {/* Header e Filtros (Resumido para caber) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">Fila de Chamados</Typography>
        <Box display="flex" gap={2}>
            <Button variant="outlined" onClick={() => setMostrarFiltros(!mostrarFiltros)} startIcon={<FilterListIcon />}>Filtros</Button>
            <Button variant="contained" color="secondary" onClick={() => navigate('/dashboard')} startIcon={<BarChartIcon />}>Relatórios</Button>
            <Button variant="outlined" color="error" onClick={handleLogout} startIcon={<LogoutIcon />}>Sair</Button>
            <ToggleThemeButton />
        </Box>
      </Box>
      
      {mostrarFiltros && (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={3}><TextField fullWidth size="small" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} /></Grid>
                <Grid item xs={12} md={2}><FormControl size="small" fullWidth><InputLabel>Responsável</InputLabel><Select multiple value={filtroResponsavel} label="Responsável" onChange={(e) => setFiltroResponsavel(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)} renderValue={(s) => s.join(', ')}>{[...new Set(chamados.map(c=>c.responsavel).filter(Boolean))].map((r)=>(<MenuItem key={r} value={r}><Checkbox checked={filtroResponsavel.indexOf(r)>-1}/><MuiListItemText primary={r}/></MenuItem>))}</Select></FormControl></Grid>
                {/* Outros filtros... */}
            </Grid>
        </Paper>
      )}

      {/* KANBAN BOARD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 10, overflowX: 'auto', flexGrow: 1 }}>
          {Object.entries(COLUMNS).map(([columnId, column]) => {
            const lista = chamadosFiltrados.filter(c => c.status === columnId);
            return (
              <Droppable key={columnId} droppableId={columnId}>
                {(provided, snapshot) => (
                  <Paper ref={provided.innerRef} {...provided.droppableProps} elevation={0} sx={{ width: 350, minWidth: 350, bgcolor: snapshot.isDraggingOver ? '#e0e0e0' : (isDark ? '#2e2e2e' : '#ebecf0'), p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
                    <Box sx={{ mb: 2, pb: 1, borderBottom: `3px solid ${column.border}`, display: 'flex', justifyContent: 'space-between' }}>
                         <Box display="flex" gap={1} color={column.iconColor}>{column.icon}<Typography variant="h6">{column.title}</Typography></Box>
                         <Chip label={lista.length} size="small" />
                    </Box>
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                      {lista.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <Card ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => { setChamadoSelecionado(item); api.get(`${API_URL}/chamados/${item.id}`).catch(()=>{}); setChamados(p => p.map(c => c.id === item.id ? { ...c, mensagensNaoLidas: 0 } : c)); }} sx={{ mb: 2, cursor: 'pointer', borderLeft: `5px solid ${PRIORITY_CONFIG[item.prioridade || 'BAIXA'].color}` }}>
                              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box display="flex" justifyContent="space-between" mb={1}><Typography variant="caption">#{item.id}</Typography><Typography variant="caption">{new Date(item.createdAt).toLocaleDateString()}</Typography></Box>
                                <Typography variant="subtitle1" fontWeight="bold">{item.nomeEmpresa}</Typography>
                                <Box display="flex" gap={1} flexWrap="wrap" mt={1}>{item.tags?.map(t => <Chip key={t.id} label={t.nome} size="small" sx={{ bgcolor: t.cor, color: '#fff', height: 20, fontSize: 10 }} />)}</Box>
                                {item.mensagensNaoLidas > 0 && <Box sx={{ position: 'absolute', bottom: 10, right: 10, width: 24, height: 24, borderRadius: '50%', bgcolor: 'green', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 10 }}>{item.mensagensNaoLidas}</Box>}
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
      <Dialog open={Boolean(chamadoSelecionado)} onClose={() => setChamadoSelecionado(null)} maxWidth="md" fullWidth>
        {chamadoSelecionado && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6">Chamado #{chamadoSelecionado.id}</Typography>
                <Chip label={COLUMNS[chamadoSelecionado.status]?.title} sx={{ bgcolor: COLUMNS[chamadoSelecionado.status]?.bg, color: '#000 !important', fontWeight: 'bold' }} />
              </Box>
              <IconButton onClick={() => setChamadoSelecionado(null)}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{ height: '100%' }}>
                <Grid item xs={12} md={8} display="flex" flexDirection="column">
                  <Box sx={{ flexGrow: 1, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#f9f9f9', borderRadius: 2, p: 2, mb: 2, border: '1px solid', borderColor: 'divider', maxHeight: '400px', overflowY: 'auto'}}>
                    
                    {/* Abertura */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                        <Box display="flex" gap={1} mb={0.5}><Avatar sx={{ width: 24, height: 24 }}><PersonIcon fontSize="small" /></Avatar><Typography variant="caption" fontWeight="bold">Abertura</Typography></Box>
                        <Paper sx={{ p: 2, maxWidth: '90%', borderRadius: '0 12px 12px 12px' }}><Typography variant="body2">{chamadoSelecionado.descricao}</Typography></Paper>
                    </Box>

                    {/* Chat */}
                    {chamadoSelecionado.interacoes?.map((interacao, idx) => {
                      const isSuporte = interacao.autor === 'SUPORTE';
                      return (
                        <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: isSuporte ? 'flex-end' : 'flex-start', mb: 2 }}>
                            <Box display="flex" gap={1} mb={0.5} flexDirection={isSuporte ? 'row-reverse' : 'row'}>
                                <Avatar sx={{ width: 24, height: 24, bgcolor: isSuporte ? '#1976d2' : '#9e9e9e' }}>{isSuporte ? <SupportAgentIcon fontSize="small"/> : <PersonIcon fontSize="small"/>}</Avatar>
                                <Typography variant="caption" fontWeight="bold">{isSuporte ? 'Suporte' : 'Cliente'}</Typography>
                            </Box>
                            <Paper sx={{ p: 2, bgcolor: interacao.interno ? '#FFF3E0' : (isSuporte ? (isDark ? '#1e3a5f' : '#E3F2FD') : 'background.paper'), borderRadius: isSuporte ? '12px 0 12px 12px' : '0 12px 12px 12px', maxWidth: '90%' }}>
                                {interacao.interno && <Box display="flex" gap={0.5} color="warning.main"><LockIcon fontSize="small"/><Typography variant="caption" fontWeight="bold">NOTA INTERNA</Typography></Box>}
                                <Typography variant="body2">{interacao.texto}</Typography>
                                
                                {/* ✅ RENDERIZAÇÃO DE ANEXOS E ÁUDIO */}
                                {interacao.anexos && interacao.anexos.length > 0 && (
                                    <Box mt={1} pt={1} borderTop="1px solid rgba(0,0,0,0.1)">
                                        {interacao.anexos.map(anexo => {
                                            const isAudio = anexo.nomeArquivo.match(/\.(mp3|wav|webm|ogg)$/i);
                                            const url = anexo.caminho.startsWith('http') ? anexo.caminho : `${API_URL}/uploads/${anexo.nomeArquivo}`;
                                            
                                            if (isAudio) {
                                                return (
                                                    <Box key={anexo.id} mt={1} display="flex" alignItems="center" gap={1}>
                                                        <audio controls src={url} style={{ height: 35, maxWidth: 250 }} />
                                                    </Box>
                                                );
                                            }
                                            return (
                                                <Chip key={anexo.id} icon={<AttachIcon />} label={anexo.nomeOriginal} component="a" href={url} target="_blank" clickable size="small" sx={{ m: 0.5 }} />
                                            );
                                        })}
                                    </Box>
                                )}
                            </Paper>
                        </Box>
                      )
                    })}
                  </Box>

                  {/* Área de Resposta */}
                  <Box>
                    <Box display="flex" justifyContent="flex-end" mb={1}>
                        <FormControlLabel control={<Switch checked={notaInterna} onChange={(e) => setNotaInterna(e.target.checked)} color="warning" size="small" />} label={<Typography variant="caption" color={notaInterna ? "warning.main" : "text.secondary"} fontWeight="bold">Nota Interna</Typography>} />
                    </Box>
                    {files.length > 0 && <Box mb={1} display="flex" gap={1} flexWrap="wrap">{files.map((f, i) => <Chip key={i} label={f.name} onDelete={() => removeFile(i)} icon={f.type.includes('audio') ? <MicIcon/> : <AttachIcon/>} />)}</Box>}
                    
                    <Box display="flex" gap={1} alignItems="flex-end">
                        <IconButton onClick={() => fileInputRef.current?.click()}><AttachIcon /></IconButton>
                        <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                        
                        {/* ✅ BOTÃO DE GRAVAR ÁUDIO NO KANBAN */}
                        <AudioRecorder onAudioReady={handleAudioRecorded} />

                        <TextField fullWidth size="small" multiline maxRows={3} placeholder={notaInterna ? "Nota interna..." : "Responder..."} value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)} sx={{ bgcolor: notaInterna ? (isDark ? 'rgba(237, 108, 2, 0.15)' : '#FFF3E0') : 'background.paper' }} />
                        <Button variant="contained" onClick={handleAddInteracao} disabled={enviandoComentario} color={notaInterna ? "warning" : "primary"}><SendIcon /></Button>
                    </Box>
                  </Box>
                </Grid>

                {/* Coluna Direita (Atributos) */}
                <Grid item xs={12} md={4}>
                    <Box mb={3}><Typography variant="subtitle2" color="text.secondary">Empresa</Typography><Typography variant="h6" fontWeight="bold">{chamadoSelecionado.nomeEmpresa}</Typography></Box>
                    
                    {/* ✅ SELETOR DE RESPONSÁVEL (AUTOCOMPLETE) */}
                    <Box mb={3}>
                        <Typography variant="subtitle2" color="text.secondary">Atribuído a</Typography>
                        <Autocomplete
                            options={equipe}
                            getOptionLabel={(opt) => opt.nome || opt}
                            value={equipe.find(u => u.nome === chamadoSelecionado.responsavel) || (chamadoSelecionado.responsavel ? { nome: chamadoSelecionado.responsavel } : null)}
                            onChange={(e, val) => handleTrocarResponsavel(val)}
                            isOptionEqualToValue={(opt, val) => opt.nome === (val.nome || val)}
                            renderOption={(props, opt) => (
                                <li {...props}><Box display="flex" gap={1}><Avatar sx={{ width: 24, height: 24, bgcolor: opt.cor, fontSize: 12 }}>{opt.nome?.charAt(0)}</Avatar><Typography>{opt.nome}</Typography></Box></li>
                            )}
                            renderInput={(params) => (
                                <TextField {...params} variant="outlined" size="small" placeholder="Responsável..." InputProps={{ ...params.InputProps, startAdornment: chamadoSelecionado.responsavel && <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: chamadoSelecionado.responsavelCor || '#999', fontSize: 12 }}>{chamadoSelecionado.responsavel.charAt(0)}</Avatar> }} />
                            )}
                        />
                    </Box>

                    <Box mb={3}><Typography variant="subtitle2" color="text.secondary">SLA</Typography><Select fullWidth size="small" value={chamadoSelecionado.prioridade || 'BAIXA'} onChange={(e) => handleChangePriority(e.target.value)}>{Object.entries(PRIORITY_CONFIG).map(([k, c]) => <MenuItem key={k} value={k} sx={{ color: c.color }}>{c.icon} {c.label}</MenuItem>)}</Select></Box>
                    <Box mb={3}><Typography variant="subtitle2" color="text.secondary">Tags</Typography><Autocomplete multiple options={todasTags} getOptionLabel={(o) => o.nome} value={chamadoSelecionado.tags || []} onChange={(e, val) => handleSalvarTags(val)} renderInput={(p) => <TextField {...p} size="small" placeholder="Tags..." />} renderTags={(val, getProps) => val.map((opt, idx) => <Chip label={opt.nome} size="small" {...getProps({ index: idx })} sx={{ bgcolor: opt.cor, color: '#fff' }} />)} /></Box>
                    
                    <Button fullWidth variant="outlined" startIcon={<SettingsIcon />} onClick={() => setModalGerenciarTagsOpen(true)}>Gerenciar Tags</Button>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'space-between', borderTop: 1, borderColor: 'divider' }}>
                <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDeleteOpen(true)}>Excluir</Button>
                {chamadoSelecionado.status !== 'FINALIZADO' && <Button variant="contained" color="secondary" onClick={() => atualizarStatus(chamadoSelecionado.id, COLUMNS[FLOW_ORDER[FLOW_ORDER.indexOf(chamadoSelecionado.status) + 1]].id)}>Próxima Etapa</Button>}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Outros Modais Auxiliares (Tags, Macros, Perfil) */}
      <UserProfileModal open={modalPerfilOpen} onClose={() => setModalPerfilOpen(false)} />
      <Dialog open={modalGerenciarTagsOpen} onClose={() => setModalGerenciarTagsOpen(false)} maxWidth="xs" fullWidth><DialogTitle>Tags</DialogTitle><DialogContent><List dense>{todasTags.map(t => <ListItem key={t.id}><Chip label={t.nome} sx={{ bgcolor: t.cor, color: '#fff' }} /></ListItem>)}</List></DialogContent><DialogActions><Button onClick={() => setModalGerenciarTagsOpen(false)}>Fechar</Button></DialogActions></Dialog>
      <Popover open={Boolean(anchorElMacros)} anchorEl={anchorElMacros} onClose={() => setAnchorElMacros(null)}><Box p={2}><Typography variant="subtitle2">Macros</Typography><List dense>{respostasProntas.map(m => <ListItem button key={m.id} onClick={() => { setNovoComentario(m.texto); setAnchorElMacros(null); }}><ListItemText primary={m.titulo} /></ListItem>)}</List><Button size="small" onClick={() => setModalMacrosOpen(true)}>Gerenciar</Button></Box></Popover>
      <Dialog open={modalMacrosOpen} onClose={() => setModalMacrosOpen(false)}><DialogTitle>Criar Macro</DialogTitle><DialogContent><TextField label="Título" value={novaMacro.titulo} onChange={e=>setNovaMacro({...novaMacro, titulo: e.target.value})} fullWidth margin="dense" /><TextField label="Texto" multiline rows={3} value={novaMacro.texto} onChange={e=>setNovaMacro({...novaMacro, texto: e.target.value})} fullWidth margin="dense" /></DialogContent><DialogActions><Button onClick={()=>setModalMacrosOpen(false)}>Cancelar</Button><Button onClick={() => { api.post(`${API_URL}/respostas-prontas`, novaMacro).then(carregarMacros); setModalMacrosOpen(false); }}>Salvar</Button></DialogActions></Dialog>
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}><DialogTitle>Confirmar Exclusão</DialogTitle><DialogActions><Button onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button><Button color="error" onClick={() => { api.delete(`${API_URL}/chamados/${chamadoSelecionado.id}`).then(() => { setChamados(p => p.filter(c => c.id !== chamadoSelecionado.id)); setChamadoSelecionado(null); setConfirmDeleteOpen(false); toast.success('Excluído'); }); }}>Excluir</Button></DialogActions></Dialog>
    </Box>
  );
}