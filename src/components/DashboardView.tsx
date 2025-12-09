import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Grid, Paper, Typography, Button, CircularProgress, Card, CardContent, TextField 
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  TrendingUp, 
  CheckCircle, 
  Assignment,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function DashboardView() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // --- NOVOS ESTADOS PARA DATA ---
  // Padrão: Hoje e 7 dias atrás
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMetrics();
  }, []); // Carrega inicial (padrão 7 dias)

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Passamos as datas como Query Params
      const response = await axios.get(`http://localhost:3000/chamados/dashboard/metrics?start=${startDate}&end=${endDate}`);
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
    
    // Melhora a qualidade do print
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    // Nome do arquivo com as datas
    pdf.save(`relatorio_${startDate}_ate_${endDate}.pdf`);
  };

  return (
    <Box sx={{ p: 4, width: '100%', maxWidth: '1200px' }}>
      
      {/* 1. ÁREA DE FILTROS (Não sai no PDF, fica fora da ref) */}
      <Paper sx={{ p: 2, mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ mr: 2 }}>Filtros:</Typography>
        
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
        >
          Filtrar
        </Button>

        <Box sx={{ flexGrow: 1 }} /> {/* Espaçador */}

        <Button 
          variant="outlined" 
          color="secondary"
          startIcon={<DownloadIcon />} 
          onClick={handleExportPDF}
        >
          Baixar PDF
        </Button>
      </Paper>

      {/* --- ÁREA DE IMPRESSÃO (O que está aqui sai no PDF) --- */}
      <div ref={printRef} style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        
        <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-end">
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              Relatório de Chamados
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Período de análise: <strong>{new Date(startDate).toLocaleDateString('pt-BR')}</strong> até <strong>{new Date(endDate).toLocaleDateString('pt-BR')}</strong>
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Gerado em: {new Date().toLocaleString()}
          </Typography>
        </Box>

        {loading ? (
           <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
        ) : !metrics ? (
           <Typography>Sem dados para exibir.</Typography>
        ) : (
          <>
            {/* 1. KPIs */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderLeft: '5px solid #1976d2' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Total no Período</Typography>
                      <Assignment color="primary" />
                    </Box>
                    <Typography variant="h3" fontWeight="bold">{metrics.kpis.total}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderLeft: '5px solid #2e7d32' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Finalizados</Typography>
                      <CheckCircle color="success" />
                    </Box>
                    <Typography variant="h3" fontWeight="bold">{metrics.kpis.finalizados}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderLeft: '5px solid #ed6c02' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Pendentes</Typography>
                      <TrendingUp color="warning" />
                    </Box>
                    <Typography variant="h3" fontWeight="bold">{metrics.kpis.pendentes}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* 2. Gráficos */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, height: '400px' }}>
                  <Typography variant="h6" mb={2}>Volume Diário</Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={metrics.timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="chamados" fill="#1976d2" name="Chamados" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '400px' }}>
                  <Typography variant="h6" mb={2}>Status</Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={metrics.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {metrics.statusData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </div>
    </Box>
  );
}