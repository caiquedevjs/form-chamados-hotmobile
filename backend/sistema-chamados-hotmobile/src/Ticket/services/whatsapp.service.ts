import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  
  private apiUrl = 'https://api.hotmobile.com.br/Whatsapp/EnviarMensagem';
  private apiUser = 'caique.menezes@hotmobile.com.br'; 
  private apiPass = 'OCai123@'; 
  private instanciaId = 10;

  constructor(private readonly httpService: HttpService) {}

  // ... (Mantenha o método enviarAvisoInicioAtendimento existente) ...
  async enviarAvisoInicioAtendimento(telefone: string, nomeEmpresa: string, linkAcompanhamento: string) {
    const mensagemTexto = `Olá *${nomeEmpresa}*! 👋\n\nSeu chamado no Suporte Hotmobile entrou em *ATENDIMENTO*.\n\nAcompanhe aqui:\n${linkAcompanhamento}`;
    return this.enviarMensagemBase(telefone, mensagemTexto);
  }

  // ✅ NOVO MÉTODO GENÉRICO (Para Finalização e Chat)
  async enviarMensagem(telefone: string, mensagem: string) {
    return this.enviarMensagemBase(telefone, mensagem);
  }

  // ✅ MÉTODO PRIVADO PARA CENTRALIZAR O ENVIO
  private async enviarMensagemBase(telefone: string, texto: string) {
    let numeroLimpo = telefone.replace(/\D/g, ''); 
    if (numeroLimpo.length <= 11) {
       numeroLimpo = '55' + numeroLimpo; 
    }

    const payload = {
      mensagem: texto,
      instanciaId: this.instanciaId,
      listNumeros: [{ numero: numeroLimpo }]
    };

    try {
      this.logger.debug(`📞 Enviando Zap para ${numeroLimpo}...`);
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          auth: { username: this.apiUser, password: this.apiPass },
          headers: { 'Content-Type': 'application/json' },
        })
      );
      this.logger.log(`✅ WhatsApp enviado! Status: ${response.status}`);
    } catch (error) {
      this.logger.error(`❌ Erro Zap: ${error.message}`, error.response?.data);
    }
  }
}