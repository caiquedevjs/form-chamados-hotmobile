import * as React from 'react';
import {
  OutlinedInput,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  InputAdornment,
} from '@mui/material';
import AppsIcon from '@mui/icons-material/Apps';

const names = ['Atendchat', 'Hotmobile', 'Hotmenu'];

export default function MultipleSelectCheckmarks({ value, onChange, sx }) { // Receba o sx aqui
  return (
    <div>
      <FormControl 
        fullWidth // <--- ISSO É O MAIS IMPORTANTE!
        sx={{ ...sx }} // <--- Para aceitar estilos vindos de fora
      >
        <InputLabel>Serviços</InputLabel>
        <Select
          multiple
          value={value}
          onChange={onChange}
          // ... resto das props
        >
          {/* ... menus items ... */}
        </Select>
      </FormControl>
    </div>
  );
}
