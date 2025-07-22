import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MultipleSelectCheckmarks from './priority.checkbox.component';
import LoadingButtonsTransition from './button.send.component';


export default function MultilineTextFields() {
const [formData, setFormData] = React.useState({
  nome: '',
  email: '',
  telefone: '',
  servico: '',
  descricao: '',
});

// Função para atualizar
const handleChange = (field) => (event) => {
  setFormData((prev) => ({ ...prev, [field]: event.target.value }));
};

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        mt: 4,
      }}
    >
      <Box
        component="form"
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: '#fafafa',
          '& .MuiTextField-root': { m: 1 },
          width: '100%',
          maxWidth: '600px',
        }}
        noValidate
        autoComplete="off"
      >
        <div>
          <TextField
            id="outlined-multiline-flexible"
            label="📝 Nome da empresa"
            value={formData.nome}
           onChange={handleChange('nome')}
            multiline
            maxRows={4}
            sx={{ width: '25ch' }}
          />
          <TextField
            id="outlined-textarea"
            label="📭 Mail da empresa"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="Placeholder"
            multiline
            sx={{ width: '25ch' }}
          />
          <div style={{ display: 'flex' }}>
            <TextField
              id="outlined-multiline-flexible"
              label="📞 Telefone"
              value={formData.telefone}
              onChange={handleChange('telefone')}
              multiline
              maxRows={4}
              sx={{ width: '25ch' }}
            />
            <MultipleSelectCheckmarks
            value={formData.servico}
           onChange={handleChange('servico')} />
          </div>
          <TextField
            id="outlined-multiline-static"
            label="Descrição"
            value={formData.descricao}
            onChange={handleChange('descricao')}
            multiline
            rows={5}
            defaultValue="📢 Escreva a descrição"
            sx={{ width: '51.5ch' }}
          />
        </div>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
  <LoadingButtonsTransition formData={formData} setFormData={setFormData}/>
</Box>

      </Box>
    </Box>
  );
}
