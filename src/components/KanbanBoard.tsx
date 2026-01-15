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
import MicIcon from '@mui/icons-material/Mic'; 
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // 🟢 Ícone Tempo
import WarningIcon from '@mui/icons-material/Warning'; // 🟢 Ícone Alerta SLA
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
import AudioRecorder from './AudioRecorder'; 

// --- CONFIGURAÇÃO DAS COLUNAS ---
const COLUMNS = {
  NOVO: { id: 'NOVO', title: 'Novos', icon: <InboxIcon />, bg: '#E3F2FD', border: '#2196F3', iconColor: '#1976d2' },
  EM_ATENDIMENTO: { id: 'EM_ATENDIMENTO', title: 'Em Atendimento', icon: <LoopIcon />, bg: '#FFF3E0', border: '#FF9800', iconColor: '#f57c00' },
  FINALIZADO: { id: 'FINALIZADO', title: 'Finalizados', icon: <TaskAltIcon />, bg: '#E8F5E9', border: '#4CAF50', iconColor: '#2e7d32' }
};

// --- SLA / PRIORIDADE ---
const PRIORITY_CONFIG = {
  BAIXA:   { label: 'Baixa',   color: '#4CAF50', icon: <LowPriorityIcon fontSize="small"/> }, 
  MEDIA:   { label: 'Média',   color: '#2196F3', icon: <LowPriorityIcon fontSize="small"/> }, 
  ALTA:    { label: 'Alta',    color: '#FF9800', icon: <PriorityHighIcon fontSize="small"/> }, 
  CRITICA: { label: 'Crítica', color: '#F44336', icon: <PriorityHighIcon fontSize="small"/> }  
};

const TAG_COLORS = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];
const FLOW_ORDER = ['NOVO', 'EM_ATENDIMENTO', 'FINALIZADO'];
const API_URL = 'https://form-chamados-hotmobile-production.up.railway.app';

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

// 🟢 FUNÇÃO AUXILIAR: CALCULAR HORAS ABERTO
const calcularHorasAberto = (dataCriacao) => {
    const agora = new Date();
    const criacao = new Date(dataCriacao);
    const diferencaMs = agora - criacao;
    return Math.floor(diferencaMs / (1000 * 60 * 60)); // Retorna horas totais
};

export default function KanbanBoardView() {
  const theme = useTheme(); 
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate(); 
  const [chamados, setChamados] = useState([]);
  const { logout, user } = useAuth();
  const [equipe, setEquipe] = useState([]); 

  // Estados Filtro e UI
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState(Object.keys(COLUMNS)); 
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [apenasNaoLidos, setApenasNaoLidos] = useState(false);
  const [filtroResponsavel, setFiltroResponsavel] = useState([]);
  const [filtroTags, setFiltroTags] = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false); 
  const [modalPerfilOpen, setModalPerfilOpen] = useState(false);
  
  const [modalLinksOpen, setModalLinksOpen] = useState(false);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false); 

  // 🟢 ESTADOS DO SLA (MODAL DIÁRIO)
  const [modalSlaOpen, setModalSlaOpen] = useState(false);
  const [metricasSla, setMetricasSla] = useState({ estourados: 0, totalAbertos: 0 });

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
    try {
      const response = await api.get(`${API_URL}/chamados`);
      setChamados(response.data);

      // 🟢 CÁLCULO INICIAL DO SLA PARA O MODAL
      const abertos = response.data.filter(c => c.status !== 'FINALIZADO');
      const estourados = abertos.filter(c => calcularHorasAberto(c.createdAt) >= 24).length;
      
      if (estourados > 0) {
          setMetricasSla({ estourados, totalAbertos: abertos.length });
          setModalSlaOpen(true); // Abre o modal de aviso
      }

    } catch (error) {
      toast.error('Erro ao carregar chamados.');
    }
  };

  const carregarUsuarios = async () => { try { const { data } = await api.get('/auth/users'); const listaFormatada = data.map(u => ({ id: u.id, nome: u.nome, cor: u.cor || stringToColor(u.nome) })); setEquipe(listaFormatada); } catch (error) { console.error("Erro equipe:", error); } };
  const carregarTags = async () => { try { const { data } = await api.get(`${API_URL}/chamados/tags/list`); setTodasTags(data); } catch (error) { console.error("Erro tags"); } };
  const carregarMacros = async () => { try { const { data } = await api.get(`${API_URL}/respostas-prontas`); setRespostasProntas(data); } catch (error) { console.error("Erro macros"); } };

  // --- ARQUIVOS E ÁUDIO ---
  const handleFileChange = (e) => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files)]); };
  const handleAudioRecorded = (audioFile) => { setFiles(prev => [...prev, audioFile]); };
  const removeFile = (index) => { setFiles(prev => prev.filter((_, i) => i !== index)); };

  const handleAddInteracao = async () => {
    if (!chamadoSelecionado || (!novoComentario.trim() && files.length === 0)) return;
    setEnviandoComentario(true);
    
    const formData = new FormData();
    formData.append('texto', novoComentario || 'Segue anexo.');
    formData.append('autor', 'SUPORTE');
    if (notaInterna) formData.append('interno', 'true');
    files.forEach((file) => formData.append('files', file));

    try {
      await api.post(`${API_URL}/chamados/${chamadoSelecionado.id}/interacoes`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNovoComentario(''); setFiles([]); setNotaInterna(false); 
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success(notaInterna ? 'Nota interna adicionada!' : 'Mensagem enviada!');
    } catch (error) { toast.error('Erro ao enviar mensagem.'); } finally { setEnviandoComentario(false); }
  };

  // --- KANBAN & STATUS ---
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    atualizarStatus(parseInt(draggableId), destination.droppableId);
  };

  const atualizarStatus = async (id, novoStatus) => {
    const dados = { status: novoStatus };
    if (novoStatus === 'EM_ATENDIMENTO' && user?.nome) {
        dados.responsavel = user.nome;
        dados.responsavelCor = user.cor || '#1976d2';
    }
    setChamados(prev => prev.map(c => c.id === id ? { ...c, ...dados } : c));
    if (chamadoSelecionado?.id === id) setChamadoSelecionado(prev => ({ ...prev, ...dados }));
    try { await api.patch(`${API_URL}/chamados/${id}/status`, dados); toast.success('Status atualizado!'); } catch { toast.error('Erro ao atualizar.'); }
  };

  const handleTrocarResponsavel = async (novo) => {
    if (!chamadoSelecionado) return;
    const nome = novo?.nome || novo; 
    const cor = novo?.cor || '#999';
    setChamadoSelecionado(prev => ({ ...prev, responsavel: nome, responsavelCor: cor }));
    setChamados(prev => prev.map(c => c.id === chamadoSelecionado.id ? { ...c, responsavel: nome, responsavelCor: cor } : c));
    try { await api.patch(`${API_URL}/chamados/${chamadoSelecionado.id}/responsavel`, { responsavel: nome, responsavelCor: cor }); toast.success(`Responsável: ${nome || 'Ninguém'}`); } catch { toast.error("Erro ao alterar."); }
  };

  const handleChangePriority = async (val) => {
      setChamadoSelecionado(prev => ({ ...prev, prioridade: val }));
      setChamados(prev => prev.map(c => c.id === chamadoSelecionado.id ? { ...c, prioridade: val } : c));
      try { await api.patch(`${API_URL}/chamados/${chamadoSelecionado.id}/status`, { prioridade: val }); toast.success(`Prioridade alterada`); } catch {}
  };

  const handleSalvarTags = async (novasTags) => {
    setChamadoSelecionado(prev => ({ ...prev, tags: novasTags }));
    setChamados(prev => prev.map(c => c.id === chamadoSelecionado.id ? { ...c, tags: novasTags } : c));
    try { await api.patch(`${API_URL}/chamados/${chamadoSelecionado.id}/tags`, { tagIds: novasTags.map(t=>t.id) }); } catch { toast.error("Erro ao salvar tags."); }
  };

  // Tags & Macros Helpers
  const handleInitiateCriarTag = (nome) => { setNovaTagData({ nome, cor: TAG_COLORS[5] }); setModalCriarTagOpen(true); };
  const handleConfirmarCriacaoTag = async () => { if (!novaTagData.nome) return; try { const { data: novaTag } = await api.post(`${API_URL}/chamados/tags`, novaTagData); setTodasTags(prev => [...prev, novaTag]); const tagsAtuais = chamadoSelecionado.tags || []; handleSalvarTags([...tagsAtuais, novaTag]); toast.success("Tag criada!"); setModalCriarTagOpen(false); } catch { toast.error("Erro ao criar."); } };
  const handleUpdateCorTag = async (id, novaCor) => { try { await api.patch(`${API_URL}/chamados/tags/${id}`, { cor: novaCor }); setTodasTags(prev => prev.map(t => t.id === id ? { ...t, cor: novaCor } : t)); setChamados(prev => prev.map(c => { if (c.tags?.some(t => t.id === id)) return { ...c, tags: c.tags.map(t => t.id === id ? { ...t, cor: novaCor } : t) }; return c; })); if (chamadoSelecionado?.tags) setChamadoSelecionado(prev => ({ ...prev, tags: prev.tags.map(t => t.id === id ? { ...t, cor: novaCor } : t) })); setEditandoTagId(null); toast.success("Cor atualizada!"); } catch { toast.error("Erro ao atualizar cor."); } };
  const handleDeleteTag = async (id) => { try { await api.delete(`${API_URL}/chamados/tags/${id}`); setTodasTags(prev => prev.filter(t => t.id !== id)); if (chamadoSelecionado?.tags) { const novasTags = chamadoSelecionado.tags.filter(t => t.id !== id); if (novasTags.length !== chamadoSelecionado.tags.length) { setChamadoSelecionado(prev => ({ ...prev, tags: novasTags })); setChamados(prev => prev.map(c => c.id === chamadoSelecionado.id ? { ...c, tags: novasTags } : c)); } } toast.success("Tag excluída!"); } catch { toast.error("Erro ao excluir tag."); } };
  const handleCriarMacro = async () => { if (!novaMacro.titulo || !novaMacro.texto) return toast.warning("Preencha tudo!"); try { await api.post(`${API_URL}/respostas-prontas`, novaMacro); toast.success("Salvo!"); setNovaMacro({ titulo: '', texto: '' }); carregarMacros(); } catch { toast.error("Erro ao salvar."); } };
  const handleDeleteMacro = async (id) => { try { await api.delete(`${API_URL}/respostas-prontas/${id}`); carregarMacros(); toast.success("Removido."); } catch { toast.error("Erro ao excluir."); } };
  const handleUsarMacro = (texto) => { setNovoComentario(texto); setAnchorElMacros(null); };

  // Handlers Gerais
  const handleNextStep = () => { if (!chamadoSelecionado) return; const idx = FLOW_ORDER.indexOf(chamadoSelecionado.status); if (idx < FLOW_ORDER.length - 1) atualizarStatus(chamadoSelecionado.id, FLOW_ORDER[idx + 1]); };
  const handleDeleteChamado = async () => { if (!chamadoSelecionado) return; try { await api.delete(`${API_URL}/chamados/${chamadoSelecionado.id}`); setChamados(prev => prev.filter(c => c.id !== chamadoSelecionado.id)); toast.success('Excluído.'); setConfirmDeleteOpen(false); setChamadoSelecionado(null); } catch { toast.error('Erro ao excluir.'); } };
  const handleAbrirChamado = async (item) => { setChamadoSelecionado(item); setChamados(prev => prev.map(c => c.id === item.id ? { ...c, mensagensNaoLidas: 0 } : c)); try { await api.get(`${API_URL}/chamados/${item.id}`); } catch { console.error("Erro ao marcar lido"); } };

  // Socket
  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket', 'polling'], reconnection: true });
    socket.on('nova_interacao', (data) => {
      if (data.autor === 'CLIENTE') toast.info(`💬 Nova resposta: #${data.chamadoId}`);
      setChamados(prev => prev.map(c => { if (c.id === Number(data.chamadoId)) { const ex = c.interacoes?.some(i => i.id === data.id); if (ex) return c; return { ...c, mensagensNaoLidas: (data.autor === 'CLIENTE' && chamadoSelecionado?.id !== c.id) ? (c.mensagensNaoLidas || 0) + 1 : c.mensagensNaoLidas, interacoes: [...(c.interacoes || []), data] }; } return c; }));
      if (chamadoSelecionado?.id === data.chamadoId) setChamadoSelecionado(prev => prev.interacoes?.some(i => i.id === data.id) ? prev : { ...prev, interacoes: [...(prev.interacoes || []), data] });
    });
    socket.on('novo_chamado', (nc) => { toast.info(`🆕 Novo chamado!`); setChamados(prev => [nc, ...prev]); });
    socket.on('mudanca_status', (d) => { setChamados(prev => prev.map(c => c.id === d.id ? { ...c, ...d } : c)); if (chamadoSelecionado?.id === d.id) setChamadoSelecionado(prev => ({ ...prev, ...d })); });
    return () => socket.disconnect();
  }, [chamadoSelecionado]);

  const chamadosFiltrados = chamados.filter(c => { const t = busca.toLowerCase(); const match = c.nomeEmpresa.toLowerCase().includes(t) || c.id.toString().includes(t); return match && filtroStatus.includes(c.status) && (apenasNaoLidos ? c.mensagensNaoLidas > 0 : true) && (filtroResponsavel.length === 0 || filtroResponsavel.includes(c.responsavel)) && (filtroTags.length === 0 || c.tags?.some(tag => filtroTags.includes(tag.nome))); });

  return (
    <Box sx={{ p: 3, height: '90vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', marginTop: 5 }}>
      {/* HEADER & FILTROS */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">Fila de Chamados</Typography>
        <Box display="flex" gap={2}>
            <Button variant="outlined" onClick={() => setModalLinksOpen(true)}>Links</Button>
            <Button variant={mostrarFiltros?"contained":"outlined"} onClick={() => setMostrarFiltros(!mostrarFiltros)}><FilterListIcon/></Button>
            <Button variant="contained" color="secondary" onClick={() => navigate('/dashboard')}><BarChartIcon/></Button>
            <Button variant="outlined" onClick={() => setModalPerfilOpen(true)}><AccountCircleIcon/></Button>
            <Button variant="outlined" color="error" onClick={handleLogout}><LogoutIcon/></Button>
            <ToggleThemeButton />
        </Box>
      </Box>
      {mostrarFiltros && (<Paper sx={{ p: 2, mb: 3 }}><Grid container spacing={2}><Grid item xs={12} md={3}><TextField fullWidth size="small" placeholder="Buscar..." value={busca} onChange={e=>setBusca(e.target.value)}/></Grid><Grid item xs={12} md={2}><FormControl fullWidth size="small"><InputLabel>Status</InputLabel><Select multiple value={filtroStatus} onChange={e=>setFiltroStatus(typeof e.target.value==='string'?e.target.value.split(','):e.target.value)} renderValue={s=>s.map(v=>COLUMNS[v].title).join(', ')}>{Object.entries(COLUMNS).map(([k,c])=><MenuItem key={k} value={k}><Checkbox checked={filtroStatus.indexOf(k)>-1}/><MuiListItemText primary={c.title}/></MenuItem>)}</Select></FormControl></Grid><Grid item xs={12} md={2}><FormControl fullWidth size="small"><InputLabel>Responsável</InputLabel><Select multiple value={filtroResponsavel} onChange={e=>setFiltroResponsavel(typeof e.target.value==='string'?e.target.value.split(','):e.target.value)} renderValue={s=>s.join(', ')}>{[...new Set(chamados.map(c=>c.responsavel).filter(Boolean))].map(r=><MenuItem key={r} value={r}><Checkbox checked={filtroResponsavel.indexOf(r)>-1}/><MuiListItemText primary={r}/></MenuItem>)}</Select></FormControl></Grid><Grid item xs={6} md={1.5}><TextField fullWidth label="De" type="date" size="small" InputLabelProps={{shrink:true}} value={filtroDataInicio} onChange={e=>setFiltroDataInicio(e.target.value)}/></Grid><Grid item xs={6} md={1.5} display="flex" alignItems="center"><FormControlLabel control={<Switch checked={apenasNaoLidos} onChange={e=>setApenasNaoLidos(e.target.checked)} color="success"/>} label={<Typography variant="caption" fontWeight="bold">Ñ Lidos</Typography>}/><IconButton onClick={()=>{setBusca('');setFiltroStatus(Object.keys(COLUMNS));setFiltroResponsavel([]);setFiltroDataInicio('');setApenasNaoLidos(false);}}><ClearIcon/></IconButton></Grid></Grid></Paper>)}

      {/* KANBAN BOARD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 10, overflowX: 'auto', flexGrow: 1 }}>{Object.entries(COLUMNS).map(([cid, col]) => { const list = chamadosFiltrados.filter(c => c.status === cid); return (<Droppable key={cid} droppableId={cid}>{(prov, snap) => (<Paper ref={prov.innerRef} {...prov.droppableProps} elevation={0} sx={{ width: 350, minWidth: 350, bgcolor: snap.isDraggingOver ? '#e0e0e0' : (isDark?'#2e2e2e':'#ebecf0'), p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', maxHeight: '100%' }}><Box sx={{ mb: 2, pb: 1, borderBottom: `3px solid ${col.border}`, display: 'flex', justifyContent: 'space-between' }}><Box display="flex" gap={1} color={col.iconColor}>{col.icon}<Typography variant="h6">{col.title}</Typography></Box><Chip label={list.length} size="small"/></Box><Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>{list.map((item, idx) => (<Draggable key={item.id} draggableId={item.id.toString()} index={idx}>{(p, s) => {
            
            // 🟢 LÓGICA DE VISUALIZAÇÃO DE SLA NO CARD
            const horasAberto = calcularHorasAberto(item.createdAt);
            const slaEstourado = horasAberto >= 24 && item.status !== 'FINALIZADO';
            const corBorda = slaEstourado ? '#d32f2f' : PRIORITY_CONFIG[item.prioridade || 'BAIXA'].color;

            return (
            <Card ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} onClick={() => handleAbrirChamado(item)} sx={{ mb: 2, cursor: 'pointer', borderLeft: `5px solid ${corBorda}`, boxShadow: slaEstourado ? '0 0 5px rgba(211, 47, 47, 0.5)' : 1 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption">#{item.id}</Typography>
                    {item.responsavel && <Box display="flex" gap={1} bgcolor={item.responsavelCor+'15'} p={0.5} borderRadius={1}><Avatar sx={{ width: 20, height: 20, fontSize: 10, bgcolor: item.responsavelCor }}>{item.responsavel[0]}</Avatar><Typography variant="caption" color={item.responsavelCor}>{item.responsavel}</Typography></Box>}
                </Box>
                <Typography variant="subtitle1" fontWeight="bold">{item.nomeEmpresa}</Typography>
                
                {/* 🟢 ALERTA DE SLA ESTOURADO */}
                {slaEstourado && (
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5} mb={0.5} sx={{ color: '#d32f2f', bgcolor: '#ffebee', p: 0.5, borderRadius: 1 }}>
                        <WarningIcon fontSize="small" />
                        <Typography variant="caption" fontWeight="bold">SLA ESTOURADO (+24h)</Typography>
                    </Box>
                )}

                <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                    <Chip label={item.servico} size="small" sx={{ bgcolor: col.bg, color: '#1d1d1d', fontWeight: 'bold', fontSize: '0.75rem' }} />
                    {/* 🟢 TEMPO DE ABERTURA NO CARD */}
                    <Chip icon={<AccessTimeIcon style={{ fontSize: 14 }}/>} label={`${horasAberto}h`} size="small" sx={{ bgcolor: 'transparent', border: '1px solid #ccc', fontSize: '0.7rem' }} />
                    {item.tags?.map(t => <Chip key={t.id} label={t.nome} size="small" sx={{ bgcolor: t.cor, color: '#fff', height: 20, fontSize: 10 }} />)}
                </Box>
                {item.mensagensNaoLidas > 0 && <Box sx={{ position: 'absolute', bottom: 10, right: 10, width: 24, height: 24, borderRadius: '50%', bgcolor: 'green', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 10 }}>{item.mensagensNaoLidas}</Box>}
                </CardContent>
            </Card>
            )}}</Draggable>))}{prov.placeholder}</Box></Paper>)}</Droppable>); })}</Box>
      </DragDropContext>

      {/* --- MODAL DETALHES --- */}
      <Dialog open={Boolean(chamadoSelecionado)} onClose={() => setChamadoSelecionado(null)} maxWidth="md" fullWidth>
        {chamadoSelecionado && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}><Box display="flex" gap={2}><Typography variant="h6">#{chamadoSelecionado.id}</Typography><Chip label={COLUMNS[chamadoSelecionado.status]?.title} sx={{ bgcolor: COLUMNS[chamadoSelecionado.status]?.bg, color: '#000 !important' }} /></Box><IconButton onClick={() => setChamadoSelecionado(null)}><CloseIcon /></IconButton></DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{ height: '100%' }}>
                <Grid item xs={12} md={8} display="flex" flexDirection="column">
                  <Box sx={{ flexGrow: 1, bgcolor: isDark?'rgba(0,0,0,0.2)':'#f9f9f9', borderRadius: 2, p: 2, mb: 2, border: '1px solid', borderColor: 'divider', maxHeight: '400px', overflowY: 'auto'}}>
                    
                    {/* ABERTURA: COM ANEXOS E ÁUDIO INICIAIS */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                        <Box display="flex" gap={1} mb={0.5}><Avatar sx={{ width: 24, height: 24 }}><PersonIcon fontSize="small" /></Avatar><Typography variant="caption" fontWeight="bold">Abertura</Typography></Box>
                        <Paper sx={{ p: 2, maxWidth: '90%', borderRadius: '0 12px 12px 12px' }}>
                            <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>{chamadoSelecionado.descricao}</Typography>
                            {chamadoSelecionado.anexos && chamadoSelecionado.anexos.length > 0 && (
                                <Box mt={1} pt={1} borderTop="1px solid rgba(0,0,0,0.1)">
                                    {chamadoSelecionado.anexos.map(anexo => {
                                        const isAudio = anexo.nomeArquivo.match(/\.(mp3|wav|webm|ogg)$/i);
                                        const url = anexo.caminho.startsWith('http') ? anexo.caminho : `${API_URL}/uploads/${anexo.nomeArquivo}`;
                                        if (isAudio) return (<Box key={anexo.id} mt={1} display="flex" gap={1} alignItems="center"><Avatar sx={{width:24,height:24,bgcolor:'#9c27b0'}}><MicIcon style={{fontSize:14}}/></Avatar><audio controls src={url} style={{height:35,maxWidth:250}}/></Box>);
                                        return <Chip key={anexo.id} icon={<AttachIcon />} label={anexo.nomeOriginal} component="a" href={url} target="_blank" clickable size="small" sx={{ m: 0.5 }} />;
                                    })}
                                </Box>
                            )}
                        </Paper>
                    </Box>

                    {/* CHAT */}
                    {chamadoSelecionado.interacoes?.map((msg, idx) => {
                      const isSup = msg.autor === 'SUPORTE';
                      return (
                        <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: isSup ? 'flex-end' : 'flex-start', mb: 2 }}>
                            <Box display="flex" gap={1} mb={0.5} flexDirection={isSup ? 'row-reverse' : 'row'}><Avatar sx={{ width: 24, height: 24, bgcolor: isSup ? '#1976d2' : '#9e9e9e' }}>{isSup ? <SupportAgentIcon fontSize="small"/> : <PersonIcon fontSize="small"/>}</Avatar><Typography variant="caption" fontWeight="bold">{isSup ? 'Suporte' : 'Cliente'}</Typography></Box>
                            <Paper sx={{ p: 2, bgcolor: msg.interno ? '#FFF3E0' : (isSup ? (isDark?'#1e3a5f':'#E3F2FD') : 'background.paper'), borderRadius: isSup ? '12px 0 12px 12px' : '0 12px 12px 12px', maxWidth: '90%' }}>
                                {msg.interno && <Box display="flex" gap={0.5} color="warning.main"><LockIcon fontSize="small"/><Typography variant="caption" fontWeight="bold">NOTA INTERNA</Typography></Box>}
                                <Typography variant="body2">{msg.texto}</Typography>
                                {msg.anexos && msg.anexos.length > 0 && (<Box mt={1} pt={1} borderTop="1px solid rgba(0,0,0,0.1)">{msg.anexos.map(anexo => {
                                    const isAudio = anexo.nomeArquivo.match(/\.(mp3|wav|webm|ogg)$/i);
                                    const url = anexo.caminho.startsWith('http') ? anexo.caminho : `${API_URL}/uploads/${anexo.nomeArquivo}`;
                                    if (isAudio) return (<Box key={anexo.id} mt={1} display="flex" gap={1} alignItems="center"><Avatar sx={{width:24,height:24,bgcolor:'#9c27b0'}}><MicIcon style={{fontSize:14}}/></Avatar><audio controls src={url} style={{height:35,maxWidth:250}}/></Box>);
                                    return (<Chip key={anexo.id} icon={<AttachIcon />} label={anexo.nomeOriginal} component="a" href={url} target="_blank" clickable size="small" sx={{ m: 0.5 }} />);
                                })}</Box>)}
                            </Paper>
                        </Box>
                      )
                    })}
                  </Box>
                  <Box>
                    <Box display="flex" justifyContent="flex-end" mb={1}><FormControlLabel control={<Switch checked={notaInterna} onChange={e=>setNotaInterna(e.target.checked)} color="warning" size="small" />} label={<Typography variant="caption" color={notaInterna?"warning.main":"text.secondary"} fontWeight="bold">Nota Interna</Typography>}/></Box>
                    {files.length > 0 && <Box mb={1} display="flex" gap={1} flexWrap="wrap">{files.map((f, i) => <Chip key={i} label={f.name} onDelete={() => removeFile(i)} icon={f.type.includes('audio')?<MicIcon/>:<AttachIcon/>} />)}</Box>}
                    <Box display="flex" gap={1} alignItems="flex-end"><input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} /><IconButton onClick={() => fileInputRef.current?.click()}><AttachIcon /></IconButton><IconButton onClick={(e) => setAnchorElMacros(e.currentTarget)}><BoltIcon /></IconButton>
                    <AudioRecorder onAudioReady={handleAudioRecorded} />
                    <TextField fullWidth size="small" multiline maxRows={3} placeholder={notaInterna?"Nota interna...":"Responder..."} value={novoComentario} onChange={e=>setNovoComentario(e.target.value)} sx={{ bgcolor: notaInterna ? (isDark?'rgba(237,108,2,0.15)':'#FFF3E0') : 'background.paper' }} />
                    <Button variant="contained" onClick={handleAddInteracao} disabled={enviandoComentario} color={notaInterna?"warning":"primary"}><SendIcon /></Button></Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Box mb={3}><Typography variant="subtitle2" color="text.secondary">Empresa</Typography><Typography variant="h6" fontWeight="bold">{chamadoSelecionado.nomeEmpresa}</Typography></Box>
                    <Box mb={3}><Typography variant="subtitle2" color="text.secondary">Atribuído a</Typography>
                    <Autocomplete options={equipe} getOptionLabel={o=>o.nome||o} value={equipe.find(u=>u.nome===chamadoSelecionado.responsavel)||(chamadoSelecionado.responsavel?{nome:chamadoSelecionado.responsavel}:null)} onChange={(e,v)=>handleTrocarResponsavel(v)} renderOption={(p,o)=><li {...p}><Box display="flex" gap={1}><Avatar sx={{width:24,height:24,bgcolor:o.cor,fontSize:12}}>{o.nome[0]}</Avatar><Typography>{o.nome}</Typography></Box></li>} renderInput={p=><TextField {...p} size="small" placeholder="Responsável..." />} /></Box>
                    <Box mb={3}><Typography variant="subtitle2" color="text.secondary">SLA</Typography><Select fullWidth size="small" value={chamadoSelecionado.prioridade||'BAIXA'} onChange={e=>handleChangePriority(e.target.value)}>{Object.entries(PRIORITY_CONFIG).map(([k,c])=><MenuItem key={k} value={k} sx={{color:c.color}}>{c.icon} {c.label}</MenuItem>)}</Select></Box>
                    <Box mb={3}><Typography variant="subtitle2" color="text.secondary">Tags</Typography><Autocomplete multiple options={todasTags} getOptionLabel={o=>o.nome} value={chamadoSelecionado.tags||[]} onChange={(e,v)=>handleSalvarTags(v)} renderInput={p=><TextField {...p} size="small" placeholder="Tags..."/>} renderTags={(v,gp)=>v.map((o,i)=><Chip label={o.nome} size="small" {...gp({index:i})} sx={{bgcolor:o.cor,color:'#fff'}}/>)} /></Box>
                    <Button fullWidth variant="outlined" onClick={()=>setModalGerenciarTagsOpen(true)}>Gerenciar Tags</Button>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'space-between', borderTop: 1, borderColor: 'divider' }}><Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDeleteOpen(true)}>Excluir</Button>{chamadoSelecionado.status !== 'FINALIZADO' && <Button variant="contained" color="secondary" onClick={handleNextStep}>Próxima Etapa</Button>}</DialogActions>
          </>
        )}
      </Dialog>
      
      {/* 🟢 MODAL DE RESUMO DE SLA AO LOGAR */}
      <Dialog open={modalSlaOpen} onClose={() => setModalSlaOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
            <WarningIcon /> Atenção: SLA Crítico
        </DialogTitle>
        <DialogContent>
            <Typography variant="body1" gutterBottom>
                Olá, <strong>{user?.nome || 'Admin'}</strong>.
            </Typography>
            <Typography variant="body2" paragraph>
                Identificamos que existem <strong>{metricasSla.estourados}</strong> chamados que excederam o tempo limite de 24 horas sem resolução.
            </Typography>
            <Box bgcolor="#ffebee" p={2} borderRadius={1} border="1px solid #ffcdd2">
                <Typography variant="caption" fontWeight="bold" color="error">
                    Total Pendente: {metricasSla.totalAbertos} | SLA Estourado: {metricasSla.estourados}
                </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Recomendamos verificar o Dashboard para uma análise detalhada de performance.
            </Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setModalSlaOpen(false)} color="inherit">Fechar</Button>
            <Button variant="contained" color="primary" onClick={() => navigate('/dashboard')} startIcon={<BarChartIcon />}>
                Ir para Dashboard
            </Button>
        </DialogActions>
      </Dialog>

      <UserProfileModal open={modalPerfilOpen} onClose={() => setModalPerfilOpen(false)} />
      <Dialog open={modalGerenciarTagsOpen} onClose={()=>setModalGerenciarTagsOpen(false)}><DialogContent><List>{todasTags.map(t=><ListItem key={t.id}><Chip label={t.nome} sx={{bgcolor:t.cor,color:'#fff'}}/></ListItem>)}</List></DialogContent></Dialog>
      <Popover open={Boolean(anchorElMacros)} anchorEl={anchorElMacros} onClose={()=>setAnchorElMacros(null)}><Box p={2}><List>{respostasProntas.map(m=><ListItem button key={m.id} onClick={()=>{setNovoComentario(m.texto);setAnchorElMacros(null)}}><ListItemText primary={m.titulo}/></ListItem>)}</List></Box></Popover>
      <Dialog open={confirmDeleteOpen} onClose={()=>setConfirmDeleteOpen(false)}><DialogTitle>Excluir?</DialogTitle><DialogActions><Button onClick={()=>setConfirmDeleteOpen(false)}>Não</Button><Button color="error" onClick={handleDeleteChamado}>Sim</Button></DialogActions></Dialog>
    </Box>
  );
}