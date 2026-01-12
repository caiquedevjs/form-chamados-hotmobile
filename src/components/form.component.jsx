import * as React from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Typography,
  Avatar,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
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

  // Função que formata o telefone (Celular ou Fixo)
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    }
    if (phoneNumberLength === 11) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7)}`;
    }
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handleChange = (field, index = null) => (event) => {
    let value = event.target.value;

    if (field === 'telefone') {
      value = formatPhoneNumber(value);
    }

    if (index !== null) {
      const updated = [...formData[field]];
      updated[index] = value;
      setFormData((prev) => ({ ...prev, [field]: updated }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
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
          pb: 4
        }}
      >
        <Box
          component="form"
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
            backgroundColor: '#ffffff',
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

          {/* --- HEADER --- */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Avatar 
              sx={{ m: '0 auto', bgcolor: 'primary.main', width: 56, height: 56, mb: 2 }}
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

          <Grid container spacing={2}>
            
            {/* ✅ NOME DA EMPRESA (CORRIGIDO) */}
            <Grid item xs={12} sm={6}>
              {/* Adicionei este container interno para simular a estrutura do telefone */}
              <Grid container spacing={1}>
                <Grid item xs={11}>
                  <TextField
                    label="Nome da empresa"
                    value={formData.nome}
                    onChange={handleChange('nome')}
                    fullWidth 
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }} 
                  />
                </Grid>
                {/* Espaço vazio (Grid item xs={1}) para alinhar com o botão de deletar dos outros campos */}
                <Grid item xs={1} />
              </Grid>
            </Grid>

            {/* Serviço */}
            <Grid item xs={12} sm={6}>
              {/* Também ajustei o serviço para manter a simetria, caso queira. Se não, pode remover o Grid container interno aqui. */}
               <Grid container spacing={1}>
                <Grid item xs={11}>
                  <MultipleSelectCheckmarks
                    value={formData.servico}
                    onChange={handleChange('servico')} 
                  />
                </Grid>
                <Grid item xs={1} />
              </Grid>
            </Grid>

            {/* Telefones */}
            <Grid item xs={12} sm={6}>
              {formData.telefone.map((tel, index) => (
                <Grid
                  container
                  spacing={1}
                  key={index}
                  alignItems="center"
                  sx={{ mb: index === formData.telefone.length - 1 ? 0 : 2 }}
                >
                  <Grid item xs={11}>
                    <TextField
                      label={`Telefone ${index + 1}`}
                      value={tel}
                      onChange={handleChange('telefone', index)}
                      fullWidth
                      inputProps={{ maxLength: 15 }}
                      placeholder="(11) 99999-9999"
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