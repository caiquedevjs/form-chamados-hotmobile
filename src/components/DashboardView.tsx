import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Grid, Paper, Typography, Button, CircularProgress, Card, CardContent, TextField, IconButton 
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  TrendingUp, 
  CheckCircle, 
  Assignment,
  FilterAlt as FilterIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTheme } from '@mui/material/styles';

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const SLA_COLORS = ['#4caf50', '#f44336']; // Verde (Ok), Vermelho (Violado)

export default function DashboardView() {
  const theme = useTheme(); 
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filtro padrão: Últimos 30 dias
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);

  const printRef = useRef(null);

  useEffect(() => {
    fetchMetrics();
  }, []); 

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/chamados/dashboard/metrics?start=${startDate}&end=${endDate}`);
      setMetrics(response.data);
    } catch (error) {
      console.error("Erro ao buscar métricas", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    const element = printRef.current;
    
    const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff' 
    });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`dashboard_${startDate}.pdf`);
  };

  // --- ESTILOS DINÂMICOS ---
  const chartAxisColor = isDark ? '#dddddd' : '#666666';
  const chartGridColor = isDark ? '#444444' : '#e0e0e0';
  const tooltipStyle = { 
      borderRadius: '8px', 
      border: 'none', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      backgroundColor: isDark ? '#333' : '#fff',
      color: isDark ? '#fff' : '#000'
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, width: '100%', maxWidth: '1400px', mx: 'auto', mt: 4 }}>
      
      {/* 1. CABEÇALHO */}
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton onClick={() => navigate('/admin')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              Dashboard Analítico
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visão geral de SLA, produtividade e volume.
            </Typography>
        </Box>
      </Box>

      {/* 2. FILTROS */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', bgcolor: 'background.paper' }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField 
            label="Data Início" 
            type="date" 
            size="small"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField 
            label="Data Fim" 
            type="date" 
            size="small"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button variant="contained" startIcon={<FilterIcon />} onClick={fetchMetrics} sx={{ height: '40px' }}>
            Atualizar
          </Button>
        </Box>
        <Box sx={{ flexGrow: 1 }} /> 
        <Button variant="outlined" color="primary" startIcon={<DownloadIcon />} onClick={handleExportPDF} sx={{ width: { xs: '100%', md: 'auto' } }}>
          Exportar PDF
        </Button>
      </Paper>

      {/* 3. ÁREA DE DADOS */}
      <Box 
        ref={printRef} 
        sx={{ 
            p: 3, 
            bgcolor: isDark ? 'background.default' : '#f8f9fa', 
            borderRadius: 2,
            border: isDark ? '1px solid #333' : '1px solid #e0e0e0'
        }}
      >
        <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-end">
            <Typography variant="h6" fontWeight="bold" color="text.primary">Métricas do Período</Typography>
            <Typography variant="caption" color="text.secondary">Gerado em: {new Date().toLocaleString()}</Typography>
        </Box>

        {loading ? (
            <Box display="flex" justifyContent="center" p={10}><CircularProgress /></Box>
        ) : !metrics ? (
            <Typography align="center" py={5} color="text.secondary">Nenhum dado encontrado.</Typography>
        ) : (
          <>
            {/* LINHA 1: KPIs (Cartões) */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: '5px solid #1976d2', height: '100%', bgcolor: 'background.paper' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between"><Typography color="text.secondary" variant="subtitle2">TOTAL</Typography><Assignment color="primary" /></Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: 'text.primary' }}>{metrics.kpis?.total || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: '5px solid #2e7d32', height: '100%', bgcolor: 'background.paper' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between"><Typography color="text.secondary" variant="subtitle2">RESOLVIDOS</Typography><CheckCircle color="success" /></Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: 'text.primary' }}>{metrics.kpis?.finalizados || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: '5px solid #ed6c02', height: '100%', bgcolor: 'background.paper' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between"><Typography color="text.secondary" variant="subtitle2">EM ABERTO</Typography><TrendingUp color="warning" /></Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: 'text.primary' }}>{metrics.kpis?.pendentes || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: '5px solid #f44336', height: '100%', bgcolor: 'background.paper' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between"><Typography color="text.secondary" variant="subtitle2">SLA VIOLADO</Typography><WarningIcon color="error" /></Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: 'text.primary' }}>{metrics.kpis?.slaViolado || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">{metrics.kpis?.percentualSlaOk || 100}% dentro do prazo</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* LINHA 2: Gráficos Principais (Volume e SLA) */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2} color="text.primary">Volume Diário</Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} stroke={chartAxisColor} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} stroke={chartAxisColor} />
                      <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5' }} contentStyle={tooltipStyle} />
                      <Bar dataKey="chamados" fill="#1976d2" radius={[4, 4, 0, 0]} barSize={40} name="Chamados" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2} color="text.primary">SLA (Prazo de Atendimento)</Typography>
                  <Box flexGrow={1} position="relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.slaData || [{ name: 'Sem dados', value: 1 }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(metrics.slaData || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={SLA_COLORS[index % SLA_COLORS.length]} stroke={isDark ? '#333' : '#fff'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">{metrics.kpis?.percentualSlaOk || 0}%</Typography>
                        <Typography variant="caption" color="text.secondary">OK</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* LINHA 3: Operacional (Tags e Equipe) */}
            <Grid container spacing={3}>
               <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '450px', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2} color="text.primary">Top 5 Tags (Assuntos)</Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={metrics.tagsData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} stroke={chartAxisColor} tick={{ fontSize: 12 }} />
                      <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5' }} contentStyle={tooltipStyle} />
                      <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} name="Ocorrências">
                        {(metrics.tagsData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '450px', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2} color="text.primary">Produtividade da Equipe</Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.teamData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                      <XAxis dataKey="name" stroke={chartAxisColor} />
                      <YAxis allowDecimals={false} stroke={chartAxisColor} />
                      <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5' }} contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="resolvidos" stackId="a" fill="#4caf50" name="Resolvidos" />
                      <Bar dataKey="pendentes" stackId="a" fill="#ff9800" name="Em Aberto" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

          </>
        )}
      </Box>
    </Box>
  );
}