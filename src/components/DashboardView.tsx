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
  Warning as WarningIcon,
  Description as CsvIcon // Ícone para o CSV
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const SLA_COLORS = ['#4caf50', '#f44336'];

export default function DashboardView() {
  const theme = useTheme(); 
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  
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

  // --- NOVA FUNÇÃO: EXPORTAR CSV ---
  const handleExportCSV = () => {
    if (!metrics || !metrics.rawDetails) {
        alert("Dados detalhados não disponíveis para exportação.");
        return;
    }

    const headers = ["ID", "Status", "Prioridade", "Responsável", "Data Criação", "Data Atualização"];
    const csvRows = metrics.rawDetails.map(c => [
        c.id,
        c.status,
        c.prioridade,
        c.responsavel || 'N/A',
        new Date(c.createdAt).toLocaleString(),
        new Date(c.updatedAt).toLocaleString()
    ]);

    const csvContent = [
        headers.join(","),
        ...csvRows.map(row => row.map(value => `"${value}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_chamados_${startDate}_a_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              Métricas de performance e volumetria por horário.
            </Typography>
        </Box>
      </Box>

      {/* 2. FILTROS E EXPORTAÇÃO */}
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
        <Box display="flex" gap={1}>
            <Button variant="outlined" color="success" startIcon={<CsvIcon />} onClick={handleExportCSV}>
              Exportar CSV
            </Button>
            <Button variant="outlined" color="primary" startIcon={<DownloadIcon />} onClick={handleExportPDF}>
              Exportar PDF
            </Button>
        </Box>
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
        {loading ? (
            <Box display="flex" justifyContent="center" p={10}><CircularProgress /></Box>
        ) : !metrics ? (
            <Typography align="center" py={5} color="text.secondary">Nenhum dado encontrado.</Typography>
        ) : (
          <>
            {/* LINHA 1: KPIs */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: '5px solid #1976d2', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between"><Typography color="text.secondary" variant="subtitle2">TOTAL</Typography><Assignment color="primary" /></Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>{metrics.kpis?.total || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: '5px solid #2e7d32', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between"><Typography color="text.secondary" variant="subtitle2">RESOLVIDOS</Typography><CheckCircle color="success" /></Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>{metrics.kpis?.finalizados || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: '5px solid #ed6c02', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between"><Typography color="text.secondary" variant="subtitle2">EM ABERTO</Typography><TrendingUp color="warning" /></Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>{metrics.kpis?.pendentes || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: '5px solid #f44336', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between"><Typography color="text.secondary" variant="subtitle2">SLA VIOLADO</Typography><WarningIcon color="error" /></Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>{metrics.kpis?.slaViolado || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">{metrics.kpis?.percentualSlaOk || 100}% OK</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* LINHA 2: Volume Diário e SLA */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2}>Volume Diário</Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.timelineData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                      <XAxis dataKey="name" stroke={chartAxisColor} />
                      <YAxis allowDecimals={false} stroke={chartAxisColor} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="chamados" fill="#1976d2" radius={[4, 4, 0, 0]} name="Chamados" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2}>Status SLA</Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.slaData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {metrics.slaData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SLA_COLORS[index % SLA_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            {/* LINHA 3: NOVO GRÁFICO DE HORÁRIOS */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3, height: '350px', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2}>Volume por Faixa de Horário (Criação do Chamado)</Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                      <XAxis dataKey="name" stroke={chartAxisColor} />
                      <YAxis allowDecimals={false} stroke={chartAxisColor} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="chamados" fill="#ff9800" radius={[4, 4, 0, 0]} name="Qtd. Chamados" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            {/* LINHA 4: Tags e Equipe */}
            <Grid container spacing={3}>
               <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2}>Top 5 Tags</Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={metrics.tagsData}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} stroke={chartAxisColor} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2}>Produtividade da Equipe</Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.teamData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                      <XAxis dataKey="name" stroke={chartAxisColor} />
                      <YAxis stroke={chartAxisColor} />
                      <Tooltip contentStyle={tooltipStyle} />
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