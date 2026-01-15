import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly API_URL = 'https://api.hotmobile.com.br/Email/EnviarEmailChamados';

  // 👇 CREDENCIAIS (Idealmente, coloque isso no .env depois)
  private readonly API_USER = 'caique.menezes@hotmobile.com.br';
  private readonly API_PASS = 'OCai123@';

  constructor(private readonly httpService: HttpService) {}

  // --- MÉTODOS PÚBLICOS (Mantidos) ---

  async enviarAvisoInicioAtendimento(emailDestino: string, nomeEmpresa: string, linkAcompanhamento: string) {
    const corpoHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #1976d2;">Olá, ${nomeEmpresa}!</h2>
          <p>Temos boas notícias. Um de nossos técnicos iniciou o atendimento.</p>
          <div style="margin: 25px 0;">
            <a href="${linkAcompanhamento}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Acompanhar Chamado
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">Link: ${linkAcompanhamento}</p>
          <hr>
          <p>Atenciosamente,<br><strong>Equipe Hotmobile</strong></p>
        </div>
      `;
    return this.enviarEmailBase(emailDestino, '🚀 Seu chamado iniciou o atendimento!', corpoHtml);
  }

  async enviarNotificacaoGenerica(emailDestino: string, assunto: string, mensagem: string, linkAcao?: string) {
    const corpoHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #2e7d32;">Atualização do Chamado</h2>
        <p style="font-size: 16px;">${mensagem}</p>
        
        ${linkAcao ? `
        <div style="margin: 25px 0;">
          <a href="${linkAcao}" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Ver Chamado
          </a>
        </div>
        <p style="font-size: 12px; color: #666;">Link: ${linkAcao}</p>
        ` : ''}
        
        <hr>
        <p>Atenciosamente,<br><strong>Equipe Hotmobile</strong></p>
      </div>
    `;

    return this.enviarEmailBase(emailDestino, assunto, corpoHtml);
  }

  // --- MÉTODO PRIVADO DE ENVIO ---
  private async enviarEmailBase(emailDestino: string, assunto: string, html: string) {
    
    const payload = {
      html: html,
      dataEnvio: new Date().toISOString(),
      agendada: false,
      quemMandaNome: "Suporte Hotmobile",
      quemMandaEmail: "suporte@hotmobile.com.br",
      assuntoEmail: assunto,
      listEmails: [
        { email: emailDestino }
      ]
    };

    // 👇 A MÁGICA ACONTECE AQUI
    // Transforma "usuario:senha" em Base64 para Autenticação Básica
    const tokenBase64 = Buffer.from(`${this.API_USER}:${this.API_PASS}`).toString('base64');

    const config = {
      headers: {
        'Authorization': `Basic ${tokenBase64}`, // Envia cabeçalho Basic Auth
        'Content-Type': 'application/json'
      }
    };

    try {
      this.logger.debug(`📧 Tentando autenticar como: ${this.API_USER}`);
      this.logger.debug(`📧 Disparando para: ${emailDestino}`);

      const response = await firstValueFrom(
        this.httpService.post(this.API_URL, payload, config)
      );

      // Loga a resposta para vermos se deu certo ("erro": false)
      this.logger.warn(`🔍 RESPOSTA DA API: ${JSON.stringify(response.data)}`);

      if (response.data && response.data.erro) {
         this.logger.error(`❌ A API recusou: ${response.data.mensagemRetorno}`);
      } else {
         this.logger.log(`✅ Email enviado e aceito pela Hotmobile!`);
      }

      return response.data;

    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      this.logger.error(`❌ Erro HTTP ${status}. Detalhes: ${JSON.stringify(data)}`);
    }
  }
}