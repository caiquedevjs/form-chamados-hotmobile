import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  
  // 👇 COLOCAR SUA API KEY AQUI (Idealmente use process.env.RESEND_API_KEY)
  private resend = new Resend('re_haBMqw7k_P3FqaY2Z4vj7rMLrgGWXn6m2'); 

  constructor() {}

  // --- MÉTODOS PÚBLICOS (Mantidos iguais para não quebrar o resto do app) ---

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

  // --- MÉTODO DE ENVIO VIA API HTTP (RESEND) ---
  private async enviarEmailBase(emailDestino: string, assunto: string, html: string) {
    try {
      this.logger.debug(`📧 Enviando email via Resend para ${emailDestino}...`);
      
      const data = await this.resend.emails.send({
        // 🚨 MODO GRATUITO: Você OBRIGATORIAMENTE tem que usar este email como remetente
        // Depois de configurar o domínio 'hotmobile.com.br' no painel do Resend, você poderá mudar.
        from: 'Suporte Hotmobile <onboarding@resend.dev>', 
        
        // No modo gratuito, você só pode enviar para o email que cadastrou a conta (caique...)
        to: [emailDestino], 
        subject: assunto,
        html: html,
      });

      if (data.error) {
          this.logger.error(`❌ Resend recusou: ${data.error.message}`);
          return;
      }

      this.logger.log(`✅ Email enviado com sucesso! ID: ${data.data?.id}`);
    } catch (error) {
      this.logger.error(`❌ Erro crítico no envio: ${error.message}`);
    }
  }
}