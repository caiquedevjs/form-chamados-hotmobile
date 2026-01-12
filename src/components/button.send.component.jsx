import * as React from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';
import { toast } from 'react-toastify';
import axios from 'axios'; // Certifique-se de ter instalado: npm install axios

export default function LoadingButtonsTransition({ formData, setFormData }) {
  const [loading, setLoading] = React.useState(false);

const API_URL =  'https://form-chamados-hotmobile-production.up.railway.app/';

 const handleClick = async () => {
    // 1. Validação
    if (!formData.nome || !formData.servico) {
      toast.warning('Por favor, preencha o nome da empresa e o serviço.');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = new FormData();

      dataToSend.append('nome', formData.nome);
      dataToSend.append('servico', formData.servico);
      dataToSend.append('descricao', formData.descricao);

      formData.email.forEach(email => {
        if (email && email.trim() !== '') dataToSend.append('emails', email);
      });

      formData.telefone.forEach(tel => {
        if (tel && tel.trim() !== '') dataToSend.append('telefones', tel);
      });
      
      if (formData.anexos && formData.anexos.length > 0) {
        Array.from(formData.anexos).forEach((file) => {
          dataToSend.append('arquivos', file);
        });
      }

      console.log('📦 Enviando para o Backend...');

      // 👇 CORREÇÃO AQUI: (Crase + Cifrão + Chaves)
      const response = await axios.post(`${API_URL}/chamados`, dataToSend);

      console.log('✅ Sucesso:', response.data);

      setFormData({
        nome: '',
        email: [''],
        telefone: [''],
        servico: '',
        descricao: '',
        anexos: null, 
      });

      toast.success('Chamado aberto com sucesso!');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('❌ Erro:', error);
      const mensagemErro = error.response?.data?.message || 'Erro ao enviar chamado.';
      
      if (Array.isArray(mensagemErro)) {
        toast.error(mensagemErro.join(', '));
      } else {
        toast.error(mensagemErro);
      }

    } finally {
      setLoading(false);
    }
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