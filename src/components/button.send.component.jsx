import * as React from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';
import { toast } from 'react-toastify';

export default function LoadingButtonsTransition({ formData, setFormData }) {
  const [loading, setLoading] = React.useState(false);
  const [counter, setCounter] = React.useState(1);

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

      // Limpa o formulário
      setFormData({
        nome: '',
        email: [''],
        telefone: [''],
        servico: '',
        descricao: '',
      });

      setCounter((prev) => prev + 1);
      setLoading(false);
      toast.success('Chamado aberto com sucesso!');

      // ⬆️ Força rolagem pro topo do formulário, se quiser passar por prop também
      window.scrollTo({ top: 0, behavior: 'smooth' });

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
