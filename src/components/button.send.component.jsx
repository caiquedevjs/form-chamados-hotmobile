import * as React from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';
import { toast } from 'react-toastify';
import axios from 'axios'; // Certifique-se de ter instalado: npm install axios

export default function LoadingButtonsTransition({ formData, setFormData }) {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    // 1. Validação Básica (Opcional)
    if (!formData.nome || !formData.servico) {
      toast.warning('Por favor, preencha o nome da empresa e o serviço.');
      return;
    }

    setLoading(true);

    try {
      // 2. CRIAÇÃO DO FORMDATA
      const dataToSend = new FormData();

      // Campos de texto simples
      dataToSend.append('nome', formData.nome);
      dataToSend.append('servico', formData.servico);
      dataToSend.append('descricao', formData.descricao);

      // 3. Arrays (Emails e Telefones)
      // Filtramos itens vazios (.trim() !== '') para não enviar lixo pro banco
      formData.email.forEach(email => {
        if (email && email.trim() !== '') {
          dataToSend.append('emails', email);
        }
      });

      formData.telefone.forEach(tel => {
        if (tel && tel.trim() !== '') {
          dataToSend.append('telefones', tel);
        }
      });
      
      // 4. Arquivos (A PARTE CRÍTICA)
      // A chave DEVE ser 'arquivos' para bater com o Controller do NestJS
      if (formData.anexos && formData.anexos.length > 0) {
        // Convertemos FileList para Array para poder percorrer
        Array.from(formData.anexos).forEach((file) => {
          dataToSend.append('arquivos', file);
        });
      }

      // Debug: Mostra o que está sendo enviado no console
      console.log('📦 Enviando para o Backend...');

      // 5. ENVIO REAL (AXIOS)
      // O Axios detecta FormData e configura o 'multipart/form-data' automaticamente
      const response = await axios.post('http://localhost:3000/chamados', dataToSend);

      console.log('✅ Sucesso:', response.data);

      // 6. Limpeza e Sucesso
      setFormData({
        nome: '',
        email: [''],
        telefone: [''],
        servico: '',
        descricao: '',
        anexos: null, 
      });

      toast.success('Chamado aberto com sucesso!');
      
      // Rola a tela para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('❌ Erro:', error);
      
      // Tenta pegar a mensagem de erro específica do Backend (NestJS)
      const mensagemErro = error.response?.data?.message || 'Erro ao enviar chamado. Verifique a conexão.';
      
      // Se a mensagem for um array (validação do DTO), junta elas
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