import * as React from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import MultipleSelectCheckmarks from './priority.checkbox.component';
import LoadingButtonsTransition from './button.send.component';

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

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        mt: 4,
        px: 2,
        height: '100%',
      }}
    >
      <Box
        component="form"
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: '#fafafa',
          width: '100%',
          maxWidth: '800px',
          overflowY: 'auto',
          maxHeight: '80vh',
        }}
        onSubmit={(e) => e.preventDefault()}
        noValidate
        autoComplete="off"
      >
        <div ref={topRef} />

        <Grid container spacing={2}>
          {/* Nome da Empresa */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nome da empresa"
              value={formData.nome}
              onChange={handleChange('nome')}
              sx={{ width: '91%' }} 
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Serviço */}
          <Grid item xs={12} sm={6}>
            <MultipleSelectCheckmarks
              value={formData.servico}
              onChange={handleChange('servico')}
            />
          </Grid>

          {/* Telefones */}
          <Grid item xs={12} sm={6}>
            {formData.telefone.map((tel, index) => (
              <Grid
                container
                spacing={1}
                key={index}
                alignItems="center"
                sx={{ mb: 3 }}
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
                    }}
                  />
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
                sx={{ mb: 3 }}
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
                    }}
                  />
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                  
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Botão de envio */}
          <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
            <LoadingButtonsTransition
              formData={formData}
              setFormData={setFormData}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
