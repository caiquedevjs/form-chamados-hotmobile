import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly API_URL = 'https://api.hotmobile.com.br/Whatsapp/EnviarEmailChamados';

  // Injetamos o HttpService para fazer a requisição POST
  constructor(private readonly httpService: HttpService) {}

  // --- MÉTODOS PÚBLICOS (Mantidos IGUAIS para compatibilidade) ---

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
    // Chama o novo método base
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

  // --- NOVO MÉTODO DE ENVIO VIA API HOTMOBILE ---
  private async enviarEmailBase(emailDestino: string, assunto: string, html: string) {
    
    // Monta o body exatamente como a API pede
    const payload = {
      html: html,
      dataEnvio: new Date().toISOString(), // Data atual em formato string
      agendada: false, // False para enviar agora
      quemMandaNome: "Suporte Hotmobile",
      quemMandaEmail: "caique.menezes@hotmobile.com.br", // Ajuste conforme necessário
      assuntoEmail: assunto,
      listEmails: [
        {
          email: emailDestino
        }
      ]
    };

    try {
      this.logger.debug(`📧 Disparando via API Hotmobile para: ${emailDestino}`);

      // Faz o POST usando HttpService e converte o Observable para Promise
      const response = await firstValueFrom(
        this.httpService.post(this.API_URL, payload)
      );

      this.logger.log(`✅ Email enviado com sucesso! Status: ${response.status}`);
      return response.data;

    } catch (error) {
      // Tratamento de erro detalhado para Axios
      const status = error.response?.status;
      const data = error.response?.data;
      this.logger.error(`❌ Erro ao enviar email via API Hotmobile. Status: ${status}`, data);
    }
  }
}