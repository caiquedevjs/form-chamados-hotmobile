import { Module } from '@nestjs/common';
import { ChamadosController } from '../controllers/chamados.controller';
import { ChamadosService } from '../services/chamados.service';
import { PrismaService } from 'src/prisma.service';
import { ChamadosGateway } from '../services/chamados.gateway';
import { MailService } from '../services/mail.service';
import { WhatsappService } from '../services/whatsapp.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [ChamadosController],
  providers: [ChamadosService, PrismaService, ChamadosGateway, MailService, WhatsappService],
})
export class ChamadosModule {}
