import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private apiUrl = 'https://api.hotmobile.com.br/Email/EnviarEmail';
  
  // Credenciais
  private apiUser = 'caique.menezes@hotmobile.com.br'; 
  private apiPass = 'OCai123@'; 
  
  private remetenteNome = 'Suporte Hotmobile';
  
  // ⚠️ CORREÇÃO 1: Use o mesmo email da autenticação ou um @hotmobile.com.br válido.
  // Emails externos (@outlook, @gmail) costumam ser rejeitados pela API.
  private remetenteEmail = 'caique.menezes@hotmobile.com.br';

  constructor(private readonly httpService: HttpService) {}

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

    const payload = {
      html: corpoHtml,
      dataEnvio: new Date().toISOString(),
      agendada: false, // ⚠️ CORREÇÃO 2: 'false' para envio imediato
      quemMandaNome: this.remetenteNome,
      quemMandaEmail: this.remetenteEmail,
      assuntoEmail: '🚀 Seu chamado iniciou o atendimento!',
      listEmails: [
        { email: emailDestino }
      ]
    };

    try {
      this.logger.debug(`📧 Tentando enviar email de ${this.remetenteEmail} para ${emailDestino}...`);

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
      
      // 👇 DEBUG: Mostra o que a API respondeu
      this.logger.log(`📡 Status API Email: ${response.status}`);
      
      // Algumas APIs retornam 200 mas com "erro: true" no body
      if (response.data && (response.data.erro || response.data.error)) {
         this.logger.error(`❌ API recusou o envio: ${JSON.stringify(response.data)}`);
      } else {
         this.logger.log(`✅ Email enviado com sucesso! Resposta: ${JSON.stringify(response.data)}`);
      }

    } catch (error) {
      // Captura o erro detalhado vindo da API (400, 401, 500)
      const erroDetalhado = error.response?.data;
      
      this.logger.error(
        `❌ Erro na requisição de Email`, 
        erroDetalhado ? JSON.stringify(erroDetalhado) : error.message
      );
    }
  }
}