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
import MicIcon from '@mui/icons-material/Mic'; // 👈 IMPORTANTE: Ícone de Microfone
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
import AudioRecorder from './AudioRecorder'; // 👈 IMPORTANTE: Componente de Gravar Audio

// --- CONFIGURAÇÃO DAS COLUNAS ---
const COLUMNS = {
  NOVO: { 
    id: 'NOVO', 
    title: 'Novos', 
    icon: <InboxIcon />, 
    bg: '#E3F2FD', 
    border: '#2196F3',
    iconColor: '#1976d2' 
  },
  EM_ATENDIMENTO: { 
    id: 'EM_ATENDIMENTO', 
    title: 'Em Atendimento', 
    icon: <LoopIcon />, 
    bg: '#FFF3E0', 
    border: '#FF9800',
    iconColor: '#f57c00' 
  },
  FINALIZADO: { 
    id: 'FINALIZADO', 
    title: 'Finalizados', 
    icon: <TaskAltIcon />, 
    bg: '#E8F5E9', 
    border: '#4CAF50',
    iconColor: '#2e7d32' 
  }
};

// --- CONFIGURAÇÃO DE SLA / PRIORIDADE ---
const PRIORITY_CONFIG = {
  BAIXA:   { label: 'Baixa',   color: '#4CAF50', icon: <LowPriorityIcon fontSize="small"/> }, 
  MEDIA:   { label: 'Média',   color: '#2196F3', icon: <LowPriorityIcon fontSize="small"/> }, 
  ALTA:    { label: 'Alta',    color: '#FF9800', icon: <PriorityHighIcon fontSize="small"/> }, 
  CRITICA: { label: 'Crítica', color: '#F44336', icon: <PriorityHighIcon fontSize="small"/> }  
};

const TAG_COLORS = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
    '#FF5722', '#795548', '#9E9E9E', '#607D8B'
];

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

function stringToColor(string) {
  if (!string) return '#999';
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

export default function KanbanBoardView() {

  const theme = useTheme(); 
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate(); 
  const [chamados, setChamados] = useState([]);
  const { logout, user } = useAuth();
  
  // ✅ ESTADO DA EQUIPE
  const [equipe, setEquipe] = useState([]);

  // --- ESTADOS DE FILTRO ---
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState(Object.keys(COLUMNS)); 
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [apenasNaoLidos, setApenasNaoLidos] = useState(false);
  const [filtroResponsavel, setFiltroResponsavel] = useState([]);
  const [filtroTags, setFiltroTags] = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false); 
  const [modalPerfilOpen, setModalPerfilOpen] = useState(false);
  
  // --- ESTADOS DE UI ---
  const [modalLinksOpen, setModalLinksOpen] = useState(false);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false); 

  // --- CHAT E ARQUIVOS ---
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [files, setFiles] = useState([]); 
  const [notaInterna, setNotaInterna] = useState(false);
  const fileInputRef = useRef(null); 

  // --- MACROS ---
  const [respostasProntas, setRespostasProntas] = useState([]);
  const [anchorElMacros, setAnchorElMacros] = useState(null); 
  const [modalMacrosOpen, setModalMacrosOpen] = useState(false); 
  const [novaMacro, setNovaMacro] = useState({ titulo: '', texto: '' });

  // --- TAGS (ETIQUETAS) ---
  const [todasTags, setTodasTags] = useState([]);
  const [modalCriarTagOpen, setModalCriarTagOpen] = useState(false);
  const [modalGerenciarTagsOpen, setModalGerenciarTagsOpen] = useState(false); 
  const [novaTagData, setNovaTagData] = useState({ nome: '', cor: TAG_COLORS[5] });
  
  // ESTADO: Qual tag está sendo editada
  const [editandoTagId, setEditandoTagId] = useState(null);

  const handleLogout = () => {
    logout(); 
    toast.info('Você saiu do sistema.');
    navigate('/login');
  };

  useEffect(() => {
    carregarChamados();
    carregarMacros(); 
    carregarTags(); 
    carregarUsuarios(); // ✅ Carrega a equipe ao iniciar
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

  // ✅ NOVA FUNÇÃO: BUSCAR USUÁRIOS DO BACKEND
  const carregarUsuarios = async () => {
    try {
        const { data } = await api.get('/auth/users');
        const listaFormatada = data.map(u => ({
            id: u.id,
            nome: u.nome,
            cor: u.cor || stringToColor(u.nome)
        }));
        setEquipe(listaFormatada);
    } catch (error) {
        console.error("Erro ao carregar equipe:", error);
    }
  };

  // --- LÓGICA DE TAGS ---
  const carregarTags = async () => {
    try {
      const { data } = await api.get(`${API_URL}/chamados/tags/list`);
      setTodasTags(data);
    } catch (error) {
      console.error("Erro ao carregar tags");
    }
  };

  const handleSalvarTags = async (novasTags) => {
    setChamadoSelecionado(prev => ({ ...prev, tags: novasTags }));
    setChamados(prev => prev.map(c => c.id === chamadoSelecionado.id ? { ...c, tags: novasTags } : c));

    const tagIds = novasTags.map(t => t.id);
    try {
        await api.patch(`${API_URL}/chamados/${chamadoSelecionado.id}/tags`, { tagIds });
    } catch (error) {
        toast.error("Erro ao salvar tags.");
    }
  };

  const handleInitiateCriarTag = (nome) => {
      setNovaTagData({ nome, cor: TAG_COLORS[5] }); 
      setModalCriarTagOpen(true);
  };

  const handleConfirmarCriacaoTag = async () => {
    if (!novaTagData.nome) return;
    try {
        const { data: novaTag } = await api.post(`${API_URL}/chamados/tags`, novaTagData);
        setTodasTags(prev => [...prev, novaTag]);
        const tagsAtuais = chamadoSelecionado.tags || [];
        handleSalvarTags([...tagsAtuais, novaTag]);
        toast.success("Tag criada com sucesso!");
        setModalCriarTagOpen(false); 
    } catch (error) {
        toast.error("Erro ao criar tag.");
    }
  };

  const handleUpdateCorTag = async (id, novaCor) => {
      try {
          await api.patch(`${API_URL}/chamados/tags/${id}`, { cor: novaCor });
          setTodasTags(prev => prev.map(t => t.id === id ? { ...t, cor: novaCor } : t));
          setChamados(prev => prev.map(c => {
              if (c.tags && c.tags.some(t => t.id === id)) {
                  return { ...c, tags: c.tags.map(t => t.id === id ? { ...t, cor: novaCor } : t) };
              }
              return c;
          }));
          if (chamadoSelecionado && chamadoSelecionado.tags) {
              setChamadoSelecionado(prev => ({ ...prev, tags: prev.tags.map(t => t.id === id ? { ...t, cor: novaCor } : t) }));
          }
          setEditandoTagId(null); 
          toast.success("Cor atualizada!");
      } catch (error) {
          toast.error("Erro ao atualizar cor.");
      }
  };

  const handleDeleteTag = async (id) => {
      try {
          await api.delete(`${API_URL}/chamados/tags/${id}`);
          setTodasTags(prev => prev.filter(t => t.id !== id));
          if (chamadoSelecionado && chamadoSelecionado.tags) {
              const novasTags = chamadoSelecionado.tags.filter(t => t.id !== id);
              if (novasTags.length !== chamadoSelecionado.tags.length) {
                  setChamadoSelecionado(prev => ({ ...prev, tags: novasTags }));
                  setChamados(prev => prev.map(c => c.id === chamadoSelecionado.id ? { ...c, tags: novasTags } : c));
              }
          }
          toast.success("Tag excluída!");
      } catch (error) {
          toast.error("Erro ao excluir tag.");
      }
  };

  // --- MACROS ---
  const carregarMacros = async () => {
    try {
      const { data } = await api.get(`${API_URL}/respostas-prontas`);
      setRespostasProntas(data);
    } catch (error) { console.error("Erro macros"); }
  };

  const handleCriarMacro = async () => {
    if (!novaMacro.titulo || !novaMacro.texto) return toast.warning("Preencha título e texto!");
    try {
      await api.post(`${API_URL}/respostas-prontas`, novaMacro);
      toast.success("Resposta salva!");
      setNovaMacro({ titulo: '', texto: '' });
      carregarMacros(); 
    } catch (error) { toast.error("Erro ao salvar macro."); }
  };

  const handleDeleteMacro = async (id) => {
    try {
      await api.delete(`${API_URL}/respostas-prontas/${id}`);
      carregarMacros();
      toast.success("Resposta removida.");
    } catch (error) { toast.error("Erro ao excluir."); }
  };

  const handleUsarMacro = (texto) => {
    setNovoComentario(texto); 
    setAnchorElMacros(null); 
  };

  // --- SLA / STATUS / RESPONSAVEL ---
  const handleChangePriority = async (novaPrioridade) => {
    try {
        setChamadoSelecionado(prev => ({ ...prev, prioridade: novaPrioridade }));
        setChamados(prev => prev.map(c => c.id === chamadoSelecionado.id ? { ...c, prioridade: novaPrioridade } : c));
        await api.patch(`${API_URL}/chamados/${chamadoSelecionado.id}/status`, { prioridade: novaPrioridade });
        toast.success(`Prioridade alterada para ${PRIORITY_CONFIG[novaPrioridade].label}`);
    } catch (error) { toast.error("Erro ao mudar prioridade"); }
  };

  // ✅ FUNÇÃO PARA TROCAR O RESPONSÁVEL
  const handleTrocarResponsavel = async (novoResponsavel) => {
    if (!chamadoSelecionado) return;
    const nome = novoResponsavel ? (novoResponsavel.nome || novoResponsavel) : null;
    const cor = novoResponsavel ? (novoResponsavel.cor || '#999') : null;

    try {
        setChamadoSelecionado(prev => ({ ...prev, responsavel: nome, responsavelCor: cor }));
        setChamados(prev => prev.map(c => c.id === chamadoSelecionado.id ? { ...c, responsavel: nome, responsavelCor: cor } : c));
        await api.patch(`${API_URL}/chamados/${chamadoSelecionado.id}/responsavel`, { responsavel: nome, responsavelCor: cor });
        toast.success(`Responsável alterado para ${nome || 'Ninguém'}`);
    } catch (error) {
        toast.error("Erro ao alterar responsável.");
        console.error(error);
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

  const handleDeleteChamado = async () => {
    if (!chamadoSelecionado) return;
    try {
      await api.delete(`${API_URL}/chamados/${chamadoSelecionado.id}`);
      setChamados((prev) => prev.filter(c => c.id !== chamadoSelecionado.id));
      toast.success('Chamado excluído com sucesso.');
      setConfirmDeleteOpen(false);
      setChamadoSelecionado(null);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir chamado.');
    }
  };

  const handleAbrirChamado = async (item) => {
    setChamadoSelecionado(item);
    setChamados(prev => prev.map(c => c.id === item.id ? { ...c, mensagensNaoLidas: 0 } : c));
    try {
        await api.get(`${API_URL}/chamados/${item.id}`); 
    } catch (error) { console.error("Erro ao marcar lido", error); }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // ✅ Função que recebe o áudio do AudioRecorder
  const handleAudioRecorded = (audioFile) => {
    setFiles((prev) => [...prev, audioFile]);
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
    if (notaInterna) formData.append('interno', 'true');
    // ✅ Campo deve ser 'files'
    files.forEach((file) => formData.append('files', file));

    try {
      await api.post(`${API_URL}/chamados/${chamadoSelecionado.id}/interacoes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNovoComentario('');
      setFiles([]);
      setNotaInterna(false); 
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success(notaInterna ? 'Nota interna adicionada!' : 'Mensagem enviada!');
    } catch (error) { toast.error('Erro ao enviar mensagem.'); } finally { setEnviandoComentario(false); }
  };

  const responsaveisUnicos = [...new Set(chamados.map(c => c.responsavel).filter(Boolean))];

  const chamadosFiltrados = chamados.filter((c) => {
    const termo = busca.toLowerCase();
    const matchTexto = 
      c.nomeEmpresa.toLowerCase().includes(termo) ||
      c.id.toString().includes(termo) ||
      c.servico.toLowerCase().includes(termo) ||
      c.descricao.toLowerCase().includes(termo);
    const matchStatus = filtroStatus.includes(c.status);
    const matchNaoLidos = apenasNaoLidos ? c.mensagensNaoLidas > 0 : true;
    const matchResponsavel = filtroResponsavel.length === 0 || filtroResponsavel.includes(c.responsavel);
    const matchTags = filtroTags.length === 0 || (c.tags && c.tags.some(tag => filtroTags.includes(tag.nome)));
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
    return matchTexto && matchStatus && matchNaoLidos && matchResponsavel && matchTags && matchData;
  });

  const limparFiltros = () => {
      setBusca('');
      setFiltroStatus(Object.keys(COLUMNS));
      setFiltroResponsavel([]);
      setFiltroTags([]);
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
        toast.info(`💬 Nova resposta no chamado #${data.chamadoId}`, { position: "top-right", theme: "colored" });
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
           return { ...c, mensagensNaoLidas: novasNaoLidas, interacoes: [...(c.interacoes || []), data] };
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
      toast.info(`🆕 Novo chamado de ${novoChamado.nomeEmpresa}!`, { position: "top-center", theme: "colored" });
      setChamados((prev) => [novoChamado, ...prev]);
    });

    socket.on('mudanca_status', (data) => {
      setChamados((prev) => prev.map(chamado => {
        if (chamado.id === data.id) {
          return { 
              ...chamado, 
              status: data.status || chamado.status,
              prioridade: data.prioridade || chamado.prioridade, 
              responsavel: data.responsavel || chamado.responsavel,
              responsavelCor: data.responsavelCor || chamado.responsavelCor,
              tags: data.tags || chamado.tags 
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
             responsavelCor: data.responsavelCor || prev.responsavelCor,
             tags: data.tags || prev.tags
         } : null);
      }
    });

    return () => { socket.disconnect(); };
  }, [chamadoSelecionado]);

  return (
    <Box sx={{ p: 3, height: '90vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', marginTop: 5}}>
      
      {/* CABEÇALHO */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Fila de Chamados
        </Typography>

        <Box display="flex" gap={2}>
          <Button variant="outlined" color="primary" startIcon={<LinkIcon />} onClick={() => setModalLinksOpen(true)}>Links Úteis</Button>
          <Button variant={mostrarFiltros ? "contained" : "outlined"} onClick={() => setMostrarFiltros(!mostrarFiltros)} startIcon={<FilterListIcon />}>Filtros</Button>
          <Button variant="contained" color="secondary" startIcon={<BarChartIcon />} onClick={() => navigate('/dashboard')}>Relatórios</Button>
          <Button variant="outlined" color="primary" startIcon={<AccountCircleIcon />} onClick={() => setModalPerfilOpen(true)}>Minha Conta</Button>
          <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ fontWeight: 'bold' }}>Sair</Button>
          <ToggleThemeButton />
        </Box>
      </Box>

      {/* PAINEL DE FILTROS */}
      {mostrarFiltros && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}><TextField fullWidth variant="outlined" placeholder="Buscar..." size="small" value={busca} onChange={(e) => setBusca(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }} /></Grid>
                <Grid item xs={12} md={2}><FormControl size="small" fullWidth><InputLabel>Status</InputLabel><Select multiple value={filtroStatus} label="Status" onChange={(e) => { const value = e.target.value; setFiltroStatus(typeof value === 'string' ? value.split(',') : value); }} renderValue={(selected) => selected.map(val => COLUMNS[val].title.split(' ')[1]).join(', ')}>{Object.entries(COLUMNS).map(([key, col]) => (<MenuItem key={key} value={key}><Checkbox checked={filtroStatus.indexOf(key) > -1} /><MuiListItemText primary={col.title} /></MenuItem>))}</Select></FormControl></Grid>
                <Grid item xs={12} md={2}><FormControl size="small" fullWidth><InputLabel>Responsável</InputLabel><Select multiple value={filtroResponsavel} label="Responsável" onChange={(e) => { const value = e.target.value; setFiltroResponsavel(typeof value === 'string' ? value.split(',') : value); }} renderValue={(selected) => selected.join(', ')}>{responsaveisUnicos.map((resp) => (<MenuItem key={resp} value={resp}><Checkbox checked={filtroResponsavel.indexOf(resp) > -1} /><MuiListItemText primary={resp} /></MenuItem>))}</Select></FormControl></Grid>
                <Grid item xs={12} md={2}><FormControl size="small" fullWidth><InputLabel>Tags</InputLabel><Select multiple value={filtroTags} label="Tags" onChange={(e) => { const value = e.target.value; setFiltroTags(typeof value === 'string' ? value.split(',') : value); }} renderValue={(selected) => selected.join(', ')}>{todasTags.map((tag) => (<MenuItem key={tag.id} value={tag.nome}><Checkbox checked={filtroTags.indexOf(tag.nome) > -1} /><Chip label={tag.nome} size="small" sx={{ bgcolor: tag.cor, color: '#fff', height: 20, fontSize: '0.65rem' }} /></MenuItem>))}</Select></FormControl></Grid>
                <Grid item xs={6} md={1.5}><TextField fullWidth label="De" type="date" size="small" InputLabelProps={{ shrink: true }} value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} /></Grid>
                <Grid item xs={6} md={1.5} display="flex" alignItems="center" justifyContent="space-between"><FormControlLabel control={<Switch checked={apenasNaoLidos} onChange={(e) => setApenasNaoLidos(e.target.checked)} color="success" />} label={<Typography variant="caption" fontWeight="bold">Ñ Lidos</Typography>} /><IconButton onClick={limparFiltros} title="Limpar Filtros" size="small"><ClearIcon /></IconButton></Grid>
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
                  <Paper ref={provided.innerRef} {...provided.droppableProps} elevation={0} sx={{ width: 350, minWidth: 350, backgroundColor: snapshot.isDraggingOver ? '#e0e0e0' : (isDark ? '#2e2e2e' : '#ebecf0'), p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
                    <Box sx={{ mb: 2, pb: 1, borderBottom: `3px solid ${column.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <Box display="flex" alignItems="center" gap={1.5}><Box sx={{ color: column.iconColor, display: 'flex' }}>{column.icon}</Box><Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{column.title}</Typography></Box>
                         <Chip label={cardsDaColuna.length} size="small" sx={{ fontWeight: 'bold', bgcolor: 'rgba(0,0,0,0.08)', color: 'text.secondary' }} />
                    </Box>
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                      {cardsDaColuna.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                          {(provided, snapshot) => {
                            const prioridadeInfo = PRIORITY_CONFIG[item.prioridade || 'BAIXA'];
                            return (
                            <Card ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => handleAbrirChamado(item)} sx={{ mb: 2, borderRadius: 2, cursor: 'pointer', boxShadow: snapshot.isDragging ? 6 : 1, transition: 'transform 0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }, position: 'relative', borderLeft: `5px solid ${prioridadeInfo.color}` }}>
                              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                  <Typography variant="caption" color="text.secondary">#{item.id}</Typography>
                                  {item.responsavel && (<Box display="flex" alignItems="center" gap={1} sx={{ bgcolor: `${item.responsavelCor || '#1976d2'}15`, p: 0.5, borderRadius: 1, maxWidth: '140px' }}><Avatar sx={{ width: 20, height: 20, fontSize: 10, bgcolor: item.responsavelCor || '#1976d2', color: '#fff' }}>{item.responsavel.charAt(0).toUpperCase()}</Avatar><Typography variant="caption" fontWeight="bold" noWrap sx={{ color: item.responsavelCor || '#1976d2' }}>{item.responsavel}</Typography></Box>)}
                                  <Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</Typography>
                                </Box>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{item.nomeEmpresa}</Typography>
                                <Box display="flex" gap={1} mb={1} flexWrap="wrap"><Chip label={item.servico} size="small" sx={{ bgcolor: column.bg, color: '#1d1d1d', fontWeight: 'bold', fontSize: '0.75rem' }} />{item.prioridade === 'CRITICA' && (<Chip label="URGENTE" size="small" sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ffcdd2' }} />)}</Box>
                                <Box display="flex" gap={0.5} mb={1} flexWrap="wrap">{item.tags?.map(tag => (<Chip key={tag.id} label={tag.nome} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: tag.cor + '20', color: tag.cor, fontWeight: 'bold', border: `1px solid ${tag.cor}` }} />))}</Box>
                                <Typography variant="body2" color="text.secondary" noWrap>{item.descricao}</Typography>
                                {item.mensagensNaoLidas > 0 && (<Box sx={{ position: 'absolute', bottom: 12, right: 12, width: 24, height: 24, borderRadius: '50%', backgroundColor: '#2e7d32', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: 2, zIndex: 10 }}>{item.mensagensNaoLidas}</Box>)}
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

      {/* --- MODAL DETALHES --- */}
      <Dialog open={Boolean(chamadoSelecionado)} onClose={() => setChamadoSelecionado(null)} maxWidth="md" fullWidth>
        {chamadoSelecionado && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6">Chamado #{chamadoSelecionado.id}</Typography>
                <Chip 
                  label={COLUMNS[chamadoSelecionado.status]?.title || chamadoSelecionado.status} 
                  sx={{ 
                      bgcolor: COLUMNS[chamadoSelecionado.status]?.bg || '#eee', 
                      color: '#000000 !important', 
                      fontWeight: 'bold',
                      '& .MuiChip-label': { color: '#000000 !important' }
                  }} 
                />
              </Box>
              <IconButton onClick={() => setChamadoSelecionado(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{ height: '100%' }}>
                <Grid item xs={12} md={8} display="flex" flexDirection="column">
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Histórico do Chamado</Typography>
                  <Box sx={{ flexGrow: 1, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#f9f9f9', borderRadius: 2, p: 2, mb: 2, border: '1px solid', borderColor: 'divider', maxHeight: '400px', overflowY: 'auto'}}>
                    
                    {/* ✅ ABERTURA: COM ANEXOS E ÁUDIO */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}><Avatar sx={{ width: 24, height: 24, bgcolor: '#9e9e9e' }}><PersonIcon fontSize="small" /></Avatar><Typography variant="caption" fontWeight="bold">Cliente (Abertura)</Typography><Typography variant="caption" color="text.secondary">{new Date(chamadoSelecionado.createdAt).toLocaleString()}</Typography></Box>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '0 12px 12px 12px', maxWidth: '90%' }}>
                            <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>{chamadoSelecionado.descricao}</Typography>
                            
                            {/* 🔥 EXIBIÇÃO DE ANEXOS DA ABERTURA */}
                            {chamadoSelecionado.anexos && chamadoSelecionado.anexos.length > 0 && (
                                <Box mt={1} pt={1} borderTop="1px solid rgba(0,0,0,0.1)">
                                    {chamadoSelecionado.anexos.map(anexo => {
                                        const isAudio = anexo.nomeArquivo.match(/\.(mp3|wav|webm|ogg)$/i);
                                        const url = anexo.caminho.startsWith('http') ? anexo.caminho : `${API_URL}/uploads/${anexo.nomeArquivo}`;
                                        
                                        if (isAudio) {
                                            return (
                                                <Box key={anexo.id} mt={1} display="flex" alignItems="center" gap={1}>
                                                    <Avatar sx={{ width: 24, height: 24, bgcolor: '#9c27b0' }}>
                                                        <MicIcon style={{ fontSize: 14 }} />
                                                    </Avatar>
                                                    <audio controls src={url} style={{ height: 36, maxWidth: '250px' }} />
                                                </Box>
                                            );
                                        }
                                        return (
                                            <Chip 
                                                key={anexo.id} 
                                                icon={<AttachIcon />} 
                                                label={anexo.nomeOriginal.length > 20 ? anexo.nomeOriginal.substring(0, 17) + '...' : anexo.nomeOriginal} 
                                                component="a" 
                                                href={url} 
                                                target="_blank" 
                                                clickable 
                                                size="small" 
                                                sx={{ m: 0.5, bgcolor: 'rgba(0,0,0,0.05)' }} 
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                        </Paper>
                    </Box>

                    {chamadoSelecionado.interacoes?.map((interacao, idx) => {
                      const isSuporte = interacao.autor === 'SUPORTE';
                      const isInterno = interacao.interno; 
                      return (<Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: isSuporte ? 'flex-end' : 'flex-start', mb: 2 }}><Box display="flex" alignItems="center" gap={1} mb={0.5} flexDirection={isSuporte ? 'row-reverse' : 'row'}> <Avatar sx={{ width: 24, height: 24, bgcolor: isSuporte ? '#1976d2' : '#9e9e9e' }}>{isSuporte ? <SupportAgentIcon fontSize="small" /> : <PersonIcon fontSize="small" />}</Avatar><Typography variant="caption" fontWeight="bold">{isSuporte ? 'Suporte' : 'Cliente'}</Typography><Typography variant="caption" color="text.secondary">{new Date(interacao.createdAt).toLocaleString()}</Typography></Box><Paper elevation={0} sx={{ p: 2, bgcolor: isInterno ? (isDark ? 'rgba(237, 108, 2, 0.15)' : '#FFF3E0') : (isSuporte ? (isDark ? 'rgba(25, 118, 210, 0.15)' : '#E3F2FD') : 'background.paper'), border: isInterno ? '1px dashed #FF9800' : (isSuporte ? 'none' : '1px solid'), borderColor: 'divider', borderRadius: isSuporte ? '12px 0 12px 12px' : '0 12px 12px 12px', maxWidth: '90%', color: 'text.primary'}}>{isInterno && (<Box display="flex" alignItems="center" gap={0.5} mb={0.5} color="warning.main"><LockIcon style={{ fontSize: 14 }} /><Typography variant="caption" fontWeight="bold">NOTA INTERNA (Cliente não vê)</Typography></Box>)}<Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>{interacao.texto}</Typography>
                      
                      {/* 🔥 EXIBIÇÃO DE ANEXOS DAS INTERAÇÕES */}
                      {interacao.anexos && interacao.anexos.length > 0 && (<Box mt={1} pt={1} borderTop="1px solid rgba(0,0,0,0.1)">{interacao.anexos.map(anexo => {
                          const isAudio = anexo.nomeArquivo.match(/\.(mp3|wav|webm|ogg)$/i);
                          const url = anexo.caminho.startsWith('http') ? anexo.caminho : `${API_URL}/uploads/${anexo.nomeArquivo}`;
                          if (isAudio) return (<Box key={anexo.id} mt={1} display="flex" alignItems="center" gap={1}><Avatar sx={{ width: 24, height: 24, bgcolor: '#9c27b0' }}><MicIcon style={{ fontSize: 14 }} /></Avatar><audio controls src={url} style={{ height: 36, maxWidth: '250px' }} /></Box>);
                          return (<Chip key={anexo.id} icon={<AttachIcon />} label={anexo.nomeOriginal.length > 20 ? anexo.nomeOriginal.substring(0, 17) + '...' : anexo.nomeOriginal} component="a" href={url} target="_blank" clickable size="small" sx={{ m: 0.5, bgcolor: 'rgba(0,0,0,0.05)' }} />)
                      })}</Box>)}
                      
                      </Paper></Box>)
                    })}
                  </Box>
                  <Box>
                    <Box display="flex" justifyContent="flex-end" mb={1}><FormControlLabel control={<Switch checked={notaInterna} onChange={(e) => setNotaInterna(e.target.checked)} color="warning" size="small" />} label={<Box display="flex" alignItems="center" gap={0.5}>{notaInterna && <LockIcon fontSize="small" color="warning" />}<Typography variant="caption" sx={{ color: notaInterna ? '#ed6c02' : 'gray', fontWeight: 'bold' }}>Nota Interna (Privado)</Typography></Box>} /></Box>
                    {files.length > 0 && (<Box mb={1} display="flex" gap={1} flexWrap="wrap">{files.map((file, i) => (<Chip key={i} label={file.name} onDelete={() => removeFile(i)} size="small" icon={<AttachIcon />} />))}</Box>)}
                    
                    <Box display="flex" gap={1} alignItems="flex-end"><input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} /><IconButton onClick={() => fileInputRef.current?.click()} sx={{ border: '1px solid #ccc', borderRadius: 1 }}><AttachIcon /></IconButton><IconButton onClick={(e) => setAnchorElMacros(e.currentTarget)} sx={{ border: '1px solid #ff9800', color: '#ff9800', borderRadius: 1 }} title="Respostas Prontas"><BoltIcon /></IconButton>
                    
                    {/* ✅ BOTÃO DE GRAVAR ÁUDIO */}
                    <AudioRecorder onAudioReady={handleAudioRecorded} />

                    <TextField 
                        fullWidth 
                        size="small" 
                        placeholder={notaInterna ? "Escreva uma nota interna..." : "Responder ao cliente..."} 
                        value={novoComentario} 
                        onChange={(e) => setNovoComentario(e.target.value)} 
                        multiline 
                        maxRows={3} 
                        sx={{ 
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: notaInterna 
                                    ? (isDark ? 'rgba(237, 108, 2, 0.15)' : '#FFF3E0') 
                                    : 'background.paper',
                                color: 'text.primary',
                            },
                            '& .MuiInputBase-input': {
                                color: 'text.primary',
                            }
                        }} 
                    />
                    <Button variant="contained" onClick={handleAddInteracao} disabled={enviandoComentario || (!novoComentario.trim() && files.length === 0)} color={notaInterna ? "warning" : "primary"}><SendIcon /></Button></Box>
                  </Box>
                </Grid>

                {/* --- COLUNA LATERAL (DIREITA) --- */}
                <Grid item xs={12} md={4}>
                    <Box mb={3}><Typography variant="subtitle2" color="text.secondary">Empresa</Typography><Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}><BusinessIcon color="primary" fontSize="small"/> {chamadoSelecionado.nomeEmpresa}</Typography></Box>
                    
                    {/* ✅ BLOCO DE ATRIBUIÇÃO */}
                    <Box mb={3}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Atribuído a
                        </Typography>
                        <Autocomplete
                            options={equipe}
                            getOptionLabel={(option) => option.nome || option}
                            value={equipe.find(u => u.nome === chamadoSelecionado.responsavel) || (chamadoSelecionado.responsavel ? { nome: chamadoSelecionado.responsavel, cor: chamadoSelecionado.responsavelCor } : null)}
                            onChange={(event, newValue) => handleTrocarResponsavel(newValue)}
                            isOptionEqualToValue={(option, value) => option.nome === (value.nome || value)}
                            renderOption={(props, option) => (
                                <li {...props}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Avatar sx={{ width: 24, height: 24, bgcolor: option.cor, fontSize: 12 }}>
                                            {option.nome?.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Typography variant="body2">{option.nome}</Typography>
                                    </Box>
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    variant="outlined" 
                                    size="small" 
                                    placeholder="Selecionar responsável..."
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: chamadoSelecionado.responsavel && (
                                            <Avatar 
                                                sx={{ 
                                                    width: 24, 
                                                    height: 24, 
                                                    mr: 1, 
                                                    ml: 0.5,
                                                    bgcolor: chamadoSelecionado.responsavelCor || '#999',
                                                    fontSize: 12
                                                }}
                                            >
                                                {chamadoSelecionado.responsavel.charAt(0).toUpperCase()}
                                            </Avatar>
                                        )
                                    }}
                                />
                            )}
                        />
                    </Box>

                    <Box mb={3}><Typography variant="subtitle2" color="text.secondary" gutterBottom>Nível de Urgência (SLA)</Typography><FormControl fullWidth size="small"><Select value={chamadoSelecionado.prioridade || 'BAIXA'} onChange={(e) => handleChangePriority(e.target.value)} sx={{ color: PRIORITY_CONFIG[chamadoSelecionado.prioridade || 'BAIXA'].color, fontWeight: 'bold', '& .MuiOutlinedInput-notchedOutline': { borderColor: PRIORITY_CONFIG[chamadoSelecionado.prioridade || 'BAIXA'].color } }}>{Object.entries(PRIORITY_CONFIG).map(([key, config]) => (<MenuItem key={key} value={key} sx={{ color: config.color, fontWeight: 'bold' }}><Box display="flex" alignItems="center" gap={1}>{config.icon} {config.label}</Box></MenuItem>))}</Select></FormControl></Box>
                    <Box mb={3}><Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="subtitle2" color="text.secondary" gutterBottom>Etiquetas (Tags)</Typography><IconButton size="small" onClick={() => setModalGerenciarTagsOpen(true)} title="Gerenciar Etiquetas"><SettingsIcon fontSize="small" /></IconButton></Box><Autocomplete multiple options={todasTags} getOptionLabel={(option) => option.nome} value={chamadoSelecionado.tags || []} onChange={(event, newValue) => { handleSalvarTags(newValue); }} renderInput={(params) => (<TextField {...params} variant="outlined" size="small" placeholder="Adicionar tags..." onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value) { const valor = e.target.value; const existe = todasTags.find(t => t.nome.toLowerCase() === valor.toLowerCase()); if (!existe) { e.preventDefault(); handleInitiateCriarTag(valor); } } }} />)} renderTags={(value, getTagProps) => value.map((option, index) => (<Chip label={option.nome} size="small" {...getTagProps({ index })} sx={{ bgcolor: option.cor, color: '#fff', fontWeight: 'bold' }} />))} noOptionsText="Digite e dê Enter para criar..." /></Box>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Contatos</Typography>
                    <List dense disablePadding>{chamadoSelecionado.emails?.map((email, idx) => (<ListItem key={idx} disableGutters><ListItemIcon sx={{ minWidth: 30 }}><EmailIcon fontSize="small" /></ListItemIcon><ListItemText primary={email.endereco} /></ListItem>))}{chamadoSelecionado.telefones?.map((tel, idx) => (<ListItem key={idx} disableGutters><ListItemIcon sx={{ minWidth: 30 }}><PhoneIcon fontSize="small" /></ListItemIcon><ListItemText primary={tel.numero} secondary={<a href={`https://wa.me/55${tel.numero.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#25D366', fontSize: '0.8rem', fontWeight: 'bold' }}>Abrir WhatsApp</a>} /></ListItem>))}</List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'space-between', bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}><Button variant="text" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDeleteOpen(true)}>Excluir</Button>{chamadoSelecionado.status !== 'FINALIZADO' && (<Button variant="contained" color="secondary" endIcon={<ArrowForwardIcon />} onClick={handleNextStep}>Mover para {COLUMNS[FLOW_ORDER[FLOW_ORDER.indexOf(chamadoSelecionado.status) + 1] as keyof typeof COLUMNS]?.title}</Button>)}</DialogActions>
          </>
        )}
      </Dialog>

      {/* ✅ MODAL CRIAR TAG */}
      <Dialog open={modalCriarTagOpen} onClose={() => setModalCriarTagOpen(false)} maxWidth="xs" fullWidth><DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LabelIcon color="primary" /> Nova Etiqueta</DialogTitle><DialogContent dividers><Box mb={2}><Typography variant="body2" color="text.secondary" gutterBottom>Nome:</Typography><Chip label={novaTagData.nome} sx={{ bgcolor: novaTagData.cor, color: '#fff', fontWeight: 'bold', fontSize: '1rem', px: 1 }} /></Box><Typography variant="body2" color="text.secondary" gutterBottom>Escolha uma cor:</Typography><Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">{TAG_COLORS.map((cor) => (<Box key={cor} onClick={() => setNovaTagData(prev => ({ ...prev, cor }))} sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: cor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: novaTagData.cor === cor ? '3px solid #333' : '2px solid transparent', transform: novaTagData.cor === cor ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s' }}>{novaTagData.cor === cor && <CheckCircleIcon sx={{ color: '#fff', fontSize: 20 }} />}</Box>))}</Box></DialogContent><DialogActions><Button onClick={() => setModalCriarTagOpen(false)} color="inherit">Cancelar</Button><Button onClick={handleConfirmarCriacaoTag} variant="contained" color="primary">Criar Tag</Button></DialogActions></Dialog>

      {/* ✅ MODAL GERENCIAR TAGS (COM EDIÇÃO DE COR) */}
      <Dialog open={modalGerenciarTagsOpen} onClose={() => setModalGerenciarTagsOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Gerenciar Etiquetas</DialogTitle>
        <DialogContent dividers>
            <List dense>
                {todasTags.length === 0 && <Typography variant="caption" align="center" display="block">Nenhuma tag criada.</Typography>}
                {todasTags.map((tag) => (
                    <ListItem key={tag.id} sx={{ mb: 1, borderBottom: '1px solid #f0f0f0' }}>
                        {editandoTagId === tag.id ? (
                            <Box display="flex" flexDirection="column" width="100%">
                                <Typography variant="caption" gutterBottom>Selecione a nova cor:</Typography>
                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                    {TAG_COLORS.map(cor => (
                                        <Box key={cor} onClick={() => handleUpdateCorTag(tag.id, cor)} sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: cor, cursor: 'pointer', border: tag.cor === cor ? '2px solid #000' : '1px solid #ddd' }} />
                                    ))}
                                </Box>
                                <Button size="small" onClick={() => setEditandoTagId(null)} sx={{ mt: 1, alignSelf: 'flex-end' }}>Cancelar</Button>
                            </Box>
                        ) : (
                            <>
                                <Chip label={tag.nome} size="small" sx={{ bgcolor: tag.cor, color: '#fff', fontWeight: 'bold', mr: 'auto' }} />
                                <IconButton size="small" onClick={() => setEditandoTagId(tag.id)} title="Editar Cor"><EditIcon fontSize="small" /></IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDeleteTag(tag.id)} title="Excluir"><DeleteIcon fontSize="small" /></IconButton>
                            </>
                        )}
                    </ListItem>
                ))}
            </List>
        </DialogContent>
        <DialogActions><Button onClick={() => setModalGerenciarTagsOpen(false)}>Fechar</Button></DialogActions>
      </Dialog>

      {/* OUTROS MODAIS (MACROS, LINKTREE, EXCLUSÃO) */}
      <Popover open={Boolean(anchorElMacros)} anchorEl={anchorElMacros} onClose={() => setAnchorElMacros(null)} anchorOrigin={{ vertical: 'top', horizontal: 'left' }} transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}><Box sx={{ width: 300, maxHeight: 400, overflow: 'auto' }}><Box p={2} bgcolor="background.paper" borderBottom={1} borderColor="divider"  display="flex" justifyContent="space-between" alignItems="center"><Typography variant="subtitle2" fontWeight="bold">Respostas Prontas</Typography><Button size="small" startIcon={<AddIcon />} onClick={() => setModalMacrosOpen(true)}>Gerenciar</Button></Box><List dense>{respostasProntas.map((macro) => (<ListItem key={macro.id} button onClick={() => handleUsarMacro(macro.texto)}><ListItemText primary={macro.titulo} secondary={macro.texto.substring(0, 40) + '...'} /></ListItem>))}</List></Box></Popover>
      <Dialog open={modalMacrosOpen} onClose={() => setModalMacrosOpen(false)} maxWidth="sm" fullWidth><DialogTitle>Gerenciar Respostas</DialogTitle><DialogContent dividers><Box display="flex" gap={2} mb={3} alignItems="flex-start"><TextField label="Título" size="small" value={novaMacro.titulo} onChange={(e) => setNovaMacro({...novaMacro, titulo: e.target.value})} /><TextField label="Texto" size="small" fullWidth multiline maxRows={3} value={novaMacro.texto} onChange={(e) => setNovaMacro({...novaMacro, texto: e.target.value})} /><Button variant="contained" onClick={handleCriarMacro}>Salvar</Button></Box><List dense>{respostasProntas.map((macro) => (<ListItem key={macro.id} secondaryAction={<IconButton edge="end" color="error" onClick={() => handleDeleteMacro(macro.id)}><DeleteIcon /></IconButton>}><ListItemText primary={macro.titulo} secondary={macro.texto} /></ListItem>))}</List></DialogContent><DialogActions><Button onClick={() => setModalMacrosOpen(false)}>Fechar</Button></DialogActions></Dialog>
      <Dialog open={modalLinksOpen} onClose={() => setModalLinksOpen(false)} maxWidth="xs" fullWidth><DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pb: 1 }}>Links & Ferramentas</DialogTitle><DialogContent><Stack spacing={2}>{SUPORTE_LINKS.map((link, idx) => (<Button key={idx} variant="outlined" component="a" href={link.url} target="_blank" startIcon={link.icon} sx={{ justifyContent: 'flex-start', py: 1.5, px: 3, color: link.color, borderColor: link.color, '&:hover': { backgroundColor: `${link.color}10`, borderColor: link.color } }}>{link.title}</Button>))}</Stack></DialogContent><DialogActions sx={{ justifyContent: 'center', pb: 2 }}><Button onClick={() => setModalLinksOpen(false)} color="inherit">Fechar</Button></DialogActions></Dialog>
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}><DialogTitle sx={{ color: '#d32f2f', display: 'flex', alignItems: 'center', gap: 1 }}><DeleteIcon /> Excluir Chamado?</DialogTitle><DialogContent><Typography>Tem certeza que deseja excluir o chamado <strong>#{chamadoSelecionado?.id}</strong>?</Typography></DialogContent><DialogActions><Button onClick={() => setConfirmDeleteOpen(false)} color="inherit">Cancelar</Button><Button onClick={handleDeleteChamado} variant="contained" color="error">Sim, Excluir</Button></DialogActions></Dialog>


     {/* ✅ MODAL DE PERFIL */}
      <UserProfileModal 
          open={modalPerfilOpen} 
          onClose={() => setModalPerfilOpen(false)} 
      />          

    </Box>
  );
}