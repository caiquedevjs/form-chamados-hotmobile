import { Module } from '@nestjs/common';
import { ChamadosController } from '../controllers/chamados.controller';
import { ChamadosService } from '../services/chamados.service';
import { PrismaService } from 'src/prisma.service';
import { ChamadosGateway } from '../services/chamados.gateway';

@Module({
  imports: [],
  controllers: [ChamadosController],
  providers: [ChamadosService, PrismaService, ChamadosGateway],
})
export class ChamadosModule {}
