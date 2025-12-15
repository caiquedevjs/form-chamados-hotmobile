import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private apiUrl = 'https://api.hotmobile.com.br/Email/EnviarEmail';
  private apiUser = 'caique.menezes@hotmobile.com.br'; 
  private apiPass = 'OCai123@'; 
  private remetenteNome = 'Suporte Hotmobile';
  private remetenteEmail = 'caique.menezes@hotmobile.com.br';

  constructor(private readonly httpService: HttpService) {}

  // ... (Mantenha o método enviarAvisoInicioAtendimento existente) ...
  async enviarAvisoInicioAtendimento(emailDestino: string, nomeEmpresa: string, linkAcompanhamento: string) {
     // ... (seu código atual fica aqui) ...
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

  // ✅ NOVO MÉTODO GENÉRICO (Para Finalização e Chat)
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

  // ✅ MÉTODO PRIVADO PARA EVITAR REPETIÇÃO DE CÓDIGO
  private async enviarEmailBase(emailDestino: string, assunto: string, html: string) {
    const payload = {
      html: html,
      dataEnvio: new Date().toISOString(),
      agendada: false,
      quemMandaNome: this.remetenteNome,
      quemMandaEmail: this.remetenteEmail,
      assuntoEmail: assunto,
      listEmails: [{ email: emailDestino }]
    };

    try {
      this.logger.debug(`📧 Enviando email para ${emailDestino}...`);
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          auth: { username: this.apiUser, password: this.apiPass },
          headers: { 'Content-Type': 'application/json' },
        })
      );
      this.logger.log(`✅ Email enviado! Status: ${response.status}`);
    } catch (error) {
      this.logger.error(`❌ Erro email: ${error.message}`, error.response?.data);
    }
  }
}