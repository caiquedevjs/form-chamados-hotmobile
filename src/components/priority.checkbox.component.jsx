// components/SingleSelectService.jsx
import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

const names = ['Atendchat', 'Hotmobile', 'Hotmenu'];

export default function SingleSelectService({ value, onChange }) {
  return (
    <FormControl sx={{ m: 1, width: 215 }}>
      <InputLabel id="single-service-label">🗃️ Serviço</InputLabel>
      <Select
        labelId="single-service-label"
        id="single-service"
        value={value}
        onChange={onChange}
        input={<OutlinedInput label="🗃️ Serviço" />}
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
