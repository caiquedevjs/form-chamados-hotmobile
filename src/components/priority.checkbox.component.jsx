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

// ✅ Adicionei a prop 'sx' para aceitar estilos vindos de fora se precisar
export default function SingleSelectService({ value, onChange, sx }) {
  return (
    <FormControl 
      variant="outlined" 
      fullWidth // ✅ MUDANÇA: Ocupa 100% do pai (Grid xs=11)
      sx={{ mb: 1, ...sx }} // Removemos o 'width: 91%' fixo
    >
      <InputLabel
        id="single-service-label"
        // Ajuste fino para o label não bater no ícone
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }} 
      >
        Serviço
      </InputLabel>
      <Select
        labelId="single-service-label"
        id="single-service"
        value={value}
        onChange={onChange}
        input={
          <OutlinedInput
            label="Serviço" // O Label precisa bater com o InputLabel
            startAdornment={
              <InputAdornment position="start">
                <AppsIcon fontSize="small" />
              </InputAdornment>
            }
          />
        }
      >
        {names.map((name) => (
          <MenuItem key={name} value={name}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}