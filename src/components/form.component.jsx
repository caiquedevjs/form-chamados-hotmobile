import * as React from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Typography, // Novo import
  Avatar,     // Novo import
  Divider     // Novo import
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import SupportAgentIcon from '@mui/icons-material/SupportAgent'; // Novo ícone para o header
import MultipleSelectCheckmarks from './priority.checkbox.component';
import LoadingButtonsTransition from './button.send.component';
import InputFileUpload from './button.file.upload.component';
import Footer from './Footer';

export default function MultilineTextFields() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const topRef = React.useRef();

  const [formData, setFormData] = React.useState({
    nome: '',
    email: [''],
    telefone: [''],
    servico: '',
    descricao: '',
    anexos: null
  });

  const handleChange = (field, index = null) => (event) => {
    if (index !== null) {
      const updated = [...formData[field]];
      updated[index] = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: updated }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    }
  };

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddField = (field) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], ''] }));
    setTimeout(scrollToTop, 100);
  };

  const handleRemoveField = (field, index) => {
    setFormData((prev) => {
      const updated = [...prev[field]];
      updated.splice(index, 1);
      return { ...prev, [field]: updated };
    });
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        anexos: files
      }));
      console.log(`${files.length} arquivos selecionados`);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 4,
          px: 2,
          height: '100%',
          pb: 4 // Espaço extra embaixo antes do footer
        }}
      >
        <Box
          component="form"
          sx={{
            p: 4, // Aumentei um pouco o padding interno
            borderRadius: 3, // Bordas um pouco mais arredondadas
            boxShadow: '0px 4px 20px rgba(0,0,0,0.1)', // Sombra mais suave e moderna
            backgroundColor: '#ffffff', // Fundo branco puro para destaque
            width: '100%',
            maxWidth: '800px',
            overflowY: 'auto',
            maxHeight: '85vh',
          }}
          onSubmit={(e) => e.preventDefault()}
          noValidate
          autoComplete="off"
        >
          <div ref={topRef} />

          {/* --- INÍCIO DO HEADER --- */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Avatar 
              sx={{ 
                m: '0 auto', 
                bgcolor: 'primary.main', 
                width: 56, 
                height: 56, 
                mb: 2 
              }}
            >
              <SupportAgentIcon fontSize="large" />
            </Avatar>
            
            <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              Abertura de Chamados
            </Typography>
            
            <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
              Hotmobile
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Preencha os dados abaixo para solicitar atendimento técnico.
            </Typography>

            <Divider sx={{ mt: 3 }} />
          </Box>
          {/* --- FIM DO HEADER --- */}

          <Grid container spacing={2}>
            {/* Nome da Empresa */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nome da empresa"
                value={formData.nome}
                onChange={handleChange('nome')}
                sx={{ width: '100%' }} // Ajustei para 100% para alinhar melhor
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }} />
            </Grid>

            {/* Serviço */}
            <Grid item xs={12} sm={6}>
              <MultipleSelectCheckmarks
                value={formData.servico}
                onChange={handleChange('servico')} />
            </Grid>

            {/* Telefones */}
            <Grid item xs={12} sm={6}>
              {formData.telefone.map((tel, index) => (
                <Grid
                  container
                  spacing={1}
                  key={index}
                  alignItems="center"
                  sx={{ mb: index === formData.telefone.length - 1 ? 0 : 2 }} // Margem dinâmica
                >
                  <Grid item xs={11}>
                    <TextField
                      label={`Telefone ${index + 1}`}
                      value={tel}
                      onChange={handleChange('telefone', index)}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }} />
                  </Grid>
                  <Grid item xs={1}>
                    {index > 0 && (
                      <Button
                        onClick={() => handleRemoveField('telefone', index)}
                        color="error"
                        sx={{ minWidth: 0, p: 1 }}
                        aria-label="Remover telefone"
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    )}
                  </Grid>
                </Grid>
              ))}
              <Button onClick={() => handleAddField('telefone')} size="small" sx={{ mt: 1 }}>
                + Adicionar Telefone
              </Button>
            </Grid>

            {/* E-mails */}
            <Grid item xs={12} sm={6}>
              {formData.email.map((email, index) => (
                <Grid
                  container
                  spacing={1}
                  key={index}
                  alignItems="center"
                  sx={{ mb: index === formData.email.length - 1 ? 0 : 2 }}
                >
                  <Grid item xs={11}>
                    <TextField
                      label={`E-mail ${index + 1}`}
                      value={email}
                      onChange={handleChange('email', index)}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }} />
                  </Grid>
                  <Grid item xs={1}>
                    {index > 0 && (
                      <Button
                        onClick={() => handleRemoveField('email', index)}
                        color="error"
                        sx={{ minWidth: 0, p: 1 }}
                        aria-label="Remover e-mail"
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    )}
                  </Grid>
                </Grid>
              ))}
              <Button onClick={() => handleAddField('email')} size="small" sx={{ mt: 1 }}>
                + Adicionar E-mail
              </Button>
            </Grid>

            {/* Descrição */}
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                value={formData.descricao}
                onChange={handleChange('descricao')}
                multiline
                rows={4}
                fullWidth
                placeholder="Descreva o chamado ou necessidade"
                sx={{ mt: 2 }}
              />
              
              <Box sx={{ mt: 2 }}>
                <InputFileUpload onChange={handleFileChange} />
              </Box>

              {/* Dica visual: Mostrar nomes dos arquivos selecionados */}
              {formData.anexos && (
                <Box sx={{ mt: 1, p: 1, bgcolor: '#f0f0f0', borderRadius: 1 }}>
                   <Typography variant="caption" color="text.secondary">
                     Arquivos: {Array.from(formData.anexos).map(f => f.name).join(', ')}
                   </Typography>
                </Box>
              )}
            </Grid>

            {/* Botão de envio */}
            <Grid item xs={12} sx={{ textAlign: 'center', mt: 3 }}>
              <LoadingButtonsTransition
                formData={formData}
                setFormData={setFormData} />
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Footer />
    </>
  );
}