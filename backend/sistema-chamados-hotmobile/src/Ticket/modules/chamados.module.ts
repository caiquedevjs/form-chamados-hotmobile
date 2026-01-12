/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ChamadosController } from '../controllers/chamados.controller';
import { ChamadosService } from '../services/chamados.service';
import { PrismaService } from 'src/prisma.service';
import { ChamadosGateway } from '../services/chamados.gateway';
import { MailService } from '../services/mail.service';
import { WhatsappService } from '../services/whatsapp.service';
import { HttpModule } from '@nestjs/axios';
import { SupabaseService } from 'src/supabase/supabase.service';

@Module({
  imports: [HttpModule],
  controllers: [ChamadosController],
  providers: [
    ChamadosService, 
    PrismaService, 
    ChamadosGateway, 
    MailService, 
    WhatsappService, 
    
    // ✅ MUDANÇA AQUI:
    // Em vez de apenas 'SupabaseService', usamos esta estrutura:
    {
      provide: 'STORAGE_SERVICE', // O "Crachá" (Token)
      useClass: SupabaseService,  // Quem trabalha de verdade hoje
    }
  ],
})
export class ChamadosModule {}