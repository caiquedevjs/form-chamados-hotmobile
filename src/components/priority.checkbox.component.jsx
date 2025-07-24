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

export default function SingleSelectService({ value, onChange }) {
  return (
    <FormControl  variant="outlined" sx={{ mb: 1, width: '91%' }}>
      <InputLabel
        id="single-service-label"
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
            label="Serviço"
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
