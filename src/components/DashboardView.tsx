import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Grid, Paper, Typography, Button, CircularProgress, Card, CardContent, 
  TextField, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow 
} from '@mui/material';
import { 
  Download as DownloadIcon, TrendingUp, CheckCircle, Assignment,
  FilterAlt as FilterIcon, ArrowBack as ArrowBackIcon, Warning as WarningIcon,
  TableChart as TableIcon
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
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

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

  const handleExportCSV = () => {
    if (!metrics?.rawDetails) return;
    const headers = ["ID", "Status", "Prioridade", "Responsável", "Criado Em"];
    const rows = metrics.rawDetails.map(c => [
      c.id, c.status, c.prioridade, c.responsavel, new Date(c.createdAt).toLocaleString()
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_detalhado_${startDate}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: isDark ? '#1e1e1e' : '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`dashboard_${startDate}.pdf`);
  };

  const chartAxisColor = isDark ? '#dddddd' : '#666666';
  const chartGridColor = isDark ? '#444444' : '#e0e0e0';
  const tooltipStyle = { borderRadius: '8px', border: 'none', backgroundColor: isDark ? '#333' : '#fff', color: isDark ? '#fff' : '#000' };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, width: '100%', maxWidth: '1400px', mx: 'auto', mt: 4 }}>
      {/* CABEÇALHO */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/admin')} sx={{ mr: 2 }}><ArrowBackIcon /></IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">Dashboard Analítico</Typography>
            <Typography variant="body2" color="text.secondary">Relatório dinâmico de performance e chamados</Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<TableIcon />} onClick={handleExportCSV}>Exportar CSV</Button>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExportPDF}>PDF</Button>
        </Box>
      </Box>

      {/* FILTROS */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, display: 'flex', gap: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <TextField label="Início" type="date" size="small" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <TextField label="Fim" type="date" size="small" InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <Button variant="contained" startIcon={<FilterIcon />} onClick={fetchMetrics}>Atualizar Dados</Button>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      ) : (
        <Box ref={printRef}>
          {/* KPIs */}
          <Grid container spacing={3} mb={4}>
            {[
              { label: 'TOTAL', val: metrics.kpis.total, icon: <Assignment />, color: '#1976d2' },
              { label: 'RESOLVIDOS', val: metrics.kpis.finalizados, icon: <CheckCircle />, color: '#2e7d32' },
              { label: 'EM ABERTO', val: metrics.kpis.pendentes, icon: <TrendingUp />, color: '#ed6c02' },
              { label: 'SLA VIOLADO', val: metrics.kpis.slaViolado, icon: <WarningIcon />, color: '#f44336', sub: `${metrics.kpis.percentualSlaOk}% OK` }
            ].map((kpi, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card sx={{ borderLeft: `5px solid ${kpi.color}` }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="caption" fontWeight="bold">{kpi.label}</Typography>
                    <Typography variant="h4" fontWeight="bold">{kpi.val}</Typography>
                    {kpi.sub && <Typography variant="caption" color="text.secondary">{kpi.sub}</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* GRÁFICOS DE VOLUME */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 3, height: 400 }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">Volume Diário de Chamados</Typography>
                <ResponsiveContainer>
                  <BarChart data={metrics.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                    <XAxis dataKey="name" stroke={chartAxisColor} />
                    <YAxis stroke={chartAxisColor} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="chamados" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 3, height: 400 }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">Picos por Faixa de Horário (Criação)</Typography>
                <ResponsiveContainer>
                  <BarChart data={metrics.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                    <XAxis dataKey="name" stroke={chartAxisColor} />
                    <YAxis stroke={chartAxisColor} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="chamados" fill="#ff9800" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* RELATÓRIO DETALHADO (A TABELA DINÂMICA) */}
          <Typography variant="h6" fontWeight="bold" mb={2}>Relatório Detalhado do Período</Typography>
          <TableContainer component={Paper} sx={{ mb: 4, maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Data/Hora</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Responsável</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Prioridade</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics.rawDetails?.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                    <TableCell>#{row.id.toString().slice(-5)}</TableCell>
                    <TableCell>{row.responsavel || 'Não atribuído'}</TableCell>
                    <TableCell>{row.prioridade}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}