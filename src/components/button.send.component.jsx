// button.send.component.jsx
import * as React from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';
import { toast } from 'react-toastify';

export default function LoadingButtonsTransition({ formData, setFormData }) {
  const [loading, setLoading] = React.useState(false);
  const [counter, setCounter] = React.useState(1); // ID incremental

  const handleClick = () => {
    setLoading(true);

    setTimeout(() => {
      const chamado = {
        id: counter,
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        servico: formData.servico,
        descricao: formData.descricao,
      };
      console.log('📦 Chamado enviado:', chamado);
       // 🔄 Zerar formulário
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        servico: '',
        descricao: '',
      });

      setCounter((prev) => prev + 1); // incrementa ID
      setLoading(false);
      toast.success('Chamado aberto com sucesso!');
    }, 2000);
  };

  return (
    <LoadingButton
      onClick={handleClick}
      endIcon={<SendIcon />}
      loading={loading}
      loadingPosition="end"
      variant="contained"
    >
      Enviar
    </LoadingButton>
  );
}
