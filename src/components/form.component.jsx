import * as React from 'react';
import {
  Box, Grid, TextField, Button, InputAdornment, useMediaQuery, useTheme,
  Typography, Avatar, Divider, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import MicIcon from '@mui/icons-material/Mic'; 
import AttachFileIcon from '@mui/icons-material/AttachFile';

import MultipleSelectCheckmarks from './priority.checkbox.component';
import LoadingButtonsTransition from './button.send.component';
import InputFileUpload from './button.file.upload.component';
import Footer from './Footer';
import AudioRecorder from './AudioRecorder';

export default function MultilineTextFields() {
  const theme = useTheme();
  const topRef = React.useRef();
  const [openWarning, setOpenWarning] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    nome: '',
    email: [''],
    telefone: [''],
    servico: '',
    descricao: '',
    anexos: [] 
  });

  const handleAudioRecorded = (audioFile) => {
    setFormData((prev) => ({ ...prev, anexos: [...(prev.anexos || []), audioFile] }));
  };
  
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const length = phoneNumber.length;
    if (length < 4) return phoneNumber;
    if (length < 7) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    if (length === 11) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7)}`;
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handleChange = (field, index = null) => (event) => {
    let value = event.target.value;
    if (field === 'telefone') value = formatPhoneNumber(value);
    if (index !== null) {
      const updated = [...formData[field]];
      updated[index] = value;
      setFormData((prev) => ({ ...prev, [field]: updated }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const scrollToTop = () => { topRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  const handleAddField = (field) => { setFormData((prev) => ({ ...prev, [field]: [...prev[field], ''] })); setTimeout(scrollToTop, 100); };
  const handleRemoveField = (field, index) => { setFormData((prev) => { const upd = [...prev[field]]; upd.splice(index, 1); return { ...prev, [field]: upd }; }); };
  const handleRemoveAnexo = (index) => { setFormData((prev) => { const upd = [...prev.anexos]; upd.splice(index, 1); return { ...prev, anexos: upd }; }); };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    if (validFiles.length < files.length) setOpenWarning(true);
    if (validFiles.length > 0) setFormData((prev) => ({ ...prev, anexos: [...(prev.anexos || []), ...validFiles] }));
    event.target.value = ''; 
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, px: 2, height: '100%', pb: 4 }}>
        <Box component="form" sx={{ p: 4, borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.1)', backgroundColor: '#ffffff', width: '100%', maxWidth: '800px', overflowY: 'auto', maxHeight: '85vh' }} onSubmit={(e) => e.preventDefault()} noValidate autoComplete="off">
          <div ref={topRef} />

          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Avatar sx={{ m: '0 auto', bgcolor: 'primary.main', width: 56, height: 56, mb: 2 }}><SupportAgentIcon fontSize="large" /></Avatar>
            <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>Abertura de Chamados</Typography>
            <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 'medium' }}>Hotmobile</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Preencha os dados abaixo para solicitar atendimento técnico.</Typography>
            <Divider sx={{ mt: 3 }} />
          </Box>

          <Grid container spacing={2}>
            
            {/* LINHA 1: Empresa e Serviço (Lado a Lado no Desktop) */}
            <Grid item xs={12} sm={6}>
              <TextField label="Nome da empresa" value={formData.nome} onChange={handleChange('nome')} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><BusinessIcon fontSize="small" /></InputAdornment>) }} />
            </Grid>
            <Grid item xs={12} sm={6}>
               <Box sx={{ width: '100%' }}>
                 {/* Garante que o Select ocupe 100% da largura da coluna */}
                 <MultipleSelectCheckmarks value={formData.servico} onChange={handleChange('servico')} sx={{ width: '100%' }} />
               </Box>
            </Grid>

            {/* LINHA 2: Telefones e Emails (Lado a Lado no Desktop) */}
            <Grid item xs={12} sm={6}>
              {formData.telefone.map((tel, index) => (
                <Grid container spacing={1} key={index} alignItems="center" sx={{ mb: index === formData.telefone.length - 1 ? 0 : 2 }}>
                  {/* Ajuste fino: xs={10} para o input, xs={2} para o botão para alinhar melhor */}
                  <Grid item xs={index > 0 ? 10 : 12}>
                      <TextField label={`Telefone ${index + 1}`} value={tel} onChange={handleChange('telefone', index)} fullWidth placeholder="(11) 99999-9999" InputProps={{ startAdornment: (<InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment>) }} />
                  </Grid>
                  {index > 0 && (<Grid item xs={2}><Button onClick={() => handleRemoveField('telefone', index)} color="error" fullWidth><DeleteIcon /></Button></Grid>)}
                </Grid>
              ))}
              <Button onClick={() => handleAddField('telefone')} size="small" sx={{ mt: 1 }}>+ Adicionar Telefone</Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              {formData.email.map((email, index) => (
                <Grid container spacing={1} key={index} alignItems="center" sx={{ mb: index === formData.email.length - 1 ? 0 : 2 }}>
                  <Grid item xs={index > 0 ? 10 : 12}>
                      <TextField label={`E-mail ${index + 1}`} value={email} onChange={handleChange('email', index)} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment>) }} />
                  </Grid>
                  {index > 0 && (<Grid item xs={2}><Button onClick={() => handleRemoveField('email', index)} color="error" fullWidth><DeleteIcon /></Button></Grid>)}
                </Grid>
              ))}
              <Button onClick={() => handleAddField('email')} size="small" sx={{ mt: 1 }}>+ Adicionar E-mail</Button>
            </Grid>

            {/* LINHA 3: Descrição */}
            <Grid item xs={12}>
              <TextField label="Descrição" value={formData.descricao} onChange={handleChange('descricao')} multiline rows={4} fullWidth placeholder="Descreva o chamado ou necessidade" sx={{ mt: 2 }} />
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <InputFileUpload onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" />
                <Typography variant="caption" color="text.secondary">ou</Typography>
                <AudioRecorder onAudioReady={handleAudioRecorded} />
              </Box>

              {formData.anexos && formData.anexos.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                   {formData.anexos.map((file, index) => (
                     <Chip key={index} label={file.name} onDelete={() => handleRemoveAnexo(index)} icon={file.type.includes('audio') ? <MicIcon /> : <AttachFileIcon />} color={file.type.includes('audio') ? "secondary" : "default"} variant="outlined" />
                   ))}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sx={{ textAlign: 'center', mt: 3 }}>
              <LoadingButtonsTransition formData={formData} setFormData={setFormData} />
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Footer />

      <Dialog open={openWarning} onClose={() => setOpenWarning(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ed6c02' }}><WarningAmberRoundedIcon /> Tipo Inválido</DialogTitle>
        <DialogContent><DialogContentText>Apenas arquivos JPG, JPEG, PNG e PDF são permitidos.</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setOpenWarning(false)} variant="contained" color="primary">Entendi</Button></DialogActions>
      </Dialog>
    </>
  );
}