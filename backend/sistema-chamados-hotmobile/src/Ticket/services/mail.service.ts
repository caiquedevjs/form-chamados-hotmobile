import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  // Configurações do Gmail
  private gmailUser = 'enviarelatorio@gmail.com'; // Seu Gmail ou Google Workspace
  // 🚨 IMPORTANTE: Use uma "Senha de App" gerada no painel do Google, não sua senha de login.
  private gmailPass = 'xrvxumksopgvbsvh'; 
  private remetenteNome = 'Suporte Hotmobile';

  constructor() {
    // Configura o transporte SMTP do Gmail
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: this.gmailUser,
        pass: this.gmailPass,
      },
      tls: {
        rejectUnauthorized: false // Ajuda em alguns ambientes de desenvolvimento
      },
      connectionTimeout: 10000, 
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
  }

  // ... (Mantenha o método enviarAvisoInicioAtendimento existente - A lógica HTML não muda) ...
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

  // ✅ NOVO MÉTODO GENÉRICO (Mantido igual)
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

  // ✅ MÉTODO PRIVADO ATUALIZADO PARA NODEMAILER (SMTP)
  private async enviarEmailBase(emailDestino: string, assunto: string, html: string) {
    try {
      this.logger.debug(`📧 Enviando email (Gmail) para ${emailDestino}...`);
      
      const info = await this.transporter.sendMail({
        from: `"${this.remetenteNome}" <${this.gmailUser}>`, // Ex: "Suporte Hotmobile" <email@gmail.com>
        to: emailDestino,
        subject: assunto,
        html: html,
      });

      this.logger.log(`✅ Email enviado! ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar email: ${error.message}`, error.stack);
    }
  }
}