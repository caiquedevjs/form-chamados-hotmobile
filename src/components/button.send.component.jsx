// button.send.component.jsx

import * as React from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';
import { toast } from 'react-toastify';
// Importe axios se for usar, ou use fetch
// import axios from 'axios'; 

export default function LoadingButtonsTransition({ formData, setFormData }) {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => { // Note o async se for fazer requisição real
    setLoading(true);

    // 1. CRIAÇÃO DO FORMDATA (O Envelope Especial)
    const dataToSend = new FormData();

    // 2. Adicionar campos de texto simples
    dataToSend.append('nome', formData.nome);
    dataToSend.append('servico', formData.servico);
    dataToSend.append('descricao', formData.descricao);

    // 3. Adicionar Arrays (Emails e Telefones)
    // FormData não aceita arrays direto. Você tem duas opções comuns:
    // Opção A: Enviar a mesma chave várias vezes (Backend recebe como lista)
    formData.email.forEach(email => dataToSend.append('emails', email));
    formData.telefone.forEach(tel => dataToSend.append('telefones', tel));
    
    // 4. Adicionar o(s) Arquivo(s) [A PARTE CRÍTICA]
    if (formData.anexos && formData.anexos.length > 0) {
      // Como é FileList, percorremos e adicionamos cada um
      for (let i = 0; i < formData.anexos.length; i++) {
        dataToSend.append('arquivos', formData.anexos[i]);
      }
    }

  
    for (var pair of dataToSend.entries()) {
         console.log(pair[0]+ ', ' + pair[1]); 
     }

    try {
      // SIMULAÇÃO DO ENVIO (Substitua isso pela chamada real ao backend)
      console.log('📦 Enviando FormData...');
      
      // EXEMPLO DE CHAMADA REAL (Axios detecta FormData e ajusta os headers automaticamente)
      // await axios.post('http://localhost:3000/api/chamados', dataToSend);

      // Timeout simulando a rede
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Sucesso
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
      console.error(error);
      toast.error('Erro ao enviar chamado');
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