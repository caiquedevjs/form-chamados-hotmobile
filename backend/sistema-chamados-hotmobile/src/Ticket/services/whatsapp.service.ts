import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config'; // 1. Importar ConfigService
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  
  
  // 2. Apenas declarar as variáveis (sem valor fixo)
  private apiUrl: string;
  private apiUser: string;
  private apiPass: string;
  private instanciaId: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService // 3. Injetar o ConfigService
  ) {
    // 4. Carregar os valores do .env no construtor
    this.apiUrl = this.configService.getOrThrow<string>('HOTMOBILE_API_URL');
    this.apiUser = this.configService.getOrThrow<string>('HOTMOBILE_API_USER');
    this.apiPass = this.configService.getOrThrow<string>('HOTMOBILE_API_PASS');
    this.instanciaId = Number(this.configService.getOrThrow<string>('HOTMOBILE_INSTANCIA_ID'));

    // Validação de segurança (opcional, mas recomendado)
    if (!this.apiUser || !this.apiPass) {
      this.logger.error('❌ AS CREDENCIAIS DA HOTMOBILE NÃO FORAM CONFIGURADAS NO .ENV');
    }
  }

  async enviarAvisoInicioAtendimento(telefone: string, nomeEmpresa: string, linkAcompanhamento: string) {
    const mensagemTexto = `Olá *${nomeEmpresa}*! 👋\n\nSeu chamado no Suporte Hotmobile entrou em *ATENDIMENTO*.\n\nAcompanhe aqui:\n${linkAcompanhamento}`;
    return this.enviarMensagemBase(telefone, mensagemTexto);
  }

  async enviarMensagem(telefone: string, mensagem: string) {
    return this.enviarMensagemBase(telefone, mensagem);
  }

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