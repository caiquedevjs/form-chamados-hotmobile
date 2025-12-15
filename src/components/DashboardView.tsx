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
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function DashboardView() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Padrão: Hoje e 7 dias atrás
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);

  const printRef = useRef<HTMLDivElement>(null);

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
    
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`relatorio_${startDate}_ate_${endDate}.pdf`);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, width: '100%', maxWidth: '1200px', marginTop : 80}}>
      
      {/* 1. CABEÇALHO E FILTROS */}
      <Box display="flex" alignItems="center" mb={10}>
        <IconButton onClick={() => navigate('/admin')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          Dashboard Gerencial
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
        
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

          <Button 
            variant="contained" 
            startIcon={<FilterIcon />}
            onClick={fetchMetrics}
            sx={{ height: '40px' }}
          >
            Filtrar
          </Button>
        </Box>

        <Box sx={{ flexGrow: 1 }} /> 

        <Button 
          variant="outlined" 
          color="primary"
          startIcon={<DownloadIcon />} 
          onClick={handleExportPDF}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          Exportar PDF
        </Button>
      </Paper>

      {/* --- ÁREA DE CONTEÚDO (IMPRESSÃO) --- */}
      <div ref={printRef} style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        
        <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap">
          <Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
              Resumo de Atendimentos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Período: <strong>{new Date(startDate).toLocaleDateString('pt-BR')}</strong> até <strong>{new Date(endDate).toLocaleDateString('pt-BR')}</strong>
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Gerado em: {new Date().toLocaleString()}
          </Typography>
        </Box>

        {loading ? (
           <Box display="flex" justifyContent="center" p={10}><CircularProgress /></Box>
        ) : !metrics ? (
           <Typography align="center" py={5}>Sem dados para exibir.</Typography>
        ) : (
          <>
            {/* 1. KPIs - CARDS */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderLeft: '5px solid #1976d2', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography color="text.secondary" variant="subtitle2">TOTAL</Typography>
                      <Assignment color="primary" />
                    </Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>{metrics.kpis.total}</Typography>
                    <Typography variant="caption" color="text.secondary">Chamados no período</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderLeft: '5px solid #2e7d32', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography color="text.secondary" variant="subtitle2">FINALIZADOS</Typography>
                      <CheckCircle color="success" />
                    </Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>{metrics.kpis.finalizados}</Typography>
                    <Typography variant="caption" color="text.secondary">Concluídos com sucesso</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderLeft: '5px solid #ed6c02', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography color="text.secondary" variant="subtitle2">PENDENTES</Typography>
                      <TrendingUp color="warning" />
                    </Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>{metrics.kpis.pendentes}</Typography>
                    <Typography variant="caption" color="text.secondary">Em aberto ou atendimento</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* 2. GRÁFICOS */}
            <Grid container spacing={3}>
              {/* Gráfico de Barras */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, height: '450px', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" mb={2}>Volume Diário de Chamados</Typography>
                  <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.timelineData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                        <Tooltip 
                          cursor={{ fill: '#f5f5f5' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="chamados" fill="#1976d2" radius={[4, 4, 0, 0]} barSize={40} name="Chamados" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>

              {/* Gráfico de Pizza */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '450px', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" mb={2}>Distribuição por Status</Typography>
                  <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {metrics.statusData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </div>
    </Box>
  );
}