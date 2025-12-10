import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  
  // ⚙️ CONFIGURAÇÕES HOTMOBILE
  private apiUrl = 'https://api.hotmobile.com.br/Whatsapp/EnviarMensagem';
  
  // 👇 Suas credenciais
  private apiUser = 'caique.menezes@hotmobile.com.br'; 
  private apiPass = 'OCai123@'; 
  
  private instanciaId = 10;

  constructor(private readonly httpService: HttpService) {}

  async enviarAvisoInicioAtendimento(telefone: string, nomeEmpresa: string, linkAcompanhamento: string) {
    // 1. Limpeza do número
    let numeroLimpo = telefone.replace(/\D/g, ''); 
    
    // ⚠️ CORREÇÃO IMPORTANTE: Geralmente APIs exigem o 55 (Brasil).
    // O seu código anterior estava fazendo "numeroLimpo = numeroLimpo" (não fazia nada).
    // Se no Postman funcionou sem 55, a API pode estar assumindo, mas o padrão seguro é enviar.
    // Vou deixar comentado o 55 para ficar igual ao seu Postman, mas verifique isso!
    
    if (numeroLimpo.length <= 11) {
        // Se tem 10 ou 11 dígitos (ex: 71988372142), adiciona o 55 do Brasil
        numeroLimpo = '55' + numeroLimpo; 
    }

    // Log para você conferir se o número está chegando certo
    this.logger.debug(`📞 Tentando enviar para o número formatado: ${numeroLimpo}`);

    const mensagemTexto = `Olá *${nomeEmpresa}*! 👋\n\nSeu chamado no Suporte Hotmobile entrou em *ATENDIMENTO*.\n\nAcompanhe e fale com o técnico aqui:\n${linkAcompanhamento}`;

    const payload = {
      mensagem: mensagemTexto,
      centroDeCusto: "",
      idExterno: "",
      arquivoWhatsApp: "",
      instanciaId: this.instanciaId,
      listNumeros: [
        { numero: numeroLimpo }
      ]
    };

    try {
      // Faz a requisição e guarda a resposta
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          auth: {
            username: this.apiUser,
            password: this.apiPass
          },
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      
      // 👇 AQUI ESTÁ O SEGREDO DO DEBUG
      // Vamos logar o que a API respondeu. Muitas vezes ela diz o erro aqui.
      this.logger.log(`📡 Status da API: ${response.status}`);
      this.logger.log(`📦 Resposta da API: ${JSON.stringify(response.data)}`);

      // Verifica se a API retornou algum erro lógico (ex: success: false)
      // Ajuste essa checagem conforme o padrão da Hotmobile
      if (response.data && response.data.erro) {
         this.logger.error(`❌ A API aceitou a requisição mas retornou erro: ${JSON.stringify(response.data)}`);
      } else {
         this.logger.log(`✅ WhatsApp enviado com sucesso para ${numeroLimpo}`);
      }

    } catch (error) {
      // Captura erros de rede ou status 4xx/5xx
      this.logger.error(
        `❌ Falha na requisição para ${numeroLimpo}`, 
        error.response?.data || error.message
      );
    }
  }
}