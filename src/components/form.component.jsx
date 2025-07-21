import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MultipleSelectCheckmarks from './priority.checkbox.component'
import LoadingButtonsTransition from './button.send.component';



export default function MultilineTextFields() {
  return (
    <Box
      component="form"
      sx={{ '& .MuiTextField-root': { m: 1 } }}
      noValidate
      autoComplete="off"
    >
      <div>
        <TextField
          id="outlined-multiline-flexible"
          label="📝 Nome da empresa"
          multiline
          maxRows={4}
           sx={{ width: '25ch'}}
        />
        <TextField
          id="outlined-textarea"
          label="📭 Mail da empresa"
          placeholder="Placeholder"
          multiline
           sx={{ width: '25ch'}}
        />
         <div style={{display: 'flex'}}>
        <TextField
          id="outlined-multiline-flexible"
          label="📞 Telefone"
          multiline
          maxRows={4}
           sx={{ width: '25ch'}}
        />
        <MultipleSelectCheckmarks/>
      </div>
        

        
       <TextField
  id="outlined-multiline-static"
  label="Descrição"
  multiline
  rows={5}
  defaultValue="📢 Escreva a descrição"
  sx={{ width: '51.5ch'}}
/>
</div>

      <LoadingButtonsTransition/>
      
    </Box>
  );
}
